## Why

Editing a note or bookmark always needs the mouse: click Edit on the details
page, then click Save or Cancel in the form. Codever already has keyboard
shortcuts for opening things (`k+k`, `Ctrl/Cmd+K`, `Ctrl/Cmd+Shift+P/H`), but
none for the most common change to an entry, so a keyboard-only
view-edit-save round trip is not possible.

## What Changes

- **`e` on a details page opens the edit form.** On the details page of a note
  (`/my-notes/:id/details`, `/notes/:id/details`) or a bookmark
  (`/my-bookmarks/:id/details`, `/bookmarks/:id`), pressing `e` does what the
  Edit button does. It works only where the Edit button is shown (own entry;
  for bookmarks also admins), never while typing in an editable control, with
  Ctrl/Cmd/Alt held, on key auto-repeat, or while a dialog is open. Lists,
  shared-link views and other users' entries are unaffected.
- **`Ctrl+Enter` / `Cmd+Enter` saves the note or bookmark form.** In the note
  and bookmark forms, the combination does what the Save button does, from
  any field, including validation; when Save is disabled nothing happens.
- **`Escape` leaves the edit form.** In edit mode of the note and bookmark
  forms, `Escape` does what Cancel does: it goes back (normally to the
  details page), with the existing unsaved-changes protection. When an
  autocomplete panel, menu or dialog is open, `Escape` only closes it, as
  today.
- **Labels and help.** The Edit, Save and Cancel buttons name their shortcut
  in their tooltip, and the Hot Keys help page lists the three shortcuts.

## Capabilities

### New Capabilities

- `entry-edit-shortcuts`: keyboard shortcuts to open the edit form from a
  note or bookmark details page, and to save or leave the note and bookmark
  forms.

### Modified Capabilities

- `quick-access-shortcuts`: the "Shortcut labels match the bindings"
  requirement extends the Hot Keys help page and the details/form labels to
  the new shortcuts.

## Impact

- **Apps:** `codever-ui` only. No `codever-api` change.
- **Routes:** personal pages (`/my-notes/:id/details`,
  `/my-bookmarks/:id/details`, the `:id/edit` forms) and the public details
  pages (`/notes/:id/details`, `/bookmarks/:id`) when the signed-in user may
  edit the entry. No API routes change.
- **Code:** `shared/note-details`, `my-bookmarks/bookmark-details`,
  `public/bookmarks/public-bookmark-details`,
  `my-notes/save-note-form/note-editor`,
  `my-bookmarks/save-bookmark-form`, `core/shortcut` (shared key guard),
  `public/howto/howto-hotkeys`.
- **APIs, Mongoose models, dependencies:** none.
