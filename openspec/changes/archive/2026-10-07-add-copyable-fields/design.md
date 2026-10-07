## Context

See `proposal.md` for the motivation and scope. The current API uses Router -> Service -> Mongoose Model layering, with authenticated personal note/bookmark routes protected by Keycloak and `UserIdValidator`. Notes and bookmarks have independent request mappers/validators and shared tag/search behavior. The UI renders notes and bookmarks through separate editor and list/detail component trees.

MongoDB currently uses one weighted text index per searchable collection. Bookmark weights are `name: 13`, `location: 8`, `description: 5`, `tags: 21`, and `sourceCodeURL: 3`. Note weights are `title: 13`, `reference: 3`, `content: 5`, and `tags: 21`. Search services project MongoDB `textScore` when full-text terms are present. The development database initializer and an existing MongoDB migration both define text indexes and must remain aligned.

## Goals / Non-Goals

**Goals:**

- Persist and validate ordered copyable label/value pairs for notes and bookmarks.
- Provide consistent authoring, display, clipboard, clone, and copy-to-mine behavior.
- Make copyable labels and values searchable without allowing them to outrank primary entry content.
- Display existing note source metadata separately as read-only source context.
- Expand any list's sole visible entry while preserving the existing toggle for user control.
- Keep personal-route authorization, public visibility, GET caching, and existing resource behavior intact.

**Non-Goals:**

- No automatic IntelliJ or VS Code payload changes in this change.
- No browser-extension or MCP note-creation input changes.
- No separate visibility or permission per copyable field.
- No per-field encryption, masking, or secret detection.
- No full local path or workspace display in Source context.
- No copyable fields for legacy snippets in this change.

## Decisions

### 1. Use a small ordered embedded field structure

Represent copyable fields as an ordered array of objects with `label` and `value` strings. Store no generated IDs or per-field visibility flags for the first version. The API boundary validates the complete collection before passing it to the service, while the Mongoose model also constrains string types and maximum lengths.

An array preserves insertion/reordering semantics and supports duplicate labels. A map is rejected because duplicate labels are valid and map keys would make order and duplicate handling awkward. A single serialized text block is rejected because it would make per-field editing, validation, copying, and search less reliable.

Normalize only outer whitespace for labels and values. Reject blank values after trimming and reject any value containing `\\r` or `\\n`; preserve internal whitespace so commands and identifiers are copied exactly as entered.

### 2. Validate at both personal REST input boundaries and persistence boundaries

Extend the existing note and bookmark request mappers/validators and service update paths rather than introducing a controller layer. Personal create/update routes retain `keycloak.protect()` followed by `UserIdValidator.validateUserId(request)`. Invalid collections use the existing `ValidationError` contract and HTTP 400. Reads and writes continue to use the existing authenticated/public route boundaries; no new authorization capability is introduced.

Clone and copy-to-mine operations should copy the validated field array as ordinary entry data. A new owner receives an independent array, so subsequent edits cannot affect the source entry.

### 3. Keep source context separate from editable fields

Use the existing note `origin.file` and `origin.project` values as the source for the read-only Source context display. Derive the displayed file name from the final path segment; do not persist a duplicate generated copyable field. Display source context only when at least one supported value exists, and omit full paths and workspaces from the initial presentation. Existing origin data remains structured data for future IDE integrations.

The first implementation does not add automatic extension inputs. If source metadata is absent, no Source context section is rendered. If source metadata is copied with an entry, it remains read-only and is not editable through the Copyable fields form.

### 4. Share a presentation contract while preserving resource-specific components

Add the same user-facing semantics to the note and bookmark model interfaces and their editors, but preserve the existing separate component trees. Render optional sections after note content/bookmark description and before tags. Each row has a value-only clipboard action and a visible copy feedback state that does not alter the stored value.

Use the existing preview/toggle mechanism for list cards. The list parent determines whether exactly one visible result is present and initializes the single card expanded; multiple-result lists retain the current collapsed default. Details pages continue using their existing expanded behavior. Empty optional sections are omitted.

### 5. Add low-weight fields to each collection's existing text index

Add `copyableFields.label` and `copyableFields.value` to the existing bookmark and note text indexes with weight `1`. Rebalance `tags` from `21` to `10` while retaining the existing title/name, location/content, description/reference, and source URL weights. This uses MongoDB's single text-index-per-collection model and lets copyable-only queries return results while keeping primary identity fields ahead of comparable single-tag and copyable-field-only matches. MongoDB can aggregate contributions from multiple matching tag terms, so ordering between a multi-term title match and a multi-tag match is not guaranteed by these fixed weights.

Update both the versioned MongoDB migration and fresh-development initialization. The migration must replace the existing named text indexes safely and be reversible where the repository migration conventions support rollback. Search services continue using existing `$text` and `textScore` behavior; no separate search query or second text index is introduced.

### 6. Invalidate cached GET responses consistently

Because copyable fields change entry GET payloads, create/update/clone/copy-to-mine flows must use the existing cache invalidation strategy for affected note/bookmark keys and list/search keys. Sensitive cache behavior remains governed by `HttpClientLocalStorageService`; no new cache storage mechanism is introduced. Public and personal GET responses must not leak fields beyond the existing entry visibility rules.

## Risks / Trade-offs

- **[Risk]** Users may store sensitive values in a public entry because fields inherit parent visibility. **Mitigation:** make the section visibly part of the entry, preserve existing public/private confirmation semantics, and do not add a misleading per-field privacy control.
- **[Risk]** Adding fields to text indexes and reducing tag weight can change relevance and index size. **Mitigation:** use weight `1` for copyable fields, reduce only the overranking tag weight to `10`, verify title/name versus multi-tag and copyable-only ranking with migration/search tests, and monitor index behavior after rollout.
- **[Risk]** Existing documents or older clients may omit the new array. **Mitigation:** treat absence as zero fields, avoid destructive backfill, and keep old payloads readable.
- **[Risk]** List-card expansion based on result count can be inconsistent across paginated or asynchronously loaded lists. **Mitigation:** use the currently rendered page/list count and cover one-result and multiple-result cases in component tests.
- **[Risk]** Copying a value may fail due to browser clipboard permissions. **Mitigation:** use the existing clipboard pattern, provide visible failure feedback, and keep the value selectable as a fallback.
- **[Risk]** Migration and initializer indexes can drift. **Mitigation:** update both sources and verify the resulting index definition in an integration test or documented local migration check.

## Migration Plan

1. Add the API data shape, validation, mapping, and persistence behavior with backward-compatible omission semantics.
2. Add the MongoDB text-index migration and update fresh-database initialization, reducing tag weight to `10` and adding weight `1` for both copyable fields while preserving the other existing weights.
3. Add UI model/editor/display/clipboard and clone/copy-to-mine behavior, then add single-result expansion handling.
4. Update cache invalidation for affected note/bookmark reads and lists.
5. Run targeted API unit/integration tests, UI component tests, lint, and a frontend build; run the MongoDB migration/index verification where infrastructure is available.
6. Rollback consists of reverting UI/API behavior and restoring the prior named text indexes through a reverse migration or database backup procedure. Documents containing copyable fields remain readable as ignored optional data if an older application version is temporarily deployed.

