## 1. Editors

- [x] 1.1 Keep a copy of the entry as loaded in the note and bookmark editors
  and, after a successful personal update, open its details page with
  `replaceUrl` and the copy in the router state; keep `/history` for admin
  edits of another user's bookmark; verify with Vitest specs

## 2. Undo

- [x] 2.1 Add `takeUndoLastSave` (once, matching id, removed from the history
  entry) and `toUndoUpdate` (clears fields the save filled in); verify with a
  Vitest spec
- [x] 2.2 Add the undo component and confirmation dialog (confirm, cancel,
  normal update, history store, error message for 409 and others); verify
  with a Vitest spec
- [x] 2.3 Show the undo in the card footer of the note details page (routed
  page only) and the bookmark details page, and show the restored entry;
  verify with Vitest specs

## 3. Checks

- [x] 3.1 Run the UI lint, the Vitest suite and the build; verify they pass
  without new errors, and that the API is unchanged
- [x] 3.2 With both apps running, edit a note and remove a paragraph, save,
  undo on the details page and confirm the paragraph is back and the action
  is gone; edit a bookmark from search results, save, check the undo, then
  go Back to the results and reopen the bookmark: no undo; verify by
  observation
