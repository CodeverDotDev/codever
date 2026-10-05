## 1. Data model and API validation

- [x] 1.1 Add the optional ordered `copyableFields` label/value structure to note and bookmark persistence models, preserving documents that omit the field; verify model-level type and length behavior with API unit tests.
- [x] 1.2 Extend note and bookmark request mappers and validators to trim outer whitespace, reject blank/multiline/over-limit fields, enforce the ten-field maximum, allow duplicate labels, and return `ValidationError`/HTTP 400; verify valid, boundary, and invalid payloads with `*.test.js` coverage.
- [x] 1.3 Update authenticated personal note and bookmark create/update flows and public/personal read serialization to round-trip fields without changing `keycloak.protect()` or `UserIdValidator` behavior; verify authorization, create, update, and read behavior with targeted integration tests.
- [x] 1.4 Preserve copyable fields in clone and Copy to mine operations as an independent ordered copy; verify that later edits to the new entry do not affect the source using integration tests.

## 2. Search indexes and backend search behavior

- [x] 2.1 Add `copyableFields.label` and `copyableFields.value` to the existing note and bookmark weighted text-index definitions with weight `1`, reduce `tags` from `21` to `10`, and preserve all other current weights; verify the resulting index definitions in a MongoDB-backed migration test or documented local index check.
- [x] 2.2 Add a reversible MongoDB migration and update fresh-development database initialization so existing and new environments receive the same rebalanced indexes; verify migration and rollback behavior where the repository migration harness supports it.
- [x] 2.3 Verify search returns entries matching only copyable labels/values, ranks direct title/name matches ahead of comparable single-tag matches, and ranks primary title/name/content/description/location/reference matches ahead of copyable-only matches; cover both note and bookmark search services with unit and integration tests. Multi-term tag matches remain searchable, but MongoDB may aggregate their per-term tag contribution above a multi-term title match; the agreed weights remain unchanged.

## 3. Frontend models and editors

- [x] 3.1 Extend note and bookmark client models and create/edit form state with optional ordered copyable fields; verify existing entries without fields still load and save through Karma/Jasmine component tests.
- [x] 3.2 Add the Copyable fields editor with the agreed helper text, add/remove/reorder controls, required label/value validation, duplicate-label support, 10-field maximum, 100-character label limit, and 1,000-character single-line value limit; verify boundary and invalid-entry behavior with Karma/Jasmine tests.
- [x] 3.3 Ensure personal REST save payloads include valid copyable fields and update cache invalidation for affected entry, list, and search GET responses through the existing local-storage cache service; verify updated values appear after save without stale cached data.

## 4. Display, clipboard, and source context

- [x] 4.1 Render non-empty Copyable fields after note content/bookmark description and before tags on list cards and details pages, omitting empty sections; verify ordering and conditional rendering with UI component tests.
- [x] 4.2 Add value-only copy actions and visible copy feedback for copyable fields, preserving a selectable fallback when clipboard access fails; verify the clipboard receives the value without the label in Karma/Jasmine tests.
- [x] 4.3 Render a separate read-only Source context section for available note file-name and project metadata, deriving the file name from the final path segment and omitting full paths/workspaces; verify absent, partial, and complete source metadata cases.
- [x] 4.4 Preserve and display copyable fields and source context when showing cloned or copied entries, while keeping source context read-only and copyable fields editable; verify clone and Copy to mine UI behavior with component/integration tests.

## 5. List expansion behavior

- [x] 5.1 Make the sole visible entry start expanded in every note/bookmark list while retaining the existing show-more/show-less toggle; verify one-result behavior for search, personal, public, tag-filtered, and other list contexts.
- [x] 5.2 Preserve collapsed-by-default behavior for multi-entry lists and existing expanded behavior on details pages; verify multiple-result and details-page regressions with Karma/Jasmine tests.

## 6. Validation and documentation

- [x] 6.1 Run targeted backend unit/integration tests for validation, persistence, search, cloning, and migrations, and verify they pass with the project’s API test commands.
- [ ] 6.2 Run frontend lint and targeted/full Karma/Jasmine tests, and verify the frontend build succeeds without regressions.
- [x] 6.3 Document the public/private visibility implication, low search relevance, ten-field limit, source-context distinction, and deferred IntelliJ/VS Code/browser-extension/MCP input behavior; verify the OpenSpec change artifacts remain internally consistent.

## Verification checkpoint (2026-10-05)

- API unit: `npm test -- --runInBand --testPathPattern=copyable-fields` — 34 passed.
- API integration: `npm run test:integration -- --runInBand --testPathPattern=copyable-fields` — 11 passed. Runs real routes/models against a separate temporary MongoDB database; Keycloak is stubbed, not a live identity-provider test. Persistence, visibility, ownership, copy independence, index migration/rollback/re-run and initializer parity passed.
- Search ranking note: with the agreed title/name weight `13` and tags weight `10`, MongoDB can aggregate two matching tags above an equivalent two-word title/name. The tests verify the approved primary-versus-single-tag and primary-versus-copyable behavior, while treating multi-term tag ordering as implementation-defined.
- UI targeted: `npx ng run codever-ui:test-copyable --progress=false` — 30 passed, including the existing OnPush regressions. The run also logged existing collection-tracking warnings and an incomplete history-service test-double callback.
- UI build: `npm run build` — passed. The full `npm test -- --watch=false --progress=false` suite remains blocked by the pre-existing missing `src/test.ts` entry point and legacy specs importing removed Angular `async` APIs. The configured `npm run lint` target is absent; direct ESLint is blocked by repository-wide CRLF/Prettier findings.
- History and tag localStorage caches are invalidated after successful note/bookmark writes. Details and search GETs are uncached; identity and consent keys are retained. Failed saves retain cached data.
- The remaining unchecked task is `6.2`; targeted UI tests and the build pass, but full-suite and lint prerequisites require repository-wide maintenance outside this change.

