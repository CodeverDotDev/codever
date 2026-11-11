## Context

See proposal.md for motivation and specs/note-quick-delete/spec.md for the
required behavior.

Current state in `codever-ui`:

- Every note card is rendered by `NoteDetailsComponent` (search results via
  `AsyncSearchResultListComponent`, the My Notes dashboard and public notes
  via `AsyncNoteListComponent`, and the details pages directly). The card
  knows whether it is `partOfList`, `isSharedView`, and who the current
  user is.
- The only note delete flow lives in `NoteEditorComponent`: it opens
  `DeleteResourceDialogComponent` (`type: 'note'`), and on
  `DELETE_CONFIRMED` calls `PersonalNotesService.deleteNoteById`, then
  navigates home and shows a toast.
- Bookmark cards delete in place, but on the search page they fall back to
  `location.reload()`.
- `PersonalNotesService.createNote` and `updateNote` invalidate the note
  localStorage caches; `deleteNoteById` does not.
- The API (`deleteNoteById` in `personal-notes.service.js`) already removes
  the note from every user's `pinned`, `history`, and `favoriteNotes`, and
  revokes share links. Client-side `UserDataStore`,
  `UserDataPinnedStore`, and `UserDataHistoryStore` keep their own
  in-memory copies that are not refreshed.

```
 NoteDetailsComponent (card)
   [Delete] --> DeleteResourceDialog --(DELETE_CONFIRMED)-->
       PersonalNotesService.deleteNoteById  (+ invalidate note caches)
         |-- ok --> UserDataStore.removeNoteLocally(note)
         |            '--> NotifyStoresService.deleteNote(note)
         |                   '--> UserDataPinnedStore drops pinned entry
         |                   '--> UserDataHistoryStore drops history entry
         |          partOfList ? emit noteDeleted(note) : navigate ['']
         |          success toast
         '-- err -> error toast, card stays
 List (AsyncSearchResultList / AsyncNoteList)
   (noteDeleted) --> add id to deletedIds --> card hidden
```

## Goals / Non-Goals

**Goals:**

- One delete implementation on the card, reused by all hosts.
- Remove the card without reloading the page or re-running the search.
- Keep client state (pinned, history, favorites, caches) consistent after
  any note delete, including the existing editor flow.

**Non-Goals:**

- No API, route, or model changes.
- No admin delete of other users' notes.
- No bulk or multi-select delete.
- No undo.
- No change to bookmark delete behavior (including its
  `location.reload()`).

## Decisions

### D1: Delete logic lives in `NoteDetailsComponent`

The card already holds the ownership, shared-view, and list-context flags
needed to decide visibility and post-delete behavior. Add
`openDeleteDialog(note)` and `deleteNote(note)` there, plus
`@Output() noteDeleted = new EventEmitter<Note>()`.

The footer button uses the same guard as Edit/Clone:
`!isSharedView && userId && note.userId === userId`.

*Alternative*: put the logic in each list host. Rejected because the details
page has no list host, so logic would be duplicated three times.

### D2: Lists hide deleted cards with a local id set

`AsyncSearchResultListComponent` and `AsyncNoteListComponent` bind
`(noteDeleted)` and record the id in a `deletedNoteIds` signal (a `Set`).
The `@for` loop skips ids in the set. Using a signal keeps the OnPush lists
updating without manual `markForCheck`.

*Alternatives*:
- `location.reload()` as bookmarks do. Rejected: loses filter text and
  scroll, which the user explicitly wants to keep.
- Re-fetch the search/list. Rejected: extra request and visible flicker;
  the server result is already known.
- Mutating the source array. Rejected: inputs are shared observables and the
  `resourceFilter` pipe is pure, so mutation would not re-render reliably.

Pagination is not re-balanced; the page simply shows one fewer card until
the next navigation. This matches how bookmark lists behave.

### D3: After delete on the details page, navigate home

When `partOfList` is false, navigate to `['']`, the same as the editor
flow, because the current page's note no longer exists.

### D4: Local-only cleanup of user data

Add `UserDataStore.removeNoteLocally(note)` which filters the note id out of
`userData.pinned` (type `note`), `userData.history`, and
`userData.favoriteNotes`, then re-publishes `userData`. It does **not** call
`updateUserData$`.

Add `NotifyStoresService.deleteNote(note)` / `noteDeleted$`, and have
`UserDataPinnedStore` and `UserDataHistoryStore` subscribe to drop the note
from their loaded pages, mirroring the existing `bookmarkDeleted$` wiring.
The history store also removes the entry from its local history cache.

*Alternative*: reuse `removeFromStoresAtDeletion` (bookmark version) which
PUTs the full user data. Rejected: the backend has already pulled these
references, and a full PUT could overwrite concurrent changes.

### D5: Invalidate note caches on delete

`PersonalNotesService.deleteNoteById` gains
`tap(() => httpClientLocalStorageService.invalidateEntryCaches('note'))`,
matching create/update. The editor delete flow benefits too.

### D6: Editor delete reuses the same cleanup

`NoteEditorComponent.deleteNote` also calls
`UserDataStore.removeNoteLocally(note)` so both entry points leave the same
client state. Its UI behavior (navigate home + toast) is unchanged.

## Auth and caching impact

- Uses the existing personal route
  `DELETE /api/personal/users/:userId/notes/:noteId`, guarded by
  `keycloak.protect()` and `UserIdValidator`. The button is only rendered
  for the owner; the server remains the authority, so a forged request for
  another user's note still fails with `UseridValidationError` (401) or
  `NotFoundError` (404).
- Note-related localStorage caches (`invalidateEntryCaches('note')`, e.g.
  personal note tags) are cleared after a successful delete.

## Risks / Trade-offs

- [Accidental delete from a dense results list] -> Confirmation dialog is
  mandatory; button is labelled text, not a bare icon.
- [Page shows fewer items than the page size after deletes] -> Accepted;
  the next navigation or search refreshes the page.
- [Other open tabs keep stale state] -> Accepted; same as today for editor
  deletes.
- [Public notes list shows the user's own public note after delete if the
  list was rendered before] -> Handled by D2 since public notes also use
  `AsyncNoteListComponent`.

## Migration Plan

UI-only change; deploy with the next frontend release. Rollback by reverting
the frontend build. No data migration.
