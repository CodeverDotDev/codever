## Context

See proposal.md for the motivation. Current state:

- The note editor (`note-editor.component.ts`) and the bookmark editor
  (`save-bookmark-form.component.ts`) receive the entry freshly loaded from
  the API (`update-personal-note`, `update-personal-bookmark`) and save it
  with the personal `PUT`.
- The API applies a `PUT` with `findOneAndUpdate(body)`: fields missing from
  the body keep their stored value.
- After a note save the editor opens `/my-notes/:id/details`; after a
  bookmark save it opens `/history`.
- The details pages show a router-state entry as a placeholder and then load
  the entry from the API.

## Goals / Non-Goals

**Goals:**

- Undo the save the owner has just made, once, with no server changes.

**Non-Goals:**

- Undo after leaving the page, on other devices or after a reload.
- Undo of checkbox ticks on the details page, MCP updates or admin edits.
- Restoring deleted entries (trash bin, separate change).

## Decisions

### The editor hands the entry as loaded to the details page

When an edit is loaded, each editor keeps a `structuredClone` of the entry
(`noteBeforeEdit`, `bookmarkBeforeEdit`). After a successful personal update
it opens the details page with `replaceUrl: true` and puts that copy into the
router state under `undoLastSave`.

Alternative considered (built first, then dropped): keep the version from
before every save on the server for 24 hours, in its own collection with a
TTL index and read/restore endpoints. It also covered checkbox ticks, MCP
updates and other devices, but needed four endpoints, cleanup on every delete
and admin path, and a UI that had to explain the stored version. The owner
wants only an undo right after saving.

### The details page takes the offer once

`takeUndoLastSave(entryId)` reads `undoLastSave` from `window.history.state`
and removes it from that history entry with `history.replaceState`, keeping
the router's own state. So reloading, or coming back with Back/Forward, finds
nothing. It only accepts an entry with the page's id. The note details page
takes it only when it is the routed page, not in lists, search results or the
shared view.

### Undo is a normal update

`UndoLastSaveComponent` (`shared/undo-last-save/`) asks for confirmation and
writes the copy back with `PersonalNotesService.updateNote` or
`PersonalBookmarksService.updateBookmark`, so validation and the public
bookmark conflict (409) apply as on a save. Because a `PUT` keeps missing
fields, `toUndoUpdate` sets every content field the copy lacks to `null`
(`[]` for tags and copyable fields, `false` for public) and sets
`updatedAt`. On success it updates the history store, emits the restored
entry, and the page shows it and drops the offer.

### Placement

The action sits at the top of the entry card's footer on both pages, above
the tags and separated by a line, with an outlined button. The bookmark card
is the shared list element, so it renders the action only with its
details-page flag and an `undoLastSave` input, and passes the restored
bookmark up.

## Risks / Trade-offs

- [Concurrent edit elsewhere between load and undo] → undo writes the loaded
  copy over it, the same lost-update risk a normal save has; the window is
  seconds.
- [Router-state size] → one entry, including notebook content up to the
  6 MB body limit; the browser keeps it only in that history entry and it is
  removed when taken.
- [A save without changes] → the undo is still offered and writes the same
  content back; harmless.
