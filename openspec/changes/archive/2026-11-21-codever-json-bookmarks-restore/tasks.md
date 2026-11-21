## 1. API: restore service

- [x] 1.1 Create `codever-json-bookmarks-import.service.js` in
  `apps/codever-api/src/routes/users/bookmarks/` with the allowlist
  mapping (new id, owner and display name from the request,
  `likeCount` 0, `descriptionHtml` from `description`, `type`
  forced); verify with unit tests in
  `codever-json-bookmarks-import.service.test.js` (mocked `Bookmark`)
  that `userId`, `_id`, `likeCount`, `shareableId` and
  `descriptionHtml` from the file are not used
- [x] 1.2 Reject a missing or non-array `bookmarks` with
  `ValidationError`; return zero counts for an empty array; verify with
  unit tests
- [x] 1.3 Skip locations the user already has (one query for existing
  locations) and repeated locations within the file, counting them as
  duplicates and leaving existing bookmarks unchanged; verify with unit
  tests, including restoring the same file twice
- [x] 1.4 Validate each bookmark with `validateBookmarkInput`, count
  failures in `inErrorSize` and continue; verify with a unit test of a
  file with one entry missing `location`
- [x] 1.5 Apply visibility: private unless `keepPublic`; with
  `keepPublic`, fall back to private and count `madePrivateSize` on
  `PublicBookmarkExistentError`; verify with unit tests for the three
  visibility scenarios
- [x] 1.6 Keep `createdAt` / `updatedAt` (fallback to now for missing,
  invalid or future dates; `updatedAt` not before `createdAt`) and save
  with `timestamps: false`; verify with unit tests asserting the saved
  dates and the save option
- [x] 1.7 Return `{ created, duplicatesSize, inErrorSize,
  madePrivateSize }`; verify with the mixed-result unit test

## 2. API: endpoint and docs

- [x] 2.1 Add `POST /:userId/bookmarks/import` to
  `personal-bookmarks.router.js` with `keycloak.protect()` and
  `UserIdValidator.validateUserId`, calling the service; verify with
  `npm test` in `apps/codever-api` and, if the environment is available,
  an integration test in `personal-bookmarks.router.integration-test.js`
  for 200, 400 and 401
- [x] 2.2 Document the endpoint in
  `apps/codever-api/docs/openapi/openapi.yaml` (request body, 200
  summary, 400/401/413); verify the YAML parses and the operation shows
  at `/api/docs`

## 3. UI: import dialog

- [x] 3.1 Add `UserDataService.restoreBookmarks(userId, bookmarks,
  keepPublic, userDisplayName)` posting JSON to the new endpoint; verify
  with `npm run build` in `apps/codever-ui`
- [x] 3.2 Add the format radio (Browser HTML default, Codever JSON), the
  format-bound file `accept`, the "Keep public visibility from the file"
  checkbox (JSON only, unchecked) and format-specific notes to
  `ImportBookmarksDialogComponent`; verify with a new Vitest spec
  `import-bookmarks-dialog.component.spec.ts`
- [x] 3.3 For JSON, read and parse the file in the dialog, show an
  inline error for invalid JSON or a non-array without calling the API,
  otherwise call `restoreBookmarks`; report created, duplicate, invalid
  and made-private counts; verify with Vitest tests for valid, invalid
  and wrong-shape files and that HTML still uses `uploadBookmarks`
- [x] 3.4 Guard `importBookmarks()` `afterClosed` in
  `user-bookmarks.component.ts` against a missing result; verify with a
  Vitest test (or the existing component spec) that closing without a
  result throws nothing

## 4. Docs and verification

- [x] 4.1 Describe the Codever JSON restore in the Import tab of the
  bookmarks how-to page (owner is the logged-in user, existing URLs
  win, dates kept, public only on request, 6 MB limit); verify by
  viewing `/howto/bookmarks`
- [x] 4.2 Run `npm test` in `apps/codever-api`, the touched Vitest specs
  and `npm run lint` in `apps/codever-ui`; verify they pass apart from
  known unrelated failures
- [x] 4.3 Manual round trip: export Codever JSON from the dashboard,
  restore it into the same account (all duplicates) and into a second
  account (all created, dates and descriptions kept, private by
  default); verify in the running app
