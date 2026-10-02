## Context

See `proposal.md` for motivation and scope. This cross-cutting change needs a design because it introduces a write capability into a deliberately read-only integration and changes validation shared by two resource types.

Observed integration points:

- `apps/codever-api/src/mcp/mcp.server.js` builds a stateless per-request MCP server bound to a token-derived user ID. It registers three read tools and three prompts, requires `mcp:read` at the HTTP boundary, checks the per-user feature toggle, and exposes OAuth resource metadata. `mcp.server.test.js` currently asserts exactly three tools using an in-memory MCP client.
- `src/mcp/mcp-tools.service.js` reuses personal services and formats results as JSON text. Note read-back includes content/reference but omits origin metadata.
- `src/routes/users/notes/personal-notes.service.js` validates and saves a Note without a controller layer. The Note model already supports Markdown, origin, reference, visibility, and tags. Its validator limits Markdown content to 30,000 characters but does not enforce its declared tag-count constant.
- `src/common/validation/bookmark-input.validator.js` enforces at least one tag, at most eight, and blocked-tag rules. The shared UI `tags-validation.directive.ts` also requires at least one tag and caps at eight. Preserve these existing minimum-tag and blocked-tag policies; this change separates the ceiling from AI advice rather than redesigning all tag rules.
- Note and bookmark editors both stop merging refinement tags at eight. Their copyable refinement prompts and the backend `ai-refine.service.js` / `ai-refine-bookmark.service.js` also recommend eight. Both prompt sources must remain coherent.
- The authenticated detail route is `/my-notes/:id/details`. `env.json.example` currently configures an API/MCP origin but no dedicated frontend-link base; in development the UI and API use different ports.
- `documentation/mcp/mcp-auth.md` describes audience isolation, `mcp:read`, OAuth deployment, and the development realm import at `docker-compose-setup/keycloak-export-import/bookmarks-realm.json`. Its read-only-by-construction claims must be revised for write-enabled connections.
- `src/common/feature-toggle.service.js` reads `feature-toggles.json` on every check, enables features by `enabledUserIds`, and fails closed for missing/invalid toggle configuration. Its explicit `FEATURE_NAMES` list controls client-visible toggles. The development `dev-only/mcp-token.sh` currently requests `openid offline_access`, relying on the client's default read scope; it does not request optional write scope.

## Goals / Non-Goals

**Goals:**
- Keep the Router -> Service -> Model architecture and reuse note persistence rather than introducing a second save implementation or an internal HTTP round trip.
- Make token-derived ownership, field allowlisting, and write authorization enforceable independently of agent instructions.
- Keep read-only connections usable without reauthorization and keep generated note URLs separate from OAuth resource URLs.
- Treat 13 as a validated ceiling and eight as an authoring recommendation, not two competing validators.
- Permit independent per-user rollout and shutdown of creation, with local verification before any production enablement.

**Non-Goals:**
- No confirmation token, draft persistence, preview endpoint, or client-rendered preview UI guarantee.
- No idempotency store, live synchronization to open browser tabs, data migration, notebook creation through MCP, or broader MCP CRUD surface.
- No changes to ordinary REST authentication or the semantics of public sharing.

## Decisions

### 1. A narrow Markdown creation contract

Register `create_note` with required nonblank `title` and `content`; accept optional `tags`, `reference`, `origin` (`location`, `file`, `project`, `workspace`), and boolean `public` (default false). Set `type: 'note'`, `contentType: 'markdown'`, and `userId` server-side. Use the existing 30,000-character content limit and preserve the submitted Markdown, including fenced code blocks, rather than rewriting code or rendering HTML during persistence.

Use an explicit strict input contract and a fresh allowlisted object. Do not accept `userId`, IDs, timestamps, `shareableId`, `initiator`, `notebookContent`, a caller-selected `contentType`, or collection fields. Unknown/internal fields are validation errors, not mass-assignment inputs. Validate any tag normalization before persistence. Reference and origin are stored metadata, not instructions to fetch a URL or access a local file. Preserve only supplied origin fields; do not infer machine paths. Public visibility must be explicit and included in the recommended preview.

Call `personalNotesService.createNote(authenticatedUserId, noteData)` through the MCP tool-service layer. Existing REST routers retain `keycloak.protect()` followed by `UserIdValidator`; the MCP route has no caller-provided user path and instead binds ownership to its validated token subject.

Alternative: a generic `create_entry` tool or a structured snippets array. Rejected for this version because only Markdown notes are requested and their content already represents prose and code in order.

### 2. Independent creation toggle and opt-in authorization

Retain the endpoint-wide `mcp:read` requirement, `codever-mcp` audience validation, and per-user `mcpServer` gate. Introduce `mcpCreateNotes` using the existing `enabledUserIds` convention, committed with an empty allowlist. Missing, malformed, or empty creation-toggle configuration denies creation. Extend the toggle service and client-visible toggle contract consistently, without adding a new toggle administration interface.

Pass validated scopes with the user ID when building the server. Register `create_note` only when both per-user toggles are enabled and the token carries both `mcp:read` and `mcp:write`. Recheck the current creation toggle and write authorization in the execution path before invoking persistence; do not trust the discovery result, a browser-cached flag, or a cached tool list. Disabling creation takes effect for subsequent calls without a backend restart or token revocation. This does not cancel a save already admitted before the toggle changed. Hosts might require a tool-list refresh to display newly available tools, but a stale display cannot grant execution permission.

When only creation is disabled, authorized tool discovery remains the existing three-tool list and read calls continue normally. A direct attempt to call an unavailable tool returns an MCP error; an execution-time toggle denial returns a sanitized tool error with `isError: true`. Neither calls the save service. Disabling `mcpServer` still denies the entire endpoint. Read handlers retain user scoping.

Advertise both supported scopes in OAuth protected-resource metadata but keep `mcp:write` optional on the Keycloak client, not a default realm/client scope. Existing sessions remain read-only unless explicitly reauthorized for writing. Document how to opt in on supported hosts and verify the issued token rather than assuming every host requests optional scopes correctly. Keep audience isolation from the ordinary `bookmarks-api` resource; do not reuse a frontend token or add the normal API audience to MCP tokens.

Set creation annotations to describe it accurately: not read-only, non-destructive creation, and not idempotent. Annotations inform hosts but are not authorization controls. Keep existing read-only prompts, including tag-cleanup, non-mutating.

Alternatives: let `mcp:read` authorize creation, or rely solely on the write scope and existing whole-server toggle. Rejected because the former silently upgrades existing authority and the latter cannot immediately disable creation while retaining reads for an already write-authorized user. A separate creation server is unnecessary for one opt-in tool.

### 3. Recommend preview and confirmation through tool guidance

The creation description and connection documentation instruct agents to present the title, full draft content, tags, visibility, and any reference/origin metadata; request confirmation; incorporate corrections; and invoke the tool only after approval. They strongly recommend at most eight relevant tags where possible and warn against inventing or uploading unsolicited local context. After success, agents are instructed to show the returned link.

This is a recommended interaction, not evidence of human consent at the server. A correctly authorized direct tool call succeeds without a draft ID or confirmation flag. Do not add a meaningless `confirmed: true` argument that an agent could set itself. No new prompt endpoint is necessary; keep the behavior discoverable in the tool description.

Alternative: server-side drafts and confirmation tokens. Explicitly deferred by the user. Rendering is controlled by the MCP host and cannot be promised by this server.

### 4. Return a compact result and an authenticated frontend link

Return JSON in the existing text-content envelope containing `id`, `type: 'note'`, `title`, normalized `tags`, `contentType`, `public`, supplied `reference`/`origin`, persisted timestamps, and `url`. Do not echo the entire Markdown back or expose internal fields. Build `url` as the configured frontend base plus `/my-notes/<id>/details`; never generate a shareable ID, include credentials, or substitute a public/shared route.

Introduce an explicit `mcp.frontendBaseUrl` configuration value in committed examples (UI port 4200 in local development; the deployment's frontend origin in production). Validate and normalize the base and fixed details-path construction before saving, then insert the persisted note ID into that validated URL structure. Missing/invalid configuration must not produce a saved note followed by a link-formatting failure. Read-only tools continue working even if creation-link configuration is missing; creation reports a sanitized configuration error and saves nothing. Do not derive the link from request Host/Origin headers or confuse it with `mcp.publicBaseUrl`, which identifies the API resource.

Add `origin` to note `get_entry` results so callers can verify metadata round-trip. Keep other existing response fields unchanged; notebook read expansion is not part of this change.

Alternative: infer the frontend from `basicApiUrl`. Rejected because it gives the wrong local port and fails split-host deployments.

### 5. Normalize tags consistently and separate hard/soft limits

Use named policy constants for `MAX_TAGS = 13` and `RECOMMENDED_AI_TAGS = 8` within each app, with cross-surface tests guarding agreement rather than creating a new cross-app package. Normalize supplied tag strings by trimming and lowercasing, reject empty/non-string values, and deduplicate in first-seen order before checking the maximum. Do not silently slice to eight or thirteen. Preserve existing bookmark minimum-tag/blocked-tag rules and existing UI minimum-tag requirements. MCP note creation accepts omitted tags as an empty list, consistent with current note-service behavior.

Apply normalization and the ceiling on personal note/bookmark create and update paths (and shared bookmark validation callers) before saving. Notes newly gain backend count enforcement. Reads of existing data are unchanged; an over-limit legacy note must be corrected to save an update rather than silently losing tags. No bulk rewrite is required. Align API documentation with the new ceiling and error behavior.

The thirteen-tag ceiling and eight-tag refinement recommendation are not conditional on `mcpCreateNotes`. Turning creation off changes only MCP creation availability; ordinary note/bookmark saves, refinements, and already-saved nine-to-thirteen-tag entries remain governed by the same tagging policy.

Update shared UI validation/messages, manual-entry behavior, and both refinement-acceptance handlers to use thirteen. Preserve user-selected existing tags when suggestions are merged and deduplicate across the entire merged set. If the accepted set would exceed thirteen, leave the form invalid with a visible explanation so the user can select tags; never silently discard existing or accepted tags or persist a partial selection. Existing explicit user-driven tag removal remains available.

Keep the backend and copyable UI AI prompts strongly recommending at most eight relevant tags, allowing justified exceptions within thirteen. Do not add response truncation to enforce a soft recommendation. A note already carrying nine to thirteen tags is valid and is not automatically reduced during refinement.

Alternative: simply change every occurrence of eight to thirteen. Rejected because prompt advice, merge behavior, and validation have different purposes.

### 6. Distinguish transport failures from tool failures

Preserve HTTP 401 with the OAuth challenge for invalid/missing authentication and HTTP 403 for missing endpoint read scope or disabled `mcpServer` access. A disabled `mcpCreateNotes` flag is not an endpoint-wide rejection: it prevents creation discovery/execution while leaving reads available. Tool discovery/execution must enforce both the creation toggle and write access without relying on a model honoring descriptions.

For schema-invalid calls, use the SDK's MCP validation error behavior and perform no write. Convert expected business validation failures to a sanitized MCP tool result with `isError: true` and actionable text; ordinary REST validation continues using `ValidationError` mapped to HTTP 400. Persistence or link-configuration failures return a sanitized tool error without a success ID/link or internal stack. Do not report HTTP 201 for a successful `tools/call`: it returns the normal MCP success envelope after persistence.

### 7. Cache and test boundaries

MCP cannot clear another browser's localStorage cache. The returned detail link is the immediate route to the new note; lists/tag suggestions in already-open tabs follow existing refresh/cache behavior. Do not add cross-client invalidation infrastructure. Verify fresh detail navigation and ordinary list refresh in a browser smoke test.

Extend the existing MCP in-memory tests for toggle-and-scope-dependent discovery, schema validation, guidance/annotations, success output, read-back, and failure handling. Cover creation off despite both scopes, creation on without write scope, both gates/scopes present, missing/malformed creation flags, and disabling the flag between discovery and execution. Add mocked service tests proving token ownership and no persistence on rejected inputs. Extend backend validator tests for create/update tag boundaries and normalization, and UI tests for manual tags and refinement merges. Authenticated integration tests must prove real scope/audience denial and persistence isolation, not merely mock the authorization predicate.

### 8. Local-first testing and development helper

Use the existing Docker Compose MongoDB/Keycloak setup and development realm. Start the API and UI using the root backend/frontend scripts (or `npm start`), with MCP at `http://localhost:3000/api/mcp`, Keycloak at `http://localhost:8480/auth`, and `mcp.frontendBaseUrl` set to `http://localhost:4200`. Use local API/database/identity configuration only. Add the local test user's token subject to both allowlists in the local deployment; keep the committed creation allowlist empty and production enablement untouched.

Extend `apps/codever-api/dev-only/mcp-token.sh` with an explicit `--write` option that adds `mcp:write` to its requested scopes while preserving its current read-only default and `--export` behavior. Document the combined options. Requesting the scope neither enables the toggle nor broadens the token audience. Test argument/scope construction with a stubbed token request, then verify locally issued token claims against Keycloak without committing or recording tokens. This direct-grant helper remains development-only; normal MCP hosts use OAuth.

The local runbook must explain the optional client scope, safe updates for already-imported realms, test-user enablement, API/UI startup, helper and OAuth alternatives, tool discovery, a full preview/create/link flow, and creation-only disablement. Verify the allow/deny combinations locally before production rollout. This is a setup plan to implement, not a claim that creation is already runnable.

## Risks / Trade-offs

- [Prompt injection can cause an authorized agent to write without a genuine preview] -> State the guidance-only limitation, use opt-in write scope and host approvals where available, and retain ownership/allowlist enforcement. Do not describe this as server-enforced human consent.
- [Retries after a lost success response can create duplicates] -> Mark creation non-idempotent, document no blind retries, and use existing search/read tools to check uncertain outcomes. Idempotency is deferred.
- [Project metadata can contain sensitive paths] -> Accept only explicitly supplied context, preview it, and default to private; public visibility must be explicit.
- [Existing notes with more than thirteen tags become unsavable unchanged] -> Explain validation tightening and require user correction; do not migrate or trim stored data silently.
- [Optional scope negotiation differs between hosts] -> Test the supported host flow and document reauthorization; verify that old/read-only tokens remain unable to write after refresh.
- [Broken frontend configuration produces unusable links] -> Validate before saving and test local split-port and deployed frontend origins.
- [Client caches a write tool after creation is disabled] -> Recheck the server-side toggle for each execution; stale tool listings must never permit a new save.
- [Full rollback of tag validators would reject new nine-to-thirteen-tag entries] -> Disable `mcpCreateNotes` while retaining reads and the independent thirteen-tag UI/API policy.

## Migration Plan

1. Land the independent tag-policy/UI/API tests and behavior, then MCP creation/auth/configuration changes behind both per-user toggles and optional write scope. Ship `mcpCreateNotes` with an empty allowlist. No database migration or new runtime dependency is needed.
2. Update development realm configuration minimally and document equivalent non-destructive changes for existing realms; do not recreate production realms or promote write scope to default. Update read-only claims in MCP connection/help documentation.
3. Complete the local runbook first: configure the local frontend base, enable only a local test user, obtain read-only and explicit-write tokens, and verify all toggle/scope combinations. Verify private creation, preview guidance, origin round-trip, the returned local UI link, thirteen/fourteen-tag boundaries, and immediate denial of subsequent creation calls after toggle removal while reads continue.
4. Only after local verification, separately configure production and enable `mcpCreateNotes` for selected existing MCP users with explicit write authorization. Do not copy local user allowlists or credentials into production.
5. For creation-only rollback, remove users from or empty `mcpCreateNotes.enabledUserIds`; subsequent creation calls are denied without waiting for token expiry, while MCP reads and the tagging policy remain intact. Disabling `mcpServer` is the broader emergency option. Revoke write-capable sessions as additional credential cleanup if needed; removing an OAuth grant alone does not invalidate already-issued access tokens automatically.
