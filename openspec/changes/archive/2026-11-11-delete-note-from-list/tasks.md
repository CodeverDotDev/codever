## 1. Client state and service plumbing

- [x] 1.1 In `PersonalNotesService.deleteNoteById`, invalidate note caches
  via `invalidateEntryCaches('note')` on success (D5); verify with a Vitest
  spec asserting the invalidation is called after a successful delete and
  not on error.
- [x] 1.2 Add `noteDeleted$` / `deleteNote(note)` to `NotifyStoresService`
  and subscribe in `UserDataPinnedStore` and `UserDataHistoryStore` to drop
  notes from loaded pages and local history cache (D4); verify with Vitest
  specs that loaded pinned and history pages no longer contain the note.
- [x] 1.3 Add `UserDataStore.removeNoteLocally(note)` that filters the id
  from `pinned` (type `note`), `history`, and `favoriteNotes`, re-publishes
  user data, notifies `NotifyStoresService.deleteNote`, and makes no HTTP
  call (D4); verify with a Vitest spec covering all three lists and
  asserting `updateUserData` is not called.

## 2. Delete action on the note card

- [x] 2.1 Add a footer Delete button (`far fa-trash-alt`, title
  "Delete note") after Clone in `note-details.component.html`, guarded by
  `!isSharedView && userId && note.userId === userId` (D1); verify with
  Vitest specs: shown for owner in list and details mode, hidden for other
  user's public note, anonymous user, and shared view.
- [x] 2.2 Add `openDeleteDialog(note)` opening `DeleteResourceDialogComponent`
  with `resourceName`, `type: 'note'`, `isPublic`, and `disableClose`;
  verify with a Vitest spec that cancelling does not call `deleteNoteById`.
- [x] 2.3 Add `deleteNote(note)` and `@Output() noteDeleted`: on success call
  `removeNoteLocally`, show success toast, then emit `noteDeleted` when
  `partOfList` or navigate to `['']` otherwise; on error show error toast
  and keep the card (D1, D3); verify with Vitest specs for list-mode emit,
  details-mode navigation, and error path (no emit, no navigation).

## 3. In-place removal in lists

- [x] 3.1 In `AsyncSearchResultListComponent`, bind `(noteDeleted)` on
  `app-note-details` and skip cards whose id is in a `deletedNoteIds`
  signal (D2); verify with a Vitest spec that after the event the card is
  gone, other results remain, and `filterText` is unchanged.
- [x] 3.2 Apply the same `(noteDeleted)` binding and `deletedNoteIds` filter
  in `AsyncNoteListComponent` (D2); verify with a Vitest spec, and make sure
  `onpush-lists.spec.ts` still passes.

## 4. Editor consistency

- [x] 4.1 Call `UserDataStore.removeNoteLocally(note)` in
  `NoteEditorComponent.deleteNote` on success, keeping its navigate-home and
  toast behavior (D6); verify existing editor specs pass and a new spec
  asserts `removeNoteLocally` is called.

## 5. Verification

- [x] 5.1 Run `npm test` and `npm run lint` in `apps/codever-ui`; both pass.
- [ ] 5.2 Manually verify with `npm start` and `docker-compose up` (user
  mock/mock): delete an own note from search results (card disappears, query
  and filter kept, no reload), from the My Notes dashboard, and from the
  details page (navigates home); cancel leaves the note; a pinned + favorite
  note disappears from quick access and favorites without reload; no Delete
  shows on another user's public note or a share-link view.
