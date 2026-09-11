# Codever MCP Server — Authentication & Read-Only Security Model

This document captures how AI clients (Claude Desktop, Cursor, VS Code, ChatGPT
desktop, etc.) authenticate against the **Codever MCP server**. Production uses
OAuth 2.1 with PKCE; the dev-only access-token helper is retained for local
testing. The MCP server is read-only, so an agent cannot create/update/delete a
user's bookmarks, notes, or snippets.

> Status: implementation and deployment reference for the MCP integration. Use
> for the MCP presentation and production setup.

---

## 1. Where the token comes from

The MCP server is a separate **bearer-only resource server in the `bookmarks`
Keycloak realm**. Its audience is `codever-mcp`, not `bookmarks-api`. OAuth
clients obtain short-lived access tokens from Keycloak and refresh them
themselves.

### Options for obtaining a token

| Option | Use case | UX |
|---|---|---|
| **A. OAuth 2.1 flow** (production) | Host opens browser login against Keycloak, stores and auto-refreshes tokens | No copying |
| **B. Dev-only access token** | `apps/codever-api/dev-only/mcp-token.sh` | Short-lived token for local testing |

There is intentionally no Codever-generated production offline-token endpoint
in the current scope. This avoids storing or exchanging long-lived refresh
credentials in Codever.

---

## 2. Read-only security model (three layers)

A bearer token does **not** grant unlimited power — it grants exactly what the
**resource servers that accept it** are willing to do. "Do whatever you want" is
only true if you hand out a full-power token (like the one the Angular app uses)
that write endpoints accept. So: **never reuse the frontend token — mint a
dedicated, minimal one**, and enforce read-only across three independent layers.

### Layer 1 — Read-only by construction (primary guarantee)

The MCP server exposes **only read tools**:

- `search_entries`
- `get_entry`
- `list_tags`

There is **no** create/update/delete tool in the code. This is the guarantee
that matters most because it does not depend on trusting the model or the token:

- If the LLM misbehaves, or
- a malicious note contains prompt-injection ("delete all my bookmarks"),

…there is **no code path** from the MCP surface to a write. You cannot misuse a
capability that isn't wired up.

### Layer 2 — Scope the token so it cannot reach write endpoints

The existing API routes only call `keycloak.protect()` + `UserIdValidator` —
they do **not** check per-operation scopes. So a valid `bookmarks-api` token
would be accepted by `DELETE /bookmarks/:id`. That is why the MCP token must NOT
be a `bookmarks-api`-audience token.

1. Register a dedicated OAuth client **`codever-mcp`** in the `bookmarks` realm.
2. Issue access tokens for the MCP resource with audience = `codever-mcp` (not
   `bookmarks-api`), with the read scope `mcp:read`.
3. Enable **`verify-token-audience: true`** on the main API's Keycloak adapter
   so the write API **rejects** any token whose audience isn't `bookmarks-api`.

Result: even if the connection token leaks, it is **not accepted by the write
API** — it only opens the MCP server, which only has read tools. Two locks,
different keys.

### Layer 3 — Per-tool scope check (defense-in-depth / future-proofing)

Inside the MCP server, require the `mcp:read` scope before any tool runs. This is
belt-and-suspenders today (all tools are read), but future-proofs the design: if
a write tool is ever added, it would demand a separate `mcp:write` scope that the
settings-generated token simply does not carry.

---

## 3. Keycloak setup for `codever-mcp`

Create a new client in the `bookmarks` realm:

| Setting | Value |
|---|---|
| Client ID | `codever-mcp` |
| Client type | Public (PKCE) for OAuth flow |
| Standard flow | Enabled (for Option B OAuth 2.1) |
| Redirect URIs | Loopback URIs used by desktop MCP hosts, e.g. `http://localhost:*/callback` |
| Client scope | `mcp:read` (add as an **optional** or **default** scope) |
| Audience mapper | Add audience `codever-mcp` to issued tokens |

Define a realm/client scope **`mcp:read`** and map it into the token so the MCP
server can assert it.

On the **API** side (`env.json` Keycloak block), add:

```json
"verify-token-audience": true
```

so `bookmarks-api` only accepts tokens minted for it.

### Local development (docker-compose)

The `codever-mcp` client and `mcp:read` client scope are committed to the
imported realm file
`docker-compose-setup/keycloak-export-import/bookmarks-realm.json` (public client,
PKCE `S256`, loopback redirect URIs, and an audience mapper adding `codever-mcp`).

**Prefer editing the realm import JSON directly** over creating the client in the
admin console and re-exporting: a full realm re-export produces huge, noisy diffs
and can include environment-specific IDs and masked `"secret": "**********"`
values that break re-import. For a single well-defined client, a minimal
hand-written entry is cleaner and reviewable.

Applying it:

- **Fresh setup:** `docker-compose up` with `--import-realm` imports the client
  automatically.
- **Already-imported realm:** Keycloak skips import when the realm exists. Either
  recreate it (`docker-compose down -v` to wipe the postgres volume, then
  `docker-compose up`), or add the client once in the admin console
  (http://localhost:8480/auth, `admin/Pa55w0rd`) to match the JSON.

Fetch a read-only offline token for local testing (direct access grant):

```bash
curl -s \
  -d 'client_id=codever-mcp' \
  -d 'username=mock' \
  -d 'password=mock' \
  -d 'grant_type=password' \
  -d 'scope=openid offline_access' \
  'http://localhost:8480/auth/realms/bookmarks/protocol/openid-connect/token' \
| jq -r '.access_token'
```

Or use the helper script, which prints your Keycloak `sub` (to add to
`feature-toggles.json`) together with the token:

```bash
cd apps/codever-api
npm run mcp:token                 # defaults to the mock/mock dev user
# MCP_USER=ama MCP_PASS=ama npm run mcp:token
# eval "$(./dev-only/mcp-token.sh --export)"   # sets $MCP_TOKEN in your shell
```

Then call the MCP endpoint (JSON-RPC over Streamable HTTP):

```bash
TOKEN=... # from the call above
curl -s http://localhost:3000/api/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

> **Where does the refresh happen?**
> In production, the MCP host performs OAuth with Keycloak and stores the refresh
> credential. Codever receives short-lived access tokens and does not store the
> user's refresh token. The local helper intentionally returns only a short-lived
> access token for development testing; it is not a production connection method.

> The user must be listed in `feature-toggles.json` under `mcpServer.enabledUserIds`
> (use their Keycloak `sub`) or the endpoint returns a JSON-RPC 403.

### Connecting VS Code locally via OAuth

`.vscode/mcp.json` only needs the URL — VS Code discovers Keycloak from the 401
`WWW-Authenticate` challenge and the protected-resource metadata:

```jsonc
{ "servers": { "codever": { "type": "http", "url": "http://localhost:3000/api/mcp" } } }
```

**Dynamic Client Registration (DCR) vs manual client ID.** VS Code first tries
DCR. Keycloak's *Trusted Hosts* client-registration policy blocks anonymous DCR
by default, and VS Code's `https://vscode.dev/redirect` host cannot be satisfied
by that policy — so VS Code shows:

> *Dynamic Client Registration not supported … Do you want to proceed by
> manually providing a client registration (client ID)?*

This is expected. Choose **Yes** and enter the pre-registered client ID:

```text
codever-mcp
```

For this to work, the `codever-mcp` client's redirect URIs must include the ones
VS Code uses. They are committed to the dev realm:

```text
http://localhost:*
http://127.0.0.1:*
https://vscode.dev/redirect
https://insiders.vscode.dev/redirect
```

> **Re-import required.** Keycloak skips import when the realm already exists, so
> after changing the client either recreate the realm
> (`docker-compose down -v && docker-compose up`) or add the redirect URIs
> manually in the admin console (http://localhost:8480/auth → `bookmarks` realm →
> Clients → `codever-mcp` → Valid redirect URIs).

In production, prefer pre-registering `codever-mcp` (predictable and safer than
opening anonymous DCR) and enter it the same way, or enable tightly restricted
DCR if you specifically need zero-config onboarding.

---

## 4. Production deployment checklist

The production realm is separate from the imported development realm. Configure
the following in the production `bookmarks` realm before enabling MCP for users:

1. Create or configure a public client named `codever-mcp`.
2. Enable Standard Flow and require PKCE with `S256`.
3. Add the redirect URIs required by the MCP hosts you support. Do not use a
   broad wildcard in production; verify the exact loopback callback patterns
   supported by the client version.
4. Create the `mcp:read` client scope. Set its realm-level **Type to Optional**
   (so it is not auto-added to every client such as `bookmarks-api`), enable
   **Include in token scope**, then on the `codever-mcp` client add it with
   **Assigned type: Default**.
5. Add an audience mapper (on the `codever-mcp-dedicated` scope) that puts
   `codever-mcp` in the access-token `aud` claim.
6. Keep Direct Access Grants disabled in production; it is only a local testing
   convenience. Do not set a custom `access.token.lifespan` (VS Code refreshes).
7. (Optional) Set the client **Login theme** to `codever` so the browser login
   is Codever-branded (Client → Settings → Login settings → Login theme).
8. Configure the API's production `env.json` with:

   ```json
   {
     "keycloak": {
       "realm": "bookmarks",
       "auth-server-url": "https://www.codever.dev/auth",
       "resource": "bookmarks-api",
       "verify-token-audience": true
     },
     "mcp": {
       "publicBaseUrl": "https://www.codever.dev",
       "keycloak": { "resource": "codever-mcp" }
     }
   }
   ```

The API exposes both of these protected-resource metadata URLs:

```text
https://www.codever.dev/.well-known/oauth-protected-resource
https://www.codever.dev/.well-known/oauth-protected-resource/api/mcp
```

They point clients to the Keycloak issuer:

```text
https://www.codever.dev/auth/realms/bookmarks
```

The production nginx configuration proxies these metadata endpoints and
`/api/mcp` without response buffering. After deployment, verify the metadata
before enabling the feature toggle:

```bash
curl -fsS https://www.codever.dev/.well-known/oauth-protected-resource | jq
curl -i https://www.codever.dev/api/mcp
```

The second command should return `401` and include a `WWW-Authenticate` header
containing `resource_metadata`.

For an existing Keycloak realm, changing the import JSON does not update the
realm automatically. Apply the equivalent settings through the production
Admin Console or Keycloak Admin API; the development realm JSON is only the
reproducible local configuration.

---

## 5. OAuth client configuration

For OAuth-capable clients, configure the MCP server URL. The client should
discover the protected-resource metadata and open the Keycloak login flow:

```jsonc
// Client-specific configuration varies; the important value is the URL:
{
  "mcpServers": {
    "codever": {
      "type": "http",
      "url": "https://www.codever.dev/api/mcp"
    }
  }
}
```

```jsonc
// Cursor: .cursor/mcp.json  •  VS Code: .vscode/mcp.json — same shape
```

No token is pasted; the host discovers Keycloak via the MCP server's OAuth
metadata and runs a browser login. For local development, use the dev-only
helper and a client/header configuration only while testing OAuth discovery.

### 5.1 Client compatibility (static client vs. Dynamic Client Registration)

Codever deliberately uses a **pre-registered public client (`codever-mcp`)**
rather than anonymous Dynamic Client Registration (DCR). The audience mapper
(`aud: codever-mcp`) and the `mcp:read` default scope are attached **to that
client**, which is what guarantees the read-only model. A DCR-registered client
would get neither, so its tokens would be rejected with `insufficient_scope`.

Consequences per client:

| Client | Behaviour | Works against prod? |
|---|---|---|
| **VS Code** | Tries DCR, then falls back to a *"provide client ID manually"* prompt — enter `codever-mcp` | ✅ Yes |
| **Cursor** | Same manual client-ID fallback as VS Code | ✅ Yes |
| **GitHub Copilot CLI** | **DCR only** — no manual client-ID prompt; DCR is blocked by Keycloak's *Trusted Hosts* policy → `403 … Host not trusted` | ❌ Not currently |

The Copilot CLI failure is a **CLI-side gap** (no static-client-ID support for
OAuth-protected HTTP MCP servers), not a Codever misconfiguration. We do **not**
open anonymous DCR to work around it, because that would require moving the
audience/scope mappers onto a shared scope and loosening the *Trusted Hosts*
client-registration policy — weakening the read-only guarantees. Use VS Code or
Cursor with the manual client ID `codever-mcp` until the CLI supports specifying
a pre-registered OAuth client.

---

## 6. Settings UX

- **Settings → Connect AI clients → Connect with OAuth**
- Gate the connection guidance behind the `mcpServer` feature toggle
  (`feature-toggles.json` → `mcpServer.enabledUserIds`), consistent with the
  existing `aiNoteRefine` toggle mechanism.
- The user can revoke the OAuth client session through Keycloak/account security.
- The token is **per-user**: the `sub` claim drives the same per-user filtering
  the personal routes already use, so it can only ever see *that user's* data,
  read-only.

---

## 7. Summary

Read-only is guaranteed by **architecture, not trust**:

1. **No write tools** in the MCP server (capability does not exist).
2. **Audience/scope isolation** so the token can't hit the write API even if leaked.
3. **Per-tool scope checks** for future-proofing.

Combined, "the chat can't unexpectedly mishandle other bookmarks/notes" holds
even against a rogue model or prompt injection.

