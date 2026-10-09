## 1. Backend data model

- [x] 1.1 Add a `PinnedEntry` subdocument schema (`type` enum `bookmark|note|collection`, `id` ObjectId)
and change `User.pinned` to `[PinnedEntry]` in `apps/codever-api/src/model/user.js`.
Verify with `npx jest --testPathPattern="user"` (or nearest user model test) and by confirming existing integration tests referencing `pinned: []` still pass with an empty array.

## 2. Backend pinned service

- [x] 2.1 Update `getPinnedResources` in `apps/codever-api/src/routes/users/user-data.service.js`
to resolve each typed entry by `type` (Bookmark, Note, Collection), keep the user's pinned order,
and return collections as light objects (`_id`, `type`, `name`, `color`, `userId`).
Verify with a new unit test `user-data.service.test.js` covering mixed entries and ordering.
- [x] 2.2 Update `updateUserDataPinned` and `updateUserDataHistoryReadLaterPinned` to accept and store typed entries,
keeping `trimMaxAllowedStoreLength` behavior. Verify with unit tests for trimming and storing typed entries.
- [x] 2.3 Add validation that each pinned entry's `type` is one of `bookmark`, `note`, `collection`,
throwing `ValidationError` (400) otherwise. Verify with a unit test asserting the error class.

## 3. Backend routes and OpenAPI

- [x] 3.1 Update `GET /:userId/pinned` and `PATCH /:userId/pinned` in `apps/codever-api/src/routes/users/user.router.js`
to read/accept typed entries (replacing `pinnedBookmarkIds`). Verify with an integration test (`*.integration-test.js`) that PATCH stores typed entries and GET returns mixed resources.
- [x] 3.2 Update `apps/codever-api/docs/openapi/openapi.yaml` for the pinned endpoints' new request/response shape.
Verify by running the OpenAPI validation/lint command if present, or by visual review of the YAML.

## 4. Delete-path cleanup

- [x] 4.1 Update bookmark deletion in `apps/codever-api/src/routes/users/bookmarks/personal-bookmarks.service.js` to `$pull` typed entries (`{ id: bookmarkId, type: 'bookmark' }`).
Verify with the existing bookmark deletion unit/integration test.
- [x] 4.2 Update note deletion in `apps/codever-api/src/routes/users/notes/personal-notes.service.js`
to `$pull` typed entries (`{ id: noteId, type: 'note' }`). Verify with the existing note deletion unit/integration test.
- [x] 4.3 Update collection deletion in `apps/codever-api/src/routes/users/collections/personal-collections.service.js`
to `$pull` the collection from users' pinned entries (`{ id: collectionId, type: 'collection' }`). Verify with a new unit test.

## 5. Data migration

- [x] 5.1 Add a timestamped script `apps/codever-api/resources/db-migration/mongodb/<ts>_migrate-pinned-to-typed-entries.js`
that classifies each bare pinned id as bookmark or note (dropping orphans) and writes typed entries.
Batch classification with bulk `$in` queries across all users (build an `id → type` map, then rewrite each user), not per-user lookups. Verify by running it against a local seeded DB and confirming pinned lists render afterward.

## 6. Frontend models and services

- [x] 6.1 Add a `PinnedEntry` interface and change `UserData.pinned` to `PinnedEntry[]` in `apps/codever-ui/src/app/core/model/user-data.ts`.
Verify with `npm run build` from `apps/codever-ui` (type check).
- [x] 6.2 Extend `UserDataResource` to `Bookmark | Note | PinnedCollection` (add a light `PinnedCollection`
type in `apps/codever-ui/src/app/core/model/collection.ts`) in `apps/codever-ui/src/app/core/model/user-data-resource.type.ts`,
and make the shared filter pipes collection-aware (`apps/codever-ui/src/app/shared/pipe/resource-filter.pipe.ts`,
`apps/codever-ui/src/app/shared/pipe/resource-title-filter.pipe.ts`). Verify with `npm run build`.

> Scope note: the original task said `Collection`; a light `PinnedCollection` (`type: 'collection'`, no
> `items`) is used instead so the union is discriminable on `type`, and the two filter pipes needed
> collection-aware handling as a direct consequence of adding collections to `UserDataResource`.
- [x] 6.3 Update `updateUserDataPinned` in `apps/codever-ui/src/app/core/user-data.service.ts` to send typed entries.
Verify with `npm run build`.

## 7. Frontend stores

- [x] 7.1 Update `UserDataStore` pinned mutations (`addToUserDataPinned$`, `removeFromUserDataPinned$`, `reorderUserDataPinned$`, `removeFromStoresAtDeletion`)
in `apps/codever-ui/src/app/core/user/userdata.store.ts` to operate on typed entries. Verify with existing Jasmine specs for the store,
updated to typed entries.

> Verified with `npm run test:onpush` (pinned spec passes; only a pre-existing, unrelated collapse
> failure remains, confirmed at commit `f396982e`). `reorderUserDataPinned$` now takes
> `UserDataResource[]` instead of id strings.
- [x] 7.2 Update `UserDataPinnedStore` in `apps/codever-ui/src/app/core/user/userdata.pinned.store.ts` to pass typed entries
and expose collection entries in the resolved list. Verify with `npm test` from `apps/codever-ui`.

> `reorderPinnedBookmarks` now passes `UserDataResource[]` to the store (typed entries derive there);
> collection entries already flow through `_pinned` from the typed GET response. Note: the default
> `npm test` is broken repo-wide; the targeted `test:onpush` target was used instead.

## 8. Sidebar quick access

- [x] 8.1 Add `isCollection()` and collection navigation in `apps/codever-ui/src/app/left-navigation-menu/quick-access-resources.component.ts`,
rendering a folder badge and navigating to `/my-collections/:id` on click. Verify by manual observation: a pinned collection appears in the sidebar and clicking navigates to its detail page.

> Added `isCollection`/`isBookmark`/`isPublicResource`/`isPrivateResource` helpers, collection label/tooltip,
> and the `/my-collections/:id` navigation. Browser/manual check deferred to 12.3.
- [x] 8.2 Add the dialog icon per collection entry in `quick-access-resources.component.html` that opens the collection contents dialog,
stopping event propagation so it doesn't navigate. Verify by manual observation: clicking the icon opens the dialog, not the page.

> Added a folder-open icon calling `openCollectionContents($event, resource)`, which stops propagation
> and opens the dialog. Browser/manual check deferred to 12.3.
- [x] 8.3 Update `quick-access-resources.component.scss` for the folder badge and dialog icon styling. Verify by visual check.

> Added `.collection-last-search` badge and `.collection-contents-icon` styles. Visual check deferred to 12.3.

## 9. Collection contents dialog

- [x] 9.1 Create `apps/codever-ui/src/app/shared/dialog/collection-contents-dialog/collection-contents-dialog.component.{ts,html,scss}`
that loads the collection via `PersonalCollectionsService.getCollectionById`, shows bookmarks and notes, and filters by name/title/tag.
Verify with a Jasmine spec for the filter logic and by opening it manually.

> Pulled forward into section 8 (hard prerequisite for 8.2). Filter logic extracted to
> `collection-contents.filter.ts`; Jasmine spec added and run via a new `test:collection-contents`
> karma target (4/4 pass). Manual dialog check deferred to 12.3.
- [x] 9.2 Register the dialog component in `apps/codever-ui/src/app/shared/shared.module.ts` (and any declarations/entry components if required).
Verify with `ng lint` and `npm run build`.

> Obsolete: the app has no `shared.module.ts` - all components are standalone, so `MatDialog.open()`
> needs no module registration. `npm run build` type-checks the new dialog; `ng lint` has no target
> in this repo (see repo notes).

## 10. Ctrl+P popup

- [x] 10.1 Render collection entries in `apps/codever-ui/src/app/shared/dialog/history-dialog/hot-keys-dialog.component.{ts,html}`
as links to `/my-collections/:id` within the same filtered list. Verify by opening Ctrl+P with a pinned collection present
and confirming it appears and navigates.

> Added `isCollection()` + `collectionDetailsLink()` and a collection header/content branch (folder icon,
> routerLink to `/my-collections/:id`, `mat-dialog-close`). The popup shortcut is Ctrl/Cmd+Shift+P (not Ctrl+P).
> `main-link-shortcut.filters.spec.ts` updated for the new sidebar constructor deps. Manual check deferred to 12.3.
> `npm run build` is now GREEN; `test:main-link-shortcut` 29/29, `test-shortcuts` 8/8, `test:collection-contents` 4/4,
> `test:onpush` 15/16 (1 pre-existing failure).

## 11. Pin/unpin entry points

- [x] 11.1 Add pin/unpin actions to the collection cards in `apps/codever-ui/src/app/my-collections/my-collections-page.component.{ts,html}`,
toggling typed pinned entries. Verify by pinning/unpinning a collection from the list and confirming the sidebar updates.

> Added `isPinned(userData, collection)` + `addToPinned`/`removeFromPinned`; buttons in the card actions.
> Added `toPinnedCollection()` and `UserDataPinnedStore.addCollectionToPinned`/`removeCollectionFromPinned`.
> Manual sidebar-update check deferred to 12.3.
- [x] 11.2 Add pin/unpin actions to the collection detail header in `apps/codever-ui/src/app/my-collections/collection-detail/collection-detail.component.{ts,html}`.
Verify by pinning/unpinning from the detail page and confirming the sidebar updates.

> Added the same `isPinned`/`addToPinned`/`removeFromPinned` set and a header pin/unpin button.
> `main-link-shortcut.filters.spec.ts` updated for the new constructor deps (29/29). Manual check deferred to 12.3.
- [x] 11.3 Update the two `.pinned?.includes(...)` membership checks in `bookmark-list-element.component.html`
and `note-details.component.html` to match typed entries. Verify with `npm run build` and by confirming the pin/unpin icon still toggles correctly on bookmarks and notes.

> Pulled forward into section 7 (agreed) because the `test:onpush` pinned spec depends on it.
> Replaced both checks with typed-entry `isPinned(userData, resource)` helpers; the pinned spec now
> passes. (`npm run build` becomes green once 8.1/10.1 land.)

## 12. End-to-end verification

- [x] 12.1 Run backend unit tests (`npm test` from `apps/codever-api`) and confirm all pass. Verify by observing a green test run.

> 443/445 pass. The 2 failures are pre-existing and unrelated to pinned: `feature-toggle.service.test.js`
> (committed allowlist) and `personal-notes.service.test.js` (stale assertion expecting `{ new: true }`
> while the service passes `{ new: true, runValidators: true }`). All pinned/collection tests pass.
- [x] 12.2 Run frontend lint, tests, and build (`npm run lint`, `npm test`, `npm run build` from `apps/codever-ui`) and confirm they pass.
Verify by observing green outputs.

> `npm run build` is GREEN. `npm run lint` has no target in this repo (repo notes) and the default
> `npm test` is broken repo-wide, so targeted tools were used instead: `npx eslint` over the change's TS
> files reports 0 new errors (remaining errors/warnings are pre-existing in unrelated code);
> `test:onpush` 16 (1 pre-existing FAILED), `test:main-link-shortcut` 29/29, `test-shortcuts` 8/8,
> `test:collection-contents` 4/4.
- [ ] 12.3 Manually verify the full flow locally: pin a collection, see it in the sidebar and Ctrl+P popup mixed with bookmarks/notes,
navigate to it, open the contents dialog, filter it, and unpin it. Verify by reproducing each scenario from the spec.

> BLOCKED for automation: the running dev UI's elements never satisfy Playwright's actionability stability
> check (likely a continuous animation/HMR), so the scripted browser flow cannot complete. Needs a manual pass;
> the popup shortcut is Ctrl/Cmd+Shift+P (not Ctrl+P).
