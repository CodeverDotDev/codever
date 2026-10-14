## 1. Shared activation and resolution helpers

- [x] 1.1 Add `activateResource(resource, userIsLoggedIn, activatableTypes)` to
  `MainLinkShortcutService` (inject `Router`) dispatching by `type`: bookmark ->
  `openBookmarkInNewTab`, note -> current-tab navigation with router state,
  collection -> `/my-collections/:id`, and a no-op for a type the caller does
  not activate; verify with unit tests in `main-link-shortcut.service.spec.ts`
  covering all three types, the public-vs-personal note route, a disallowed
  type, and a missing id.
- [x] 1.2 Add one shared note/collection link helper so the public/personal
  note route is decided once, and a shared "single visible resource" resolver
  plus a hint-label helper; verify unit tests cover zero, one, and multiple
  results and each resource type.

## 2. Filter `Enter` integration

- [x] 2.1 Update `QuickAccessResourcesComponent` to resolve the single visible
  resource and delegate to `activateResource`; rename
  `hasSingleFilteredBookmark` to a resource-generic getter and drop the
  empty-filter `trim()` guard; verify the `filters.spec.ts` suite opens a
  bookmark, a note, and a collection, and no-ops for ambiguous results.
- [x] 2.2 Update `HotKeysDialogComponent` to delegate to `activateResource` and
  close the dialog when the activated result navigates in the current tab;
  verify the spec inverts its "does nothing when the only visible resource is a
  note" case and covers collections.
- [x] 2.3 Keep `AsyncSearchResultListComponent` bookmark-only by declaring only
  `bookmark` as an activatable type; verify a test asserts a lone visible note
  is a no-op and that the search page and filter state are preserved.
- [x] 2.4 Update `CollectionDetailComponent.onFilterEnter` to require
  `filteredBookmarks.length + filteredNotes.length === 1` and delegate to
  `activateResource`; verify the spec covers a lone note and keeps the
  bookmark+note pair a no-op.
- [x] 2.5 Add an `Enter` handler to `CollectionContentsDialogComponent` over
  `filteredBookmarks + filteredNotes` that delegates to `activateResource` and
  closes the dialog for in-app navigation; verify with a new component spec.
- [x] 2.6 Route `MyCollectionsPageComponent.onFilterEnter` through the shared
  activation path; verify `test:my-collections` still navigates to the only
  collection in the current tab and no-ops for zero or many.

## 3. Hints and help copy

- [x] 3.1 Replace the hard-coded "bookmark" hints with the type-aware hint
  helper in the side Pinned, Pinned/History dialog, collection-details, and
  collection contents dialog templates, and keep the search-results hint
  bookmark-only; verify each hint names the matching type and is absent when
  the single visible result is not activatable on that surface.
- [x] 3.2 Update the Hot Keys page and About copy so `Enter` is described as
  activating the only visible result of any supported type; verify the rendered
  text matches the bindings and `k+k` stays documented as bookmark-only.

## 4. Validation

- [x] 4.1 Run the targeted suites `npm run test:main-link-shortcut`,
  `npm run test:collection-contents`, and `npm run test:my-collections` and
  verify they pass.
- [x] 4.2 Run `npm run build:aot` (the only template type-checking build) and
  `npx eslint` on the changed files, and verify no template, type, or lint
  errors are introduced.
