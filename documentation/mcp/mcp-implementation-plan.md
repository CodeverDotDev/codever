# Codever AI Assistant + MCP — Implementation Plan

This plan delivers, in feature-toggled increments:

1. A **read-only MCP server** that can be tested locally with the existing
   dev-only access-token helper.
2. A production-ready **OAuth 2.1** connection (no copy/paste).
3. A **frontend "Ask Codever" chat** reached by a direct, toggled `🤖 Assistant`
   nav link (in-app DeepSeek RAG), with **MCP** connection guidance kept in User
   Settings for power users — each independently feature-toggled, exactly like the
   existing `aiNoteRefine` feature. (No two-card chooser dialog — see Phase 3.)

> Companion doc: `documentation/mcp/mcp-auth.md` (auth & read-only security model).

---

## Guiding principles

- **Reuse existing patterns.** Router → Service (no controller), Keycloak
  `keycloak.protect()`, `feature-toggles.json` + `feature-toggle.service.js`,
  `MatDialog` on the frontend, `superagent` DeepSeek calls like `ai-refine.service.js`.
- **Read-only by construction.** The MCP server exposes only read tools.
- **Everything behind a toggle**, per-user, matching `aiNoteRefine`.

---

## Feature toggles (foundation for all phases)

Extend the existing mechanism rather than inventing a new one.

### Backend

`apps/codever-api/feature-toggles.json`
```json
{
  "aiNoteRefine": { "enabledUserIds": ["..."] },
  "aiAssistant":  { "enabledUserIds": [] },
  "mcpServer":    { "enabledUserIds": [] }
}
```

`apps/codever-api/src/common/feature-toggle.service.js` — generalize:
```js
// isFeatureEnabled(featureName, userId) reads feature-toggles.json
// getFeatureToggles(userId) reads the file ONCE and returns all toggles:
//   { aiNoteRefine, aiAssistant, mcpServer }
// keep isAiNoteRefineEnabled(userId) etc. as thin wrappers for backward-compat
```

`apps/codever-api/src/routes/feature-toggle/feature-toggle.router.js` — a single
batch endpoint (the frontend is the only consumer, so no per-feature routes):
```
GET /api/feature-toggle   -> { aiNoteRefine, aiAssistant, mcpServer }
```
Server-side toggle checks (MCP token endpoint, assistant route) use the service
helpers directly (`isMcpServerEnabled` / `isAiAssistantEnabled`), not HTTP.

### Frontend

`apps/codever-ui/src/app/core/feature-toggle.service.ts` — fetch all toggles with
ONE cached request; the individual getters derive from it:
```ts
getFeatureToggles(): Observable<FeatureToggles>   // GET /feature-toggle (shareReplay(1))
isAiNoteRefineEnabled(): Observable<boolean>       // map(t => t.aiNoteRefine)
isAiAssistantEnabled(): Observable<boolean>        // map(t => t.aiAssistant)
isMcpServerEnabled(): Observable<boolean>          // map(t => t.mcpServer)
```

---

## Phase 1 — Read-only MCP server + local development authentication

### 1.1 MCP server (read-only tools) — ✅ implemented

New area `apps/codever-api/src/mcp/`:
```
mcp/
  mcp-tools.service.js   # read-only tools: searchEntries / getEntry / listTags (+ tests)
  mcp.auth.js            # user id (sub) + scopes + mcpServer toggle gate
  mcp.server.js          # McpServer (SDK) exposing the 3 tools; stateless Streamable HTTP
```
- Uses `@modelcontextprotocol/sdk` (v1.30) + `zod`.
- Tools call existing search/personal services (never Mongoose models), scoped to the
  authenticated `userId`. No create/update/delete tools exist (read-only by construction).
- Mounted in `app.js` at `POST /api/mcp`, Keycloak-protected, gated per-user by the
  `mcpServer` feature toggle.
- Tested: `mcp-tools.service.test.js` (13) + `mcp.server.test.js` (4, end-to-end via
  in-memory client/server transport). Full API suite green (128 tests).

### 1.2 Keycloak client

Register `codever-mcp` in the `bookmarks` realm (public + PKCE), add `mcp:read`
scope + audience mapper. Enable `verify-token-audience: true` on the API adapter
so `bookmarks-api` rejects MCP-audience tokens. (Full detail in `mcp-auth.md`.)

### 1.3 Production connection tokens — deferred

Do not implement a Codever-generated offline-token or manual production-token
endpoint at this stage. It would require storing or securely referencing a
long-lived refresh credential, and OAuth is the intended production flow.

For local development, use the dev-only helper:
`apps/codever-api/dev-only/mcp-token.sh`. It generates a short-lived access token
for testing and does not require a database record.

### 1.4 Settings UI (connection guidance)

In `apps/codever-ui/src/app/user/user-settings/`, add an "AI clients (MCP)" section,
visible only when `isMcpServerEnabled()`:
- Explain that production clients will connect through OAuth.
- Show the production MCP server URL when OAuth support is available.
- Link to local-development instructions for the dev-only access-token helper.
- Do not generate or display a long-lived production token.

### 1.5 Deliverable

A toggled local-development user can connect an MCP client with the dev-only
access token and ask questions over their own bookmarks/notes/snippets. Production
access is delivered by the OAuth phase; no production manual-token fallback is in
scope yet.

---

## Phase 2 — In-app DeepSeek chat ("Ask Codever") — ✅ implemented

Reuses the existing DeepSeek integration pattern (`ai-refine.service.js`). This is a
**Level 1 RAG** flow: retrieve with existing search, synthesize with one DeepSeek call.

### 2.1 Backend assistant service + route — ✅ implemented

```
apps/codever-api/src/routes/ai/assistant.service.js   # retrieve + DeepSeek call (superagent)
```
Route on the personal user router (Keycloak-protected, `UserIdValidator`, gated by
`aiAssistant` toggle):
```
POST /api/personal/users/:userId/assistant/chat
  body: { message, history? }
  -> { answer, references: [{ type, id, title, url?, excerpt }] }
```
Flow: search Codever (existing services) → build prompt with top results → call
DeepSeek → return `answer` + structured `references`. Reuse the same error handling
(401/429/timeout/unreachable) as `ai-refine.service.js`.

### 2.2 Frontend chat UI — ✅ implemented

New lazy-loaded feature module `apps/codever-ui/src/app/assistant/`:
```
assistant.module.ts | assistant.routing.ts
assistant.component.*        # container (messages + input)
chat-message/                # renders markdown (marked + dompurify) + code (ngx-highlightjs)
reference-card/              # renders bookmark/note/snippet result cards
assistant.service.ts         # POST /assistant/chat
```
Render answers with the existing `marked` + `dompurify` + `ngx-highlightjs` pipeline;
render `references[]` as clickable Codever cards.

---

## Phase 3 — Entry points (chat mainstream, MCP power-user) — revised

> **Decision (revised):** the original two-card "Ask Codever" dialog (chat vs MCP)
> is **dropped**. A normal user has no MCP host (VS Code, Claude, Cursor), so an MCP
> card is meaningless noise to them, and a chooser dialog inserts friction in front
> of the one action almost everyone wants — the chat. The RAG-vs-MCP distinction is
> an *architecture* concern, not an end-user choice.

The two capabilities target two different audiences, so they get two different homes:

| Capability | Audience | Entry point | Shown when |
|---|---|---|---|
| **Chat with Codever AI** (DeepSeek / RAG) | everyone | **Direct** `🤖 Assistant` nav link → `/assistant` | `isAiAssistantEnabled()` |
| **Connect an AI client (MCP)** | developers / power users | **User Settings** → "AI clients (MCP)" section (Phase 1.4) | `isMcpServerEnabled()` |

### 3.1 Chat entry — ✅ implemented

The `🤖 Assistant` link in `shared/navigation/navigation.component.html` navigates
straight to `/assistant`, gated by `aiAssistantEnabled$ | async`. No dialog, no
chooser — the mainstream path is one click.

### 3.2 MCP entry — guide (How To) + account-specific connect (Settings)

MCP has two natural, complementary homes — neither is a modal in front of the
mainstream chat:

- **Generic guide → "How To" dropdown → `/howto/mcp`.** MCP setup is a
  *"how to connect a client to Codever"* task, the same shape as `/howto/bookmarklet`.
  A public guide page (how it works, config snippets, supported clients like
  VS Code / Cursor, the OAuth "connect" walkthrough) belongs alongside the other
  How-To pages. Optionally also surface a link in the **"Why Codever?" → Tools**
  section, which already lists client integrations (VSCode Extension, IntelliJ
  Plugin, browser add-ons) — an "AI clients (MCP)" entry fits that category exactly.
- **Account-specific connect → User Settings (Phase 1.4).** The per-user bits —
  your production server URL, the OAuth "Connect" button, the dev-token helper link —
  need login and the `mcpServer` toggle, so they live in Settings, gated by
  `isMcpServerEnabled()`.

Rule of thumb: **How To = the generic guide (public, educational); Settings = the
personalized connect action (gated).**

No `AskCodeverDialogComponent` is built.

---

## Phase 4 — Next step: OAuth 2.1 (replace copy/paste)

Upgrade the MCP auth from copy/paste connection token to browser-based OAuth so no
token is manually handled.

- Expose OAuth metadata from the MCP server so hosts discover Keycloak as the
  authorization server.
- Use the `codever-mcp` public client + PKCE + loopback redirect URIs.
- Host performs the login; tokens auto-refresh.
- Do not add a production manual-token fallback yet. Reconsider it only if a
  specific target client lacks OAuth support and there is a clear requirement.
- Settings UI: make the primary flow "Connect" (OAuth); retain only local-dev
  instructions for the dev-only access-token helper.

---

## Sequencing summary

| Phase | Outcome | Toggle |
|---|---|---|
| 0 | Generalized feature toggles (`aiAssistant`, `mcpServer`) | — |
| 1 | Read-only MCP server + local development authentication | `mcpServer` |
| 2 | In-app DeepSeek chat (`/assistant`) | `aiAssistant` |
| 3 | Entry points: chat nav link (mainstream); MCP guide in "How To" (`/howto/mcp`) + connect in Settings (power-user); no two-card dialog | both |
| 4 | OAuth 2.1 upgrade for MCP | `mcpServer` |

## Testing

- Backend: `*.test.js` unit tests for `feature-toggle.service.js` (new keys),
  MCP tool authorization (per-user scoping, read-only), and `assistant.service.js`
  (mock DeepSeek like `ai-refine.service.test.js`).
- Frontend: `ng test` for `feature-toggle.service.ts` getters, nav link toggle
  visibility (`aiAssistantEnabled$`), and chat rendering.

