## Why

Deleting a note currently requires opening it in the editor first and then
clicking Delete there. Bookmarks can already be deleted straight from search
results and lists, so notes feel inconsistent and cleanup of several notes is
slow.

## What Changes

- Add a footer **Delete** button (after Edit / Clone) to every note card that
  belongs to the logged-in user: search results, the My Notes dashboard list,
  and the note details page.
- The button is hidden in the shared (share-link) view and on notes owned by
  other users.
- Clicking it opens the existing delete-confirmation dialog; nothing is
  deleted unless the user confirms.
- After a confirmed delete:
  - in a list (search results, My Notes dashboard), the card disappears in
    place without a page reload, preserving query, filter, and scroll;
  - on the note details page, the user is navigated to the home page;
  - a success notification is shown; on failure an error notification is
    shown and the note stays visible.
- The deleted note is also dropped from client-side pinned, history, and
  favorite state so those views do not show a stale entry.
- The existing Delete action in the note editor stays unchanged.

## Capabilities

### New Capabilities

- `note-quick-delete`: deleting an owned note directly from note cards
  (lists and details page) with confirmation and in-place removal.

### Modified Capabilities

None.

## Impact

- **Apps**: `codever-ui` only. `codever-api` is unchanged.
- **Routes**: uses the existing personal (authenticated) route
  `DELETE /api/personal/users/:userId/notes/:noteId`, already protected by
  `keycloak.protect()` and `UserIdValidator`. No public routes are affected.
- **APIs**: no new or changed endpoints. The backend already removes the note
  from pinned, history, favorites, and share links on delete.
- **Mongoose models**: none.
- **Dependencies**: none added. Reuses `DeleteResourceDialogComponent`,
  `PersonalNotesService.deleteNoteById`, and `DeleteNotificationService`.
- **UI code touched**: `NoteDetailsComponent`, `AsyncNoteListComponent`,
  `AsyncSearchResultListComponent`, and the user data and history stores.
