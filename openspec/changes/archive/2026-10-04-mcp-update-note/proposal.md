## Why

The Codever MCP server lets an agent search, read, list tags, and create a note — but not edit one it has already read. Fixing a title, revising content, or correcting tags currently requires the agent to create a new note and leave the old one behind. An `update_note` tool closes that loop.

## What Changes

- Add an `update_note` MCP tool for Markdown notes, using **partial update** semantics: only the fields named in the call change; omitted fields are left untouched.
- Editable fields: `title`, `content`, `tags`, `reference`, and `public`. `id` is required to address the note.
- `tags`, when present, is the complete desired list (normalized, thirteen-tag ceiling) — no add/remove delta operators in this iteration.
- Ownership is token-derived and updates are scoped to the caller's own note; updating another user's note (or a missing id) returns not-found, matching existing `get_entry` behavior.
- Reuse the existing write gate: `mcpCreateNotes` toggle plus `mcp:read` and `mcp:write` scopes. No new toggle, and no bookmark/delete tools in this change.
- Update is idempotent and retry-safe, unlike `create_note`.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `mcp-note-creation`: add an `update_note` requirement and revise the current "no MCP update/delete tools" wording to reflect that note updates are now supported (bookmark creation and delete remain out of scope).

## Impact

- **App:** `codever-api` only. The MCP endpoint is a personal (authenticated) resource; public routes are unaffected.
- **Code:** `src/mcp/mcp.server.js` (tool registration), `src/mcp/mcp-tools.service.js` (update service layer), `src/mcp/mcp-note-creation.js` (schema + result/error mapping), `src/routes/users/notes/personal-notes.service.js` (a partial-update path alongside the existing full `updateNote`), and `src/routes/users/notes/note-input.validator.js` if partial validation is added there.
- **Models:** no new Mongoose models; reuses the existing `Note` model.
- **Tests:** unit (`mcp.server.test.js`, `mcp-tools.service.test.js`) and authenticated integration (`mcp.server.integration-test.js`).
- **Docs:** `documentation/mcp/mcp-auth.md` and the UI connection help updated to mention note updates.
