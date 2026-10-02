## Why

Codever's MCP integration can search and read saved entries but cannot save a useful explanation or code example produced in an agent conversation. Users should be able to preview and approve a Markdown note, save it with tags and optional source/project context, and receive a clickable link without switching to the editor.

## What Changes

- Add an authenticated `create_note` MCP tool for Markdown notes with title, content (including fenced code snippets), optional tags, reference, and project/workspace/file/location origin metadata.
- Default creation to private; permit public visibility only as an explicit input. Derive ownership from the authenticated token and keep internal fields server-controlled.
- Return the persisted note ID, compact saved metadata, and an absolute authenticated note-details link. Include origin metadata in note read-back through `get_entry`.
- Recommend a preview-and-confirm interaction in tool guidance: show the draft and metadata, obtain user confirmation, save, then present the link. This is agent guidance, not a guaranteed client UI or a server-enforced approval workflow.
- Require both the existing per-user `mcpServer` toggle and a new, default-off `mcpCreateNotes` toggle, plus `mcp:read` and opt-in `mcp:write` scopes. Check creation eligibility in tool discovery and execution; disabling creation must leave authorized read tools available, even with a previously issued write-capable token or cached tool list.
- Support local-first verification using Docker Compose MongoDB/Keycloak, the local API/UI, and an optional write-scope mode in the development token helper. Keep local user enablement separate from production rollout and retain read-only helper defaults.
- Raise the hard ceiling to 13 normalized unique tags for notes and bookmarks across the UI and API, including MCP note creation. Strongly recommend at most eight relevant tags in MCP creation guidance and note/bookmark AI refinement prompts; do not silently truncate existing tags to eight. This tagging policy is independent of `mcpCreateNotes` and remains in force when MCP creation is disabled.
- Exclude Jupyter notebook creation, collection assignment, separate snippet records, bookmark creation through MCP, MCP update/delete tools, and server-side drafts/confirmation tokens.
- Compatibility tightening: note create/update requests exceeding 13 normalized unique tags will fail validation; the existing note backend declares an eight-tag constant but does not enforce tag count. Existing stored entries are not rewritten.

## Capabilities

### New Capabilities

- `mcp-note-creation`: Separately toggled Markdown note creation, preview guidance, project-context preservation, saved-note links, read-only client compatibility, and a local testing path.
- `entry-tagging-policy`: Consistent 13-tag validation for notes and bookmarks, normalization, and a separate eight-tag recommendation for AI-assisted authoring/refinement.

### Modified Capabilities

None. The current durable specifications cover dashboard redirects and UI styling, not MCP or tagging behavior.

## Impact

- **codever-api:** MCP registration/auth/tool services and tests; feature-toggle configuration/service; personal note creation reuse; note/bookmark tag validation and normalization; AI refinement guidance; development token helper, configuration examples, and MCP documentation.
- **codever-ui:** Shared tag validation, note/bookmark form messages and refinement-acceptance logic; MCP connection guidance must distinguish read-only from opt-in creation access.
- **APIs and routes:** Extend authenticated `/api/mcp`; adjust validation on existing personal note/bookmark create/update routes without adding public write routes. Public read/search behavior is unchanged. Existing REST authorization remains in place.
- **Mongoose models:** Reuse the current Note fields (`content`, `contentType`, `reference`, `origin`, `tags`, `public`, `userId`). No new collection or schema migration is planned.
- **Identity/configuration:** Add optional write-scope setup to the development Keycloak realm and deployment guidance; introduce `mcpCreateNotes.enabledUserIds` with an empty default; configure a frontend base URL for note links independently of the MCP API origin. Document local enablement and creation-only rollback without changing production settings during development.
- **Dependencies:** Reuse the installed MCP SDK, Zod, Express, Mongoose, and existing test tooling; no new runtime dependency is anticipated.
