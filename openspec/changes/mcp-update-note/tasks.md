## 1. Backend partial-update path

- [ ] 1.1 Add `updateNoteSchema` (Zod) to `mcp-note-creation.js`: required nonblank `id`, optional `title`/`content`/`tags`/`reference`/`public`, at least one editable field, strict. Verify new `*.test.js` coverage for missing id, no editable fields, unknown fields, blank title/content, content over 30,000 characters, and non-array tags.
- [ ] 1.2 Add `updateNotePartially(userId, noteId, patch)` to `personal-notes.service.js` that scopes by `userId`, normalizes `tags` through `normalizeTags`, applies only the provided fields, and returns the updated note; preserve not-found for missing or foreign notes. Verify service tests for single-field and multi-field updates, full tag replacement, and missing/foreign id → not-found with no write.
- [ ] 1.3 Add `updateNote` to `mcp-tools.service.js` reusing the existing write gate, mapping to the service, and returning the compact result shape (id, type, title, tags, contentType, public, timestamps, url). Verify `mcp-tools.service.test.js` covers authorization denial, tag normalization, idempotent result shape, and not-found errors.

## 2. MCP server tool registration

- [ ] 2.1 Register `update_note` in `mcp.server.js` behind `mcpAuth.canCreateNotes` with a retry-safe description and the strict schema. Verify `mcp.server.test.js` covers tool presence for write-enabled users (five tools) vs readers (three tools), direct-call denial for readers, and malformed input rejection.

## 3. Integration coverage

- [ ] 3.1 Extend `mcp.server.integration-test.js` with authenticated update success (single field, multiple fields, tags replacement), foreign/missing id → not-found, fourteen-tag rejection, and creation/update gated together. Run the targeted Docker-backed integration suite.

## 4. Documentation and verification

- [ ] 4.1 Update `documentation/mcp/mcp-auth.md` and the UI connection help to describe `update_note`, its partial semantics, and the tag-replacement caveat (base the new tag list on the note's current tags).
- [ ] 4.2 Run backend unit tests and the targeted integration suite; run the UI build. Lint skipped at the user's prior request. Record results.
