# Codever MCP Server — Authentication & Opt-In Note Creation

This document captures how AI clients (Claude Desktop, Cursor, VS Code, ChatGPT
desktop, etc.) authenticate against the **Codever MCP server**. Production uses
OAuth 2.1 with PKCE; the dev-only access-token helper is retained for local
testing. Connections are read-only by default. Markdown note creation requires
both `mcpServer` and `mcpCreateNotes` per-user toggles plus `mcp:read` and optional
`mcp:write` scopes. There are no MCP update/delete or bookmark-creation tools.

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

## 2. Authorization model (three layers)

A bearer token does **not** grant unlimited power — it grants exactly what the
**resource servers that accept it** are willing to do. "Do whatever you want" is
only true if you hand out a full-power token (like the one the Angular app uses)
that write endpoints accept. So: **never reuse the frontend token — mint a
dedicated, minimal one**, and enforce authorization across three independent layers.

### Layer 1 — Narrow tools and independent per-user gates

Read-only connections expose exactly three tools:

- `search_entries`
- `get_entry`
- `list_tags`

`create_note` is a fourth tool only for users enabled in both allowlists with
both scopes. The committed `mcpCreateNotes.enabledUserIds` is empty. Missing or
malformed configuration denies creation. Eligibility is rechecked at execution,
so removing the user blocks subsequent saves with the same token or cached tool
list. This does not cancel a save already admitted. Reads continue when only
creation is disabled; disabling `mcpServer` denies the entire endpoint.

Creation accepts only title, Markdown content (up to 30,000 characters), optional
tags, reference, origin (`location`, `file`, `project`, `workspace`) and boolean
`public`. Ownership comes from the token. It defaults to private, rejects
internal/notebook/collection fields, and treats metadata as data, not fetch instructions.

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
API** — it only opens the scoped MCP surface. Even an MCP write token must not
include the ordinary `bookmarks-api` audience.

### Layer 3 — Explicit scopes at discovery and execution

The endpoint requires `mcp:read`; creation also requires `mcp:write`. Resource
metadata advertises both but grants neither. Missing/invalid/wrong-audience
tokens receive HTTP 401 with an OAuth challenge. Missing read scope or disabled
whole-server access receives HTTP 403. Creation-only denial is an MCP error and
does not disable reads. Creation handler failures return `isError: true` without
stack traces or success links.

---

## 3. Keycloak setup for `codever-mcp`

Create a new client in the `bookmarks` realm:

| Setting | Value |
|---|---|
| Client ID | `codever-mcp` |
| Client type | Public (PKCE) for OAuth flow |
| Standard flow | Enabled (for Option A OAuth 2.1) |
| Redirect URIs | Loopback URIs used by desktop MCP hosts, e.g. `http://localhost:*/callback` |
| Default client scope | `mcp:read` |
| Optional client scope | `mcp:write` (never default) |
| Audience mapper | Add audience `codever-mcp` to issued tokens |

Define a realm/client scope **`mcp:read`** and map it into the token so the MCP
server can assert it.

On the **API** side (`env.json` Keycloak block), add:

```json
"verify-token-audience": true
```

so `bookmarks-api` only accepts tokens minted for it.

### Local development (docker-compose)

The `codever-mcp` client, default `mcp:read` and optional `mcp:write` scopes are committed to the
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
- **Already-imported realm:** Keycloak skips import when the realm exists. Apply
  a non-destructive update in the local Admin Console or Admin API: create
  `mcp:write` with Include in token scope enabled and no audience mapper; assign
  it only to `codever-mcp` as **Optional**. Do not make it a realm/client default,
  recreate the realm, or delete database volumes. Preserve existing users and
  the MCP-only audience mapper. Changing this JSON does not update a running realm.

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
npm run dev:mcp:token                      # default read-only request
npm run dev:mcp:token -- --write           # explicit optional write request
# eval "$(bash dev-only/mcp-token.sh --export)"
# eval "$(bash dev-only/mcp-token.sh --write --export)"  # either option order
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

> **Explicit update required.** For an existing realm, add the redirect URIs
> non-destructively in the local Admin Console (http://localhost:8480/auth →
> `bookmarks` → Clients → `codever-mcp` → Valid redirect URIs). Do not wipe volumes.

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
       "frontendBaseUrl": "https://www.codever.dev",
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
client**, which provides the isolated resource grant. A DCR-registered client
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
client-registration policy — weakening audience/scope isolation. Use VS Code or
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
  with writes limited to authorized creation for that same user.

---

## 7. Preview guidance and retry risk

Before calling `create_note`, the agent should show the title, **full** Markdown
draft/code, tags, visibility, reference and supplied project context; obtain
confirmation; incorporate revisions; then save and present the returned link.
Do not invent or upload unsolicited local metadata. Strongly prefer at most
**eight** relevant tags where possible; **thirteen normalized unique tags** is the
hard ceiling. Existing nine-to-thirteen-tag notes remain valid. Tags are trimmed,
lowercased and deduplicated, never silently truncated.

Preview rendering and confirmation depend on the agent/client, **not a server
approval workflow**. An authorized direct call succeeds without a draft or
confirmation token. Prompt injection can still cause an authorized write; use
host approvals and minimal grants. Creation is **non-idempotent**: a lost response
may hide a successful save. Do not retry blindly; search/read to check first.

Results contain saved metadata and an authenticated `/my-notes/<id>/details`
URL, not the full content or a public sharing token. `mcp.frontendBaseUrl` must
be an absolute HTTP(S) frontend base without credentials, query or fragment.
It is validated before saving and is independent of `mcp.publicBaseUrl` (API).
Already-open browser tabs follow normal refresh/cache behavior; no cross-client
cache invalidation is provided. Origin is available through authorized `get_entry`.

## 8. Local-first verification runbook

1. Start the repository's Docker Compose identity/database services locally.
   On a fresh realm only, enable its documented import command for first startup;
   for an existing realm apply the non-destructive optional-scope update above.
2. Create ignored `apps/codever-api/env.json` from `env.json.example` if missing,
   keeping local identity/database settings. Set `mcp.frontendBaseUrl` to
   `http://localhost:4200` and `mcp.publicBaseUrl` to `http://localhost:3000`.
   Run `npm run backend` and `npm run frontend` at the repository root (or `npm start`).
3. Add only the local test user's token `sub` to the local `mcpServer` and
   `mcpCreateNotes` allowlists. Never commit local creation enablement or copy it
   into production; the tracked creation allowlist must remain empty.
4. Use the helper without `--write` and inspect the decoded token claims locally
   without recording tokens: require `mcp:read`, no `mcp:write`, and MCP-only
   audience (no `bookmarks-api`). Verify three tools and a denied direct creation.
5. Use `--write` (optionally `--export`). Verify both scopes and unchanged audience.
   With both toggles enabled there should be four tools. Enablement alone does
   not grant scopes, and requesting scopes does not enable toggles.
6. For a supported OAuth host (VS Code/Cursor), connect to
   `http://localhost:3000/api/mcp` with registered client ID `codever-mcp`. First
   verify a read-only session. To opt in, explicitly request `mcp:write` using the
   host's scope/authorization controls and reauthorize. Check actual token claims
   and tool discovery; host versions differ and advertised scopes are not proof
   of an explicit grant. If the host cannot request selected optional scopes,
   use the helper for local testing rather than promoting write to a default.
   Existing sessions are not automatically write-enabled by this deployment.
7. Preview a private Markdown note with snippets, tags and explicit project context
   in chat; confirm; create; read it back; follow the returned port-4200 link while
   signed in. Refresh the ordinary UI list. Confirm no public sharing token,
   notebook or collection was created. Verify thirteen tags succeed and fourteen
   fail without persistence; ordinary REST/UI editing uses the same independent policy.
8. Remove the test user from `mcpCreateNotes` while retaining `mcpServer`. With the
   **same write token**, subsequent creation must fail and reads must still work.
   Saved notes and thirteen-tag editing remain available. This is creation-only
   rollback; no restart or token expiry is required. Restore the empty allowlist.

Run focused unit tests with `npx jest --runInBand --testPathPattern='(mcp.*|feature-toggle.service).test.js'`
from `apps/codever-api`, then the targeted authenticated integration suites.
Stubbed helper/config tests do not prove live Keycloak token claims or OAuth-host
behavior. Record those smoke results separately; unavailable checks are not passes.

Production rollout is a **separate explicit deployment action after local verification**:
configure optional `mcp:write`, frontend base, selected user eligibility and explicit
host reauthorization. Never enable Direct Access Grants for production testing.

