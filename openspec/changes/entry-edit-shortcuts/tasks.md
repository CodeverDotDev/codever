## 1. Shared key guard and `e` shortcut

- [x] 1.1 Move the editable-target and Ctrl/Cmd/Alt checks of
  `MainLinkShortcutService` into a shared helper in `core/shortcut` and use
  it for `k+k`; verify the existing `main-link-shortcut.service` specs pass
  unchanged
- [x] 1.2 Add `EditShortcutService` (register/unregister contexts; plain
  `e`/`E` only, no repeat, no editable target, no open dialog, latest
  context with `canEdit()`), called from `AppComponent`'s `window:keydown`
  listener; verify with Vitest specs for each guard and for triggering
  `edit()`
- [x] 1.3 Register an edit context in `shared/bookmark-list-element` when
  `isDetailsPage` is set (both bookmark details pages), with the Edit
  button's condition (owner or `ROLE_ADMIN`) and `editBookmark`,
  unregistering on destroy; verify with component specs that `e` opens the
  edit route for the owner and admins and does nothing for other users or
  in lists
- [x] 1.4 Register an edit context in `shared/note-details` only when it is
  a details page (not `partOfList`, `inSearchResults` or `isSharedView`),
  calling `editNote`; verify with specs that it registers on details pages,
  not in lists or shared views, and only for the owner

## 2. Entry forms

- [x] 2.1 Add `Ctrl+Enter` / `Cmd+Enter` on the note form: prevent the line
  break and submit through the same path as `(ngSubmit)` when Save is
  enabled; verify with specs for a valid form (saved) and an invalid form
  (not saved)
- [x] 2.2 Add the same `Ctrl+Enter` / `Cmd+Enter` handling to the bookmark
  form; verify with the matching specs
- [x] 2.3 Add `Escape` in edit mode of both forms calling `cancelUpdate()`,
  skipped when the event is already handled or an autocomplete panel, menu
  or dialog is open, and inactive in create, clone and copy-to-mine modes;
  verify with specs for edit mode, an open panel and create mode

## 3. Labels and help

- [x] 3.1 Add the shortcuts to the tooltips: Edit "(e)" on details pages,
  Save "(Ctrl/Cmd+Enter)", Cancel "(Esc)" in edit
  mode; verify with specs or by observation in the running UI
- [x] 3.2 Add the three shortcuts to `public/howto/howto-hotkeys`; verify
  the `howto-hotkeys` spec covers the new rows

## 4. Checks

- [x] 4.1 Run `npm test` and `npm run lint` in `apps/codever-ui`; verify no
  new failures or lint errors
- [x] 4.2 In the running UI: on a note and a bookmark details page press `e`,
  then `Ctrl/Cmd+Enter` to save; edit again and press `Escape` with and
  without changes; type `e` in the search box on a details page; verify the
  behavior by observation
