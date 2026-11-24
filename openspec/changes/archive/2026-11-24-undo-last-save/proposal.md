## Why

Saving a note or bookmark overwrites it in place: the API keeps no earlier
version. When content is deleted by mistake during an edit and the owner
notices it right after saving, it cannot be recovered. A one-time undo right
after the save closes this gap without storing any history.

## What Changes

- After the owner saves an edit of their note or bookmark in the editor, the
  entry's details page opens and offers "Undo last save" once. Undo asks for
  confirmation and writes the entry as it was loaded into the editor back
  through the normal update; there is no redo.
- The undo exists only on that page: leaving it, reloading it or coming back
  to it later removes the offer. Nothing is stored on the server.
- The bookmark editor opens the bookmark's details page after an edit, as
  the note editor does, instead of the history list. Both editors replace
  themselves in the browser history, so Back returns to where the edit
  started.
- An admin edit of another user's bookmark keeps opening the history list and
  offers no undo.
- Out of scope: a trash bin for deleted entries, undo of checkbox ticks on
  the note details page, undo of MCP updates, and loading an earlier version
  into the editor (separate changes, if wanted).

## Capabilities

### New Capabilities

- `undo-last-save`: a one-time undo of the save of an own note or bookmark,
  offered on the details page the editor opens after the save.

### Modified Capabilities

None.

## Impact

- Apps: codever-ui only. The API, its routes, models and OpenAPI are
  unchanged; undo uses the existing personal note and bookmark `PUT`.
- UI: the note and bookmark editors (keep the entry as loaded, navigate to
  details after an edit), the note and bookmark details pages (undo action in
  the card footer), a shared undo component and confirmation dialog.
- Dependencies: none.
