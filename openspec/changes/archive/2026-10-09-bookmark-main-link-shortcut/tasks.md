## 1. Shortcut coordination

- [x] 1.1 Add centralized `k+k` sequence recognition with a 400 ms timeout,
  auto-repeat rejection, reset behavior, and editable-control guards; verify
  with Karma/Jasmine tests for in-time, late, repeated, interrupted, and
  editable-input key events.
- [x] 1.2 Define the active-context resolution contract for details,
  Pinned/History dialogs, side Pinned quick access, My Collections, collection
  details, and search results; verify unit tests cover exact-one-bookmark,
  exact-one-collection, zero, multiple, note-only, and details-versus-side-panel
  precedence cases.

## 2. UI behavior integration

- [x] 2.1 Integrate `k+k` with bookmark details, Pinned/History dialogs, side
  Pinned quick access, and search results so the bookmark opens in a new
  tab without changing the current UI; verify component tests spy on new-tab
  opening and assert dialogs, filters, and routes remain unchanged.
- [x] 2.2 Add `Enter` handling to the focused Pinned/History, side Pinned,
  collection-details, and search-results filters, including empty filters with
  exactly one visible bookmark; verify tests cover bookmark, note,
  zero-result, and multiple-result cases and preserve normal input behavior
  otherwise.
- [x] 2.3 Add `Enter` handling to the focused My Collections filter so exactly
  one visible collection opens in the current tab through existing collection
  navigation; verify component tests cover empty filters, one collection, zero
  collections, and multiple collections.
- [x] 2.4 Preserve existing history-promotion behavior when a shortcut opens a
  bookmark main link; verify the relevant component/service tests assert
  promotion occurs once and no API changes are required.

## 3. Shortcut discoverability

- [x] 3.1 Update the Hot Keys/help, About, Home tab, and quick-access shortcut
  hints to reflect the actual bindings; verify rendered text and existing
  shortcut tests cover `k+k`, `Enter`, and the unchanged Pinned/History/search
  shortcuts.
- [x] 3.2 Add `Enter` helper text beside Pinned/History, My Collections,
  collection-details, and search-results filters and a `k+k` hint to the
  bookmark details main-link affordance without adding per-card noise; verify
  component/template tests assert the hints appear in the intended surfaces.

## 4. Validation

- [x] 4.1 Run the targeted Angular Karma/Jasmine shortcut and affected component
  tests and verify they pass.
- [x] 4.2 Run the Codever UI lint/build validation and verify no template,
  TypeScript, accessibility, or formatting errors are introduced.
