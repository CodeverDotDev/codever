## Context

The MCP server already has a write path: `create_note` in `mcp.server.js` → `mcp-tools.service.js` → `personalNotesService.createNote`, gated by `mcpCreateNotes` + `mcp:write`. Reads (`search_entries`, `get_entry`, `list_tags`) return `id` + `type`, so an agent always has the id needed to address an update. The REST note update is a full-document PUT that validates the whole note, which does not fit partial semantics. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Add `update_note` with partial semantics: only named fields change; omitted fields untouched.
- Reuse the existing write gate and the `Note` model; follow Router → Service → Model (no controller layer).
- Keep the result shape and error behavior consistent with `create_note`.

**Non-Goals:**
- No bookmark update/delete, no note delete.
- No tag delta operators (`addTags`/`removeTags`) in this iteration.
- No rename of `mcpCreateNotes` to a generic "write" toggle (noted as a follow-up).
- No partial-update changes to the REST API (only the MCP surface).

## Decisions

1. **Partial update over full replace.** The agent sends only the fields it wants to change. This avoids forcing the model to re-emit the full (possibly stale) note — which risks silently clobbering concurrent edits and corrupting long verbatim content.

2. **`tags` is a full replacement, not a delta.** When `tags` is present it is the complete desired list, normalized through the existing `normalizeTags` (thirteen-tag ceiling, invalid input rejected). This matches `create_note`'s tag contract and avoids server-side merge races; the agent already has the note in context when it wants to edit tags.

3. **Ownership via token + scoped query, unchanged.** The new service method reads/writes with `{ _id, userId }` and returns not-found for a missing or foreign note, mirroring `get_entry`.

4. **Dedicated partial validation, not the full-document validator.** The existing `note-input.validator` assumes a complete note (`title` and `content` required). Instead, a dedicated `updateNoteSchema` (Zod) validates the patch shape — required `id`, optional `title`/`content`/`tags`/`reference`/`public`, at least one editable field — and `normalizeTags`/content limits are applied per field. This keeps the REST PUT path untouched.

5. **Same write gate.** `update_note` registers behind `mcpAuth.canCreateNotes(...)` (both toggles + both scopes) so it is opt-in exactly like `create_note`, with a fresh execution-time re-check.

6. **Idempotent result.** A successful update returns the same compact result as `create_note` (`id`, `type`, `title`, `tags`, `contentType`, `public`, timestamps, `url`), and update is retry-safe — the tool description will state this (contrast with `create_note`'s non-idempotency warning).

## Risks / Trade-offs

- **Last-write-wins on partial fields.** Two concurrent updates to different fields of the same note can still race, but the blast radius is limited to the named fields rather than the whole document.
- **Toggle naming smell.** `update_note` riding on a toggle named `mcpCreateNotes` is semantically off. Accepted for now; a rename to a generic "MCP write" toggle is a possible follow-up change (would touch config, docs, and the realm).
- **Tag clobbering.** Because `tags` is a full replacement, an agent that omits a tag it didn't know about will drop it. Mitigation: the tool description instructs the agent to base the new tag list on the note's current tags (from `get_entry`) when editing tags.
