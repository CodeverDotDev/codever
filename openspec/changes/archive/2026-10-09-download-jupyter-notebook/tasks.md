## 1. API: export without raw notebook content

- [x] 1.1 In `apps/codever-api/src/routes/users/notes/personal-notes.service.js`, exclude the raw notebook content field from `getAllMyNotes` so the personal notes export omits it while every note is still returned; verify with `npx jest --testPathPattern="personal-notes.service"` that the existing service tests still pass.
- [x] 1.2 Extend `apps/codever-api/src/routes/users/notes/personal-notes.service.test.js` to stub the note model's list query and assert that a notebook note is returned with its content type and extracted text but without the raw notebook field, and that a markdown note keeps all its fields; verify the new unit tests pass.

## 2. UI: download the original notebook from note details

- [x] 2.1 Add a notebook download action to the note details header in `apps/codever-ui/src/app/shared/note-details/note-details.component.html`, rendered only for notes whose content type is notebook and only outside list/summary renders; verify by opening a notebook's details page and a markdown note's details page, and by viewing the same notebook inside a list.
- [x] 2.2 Implement the download in `apps/codever-ui/src/app/shared/note-details/note-details.component.ts`: build the file from the note's stored original notebook JSON with media type `application/x-ipynb+json`, name it from the sanitized note title with an `.ipynb` extension (falling back to a default name if sanitizing yields nothing), and release the object URL afterwards; verify the downloaded file opens in Jupyter and matches the uploaded notebook.
- [x] 2.3 Suppress the action when the note has no stored notebook JSON, so no empty or invalid file can be produced; verify with such a note that the action is absent and the note still renders.

## 3. UI: explain notebook handling in the notes download

- [x] 3.1 Show a notice in `apps/codever-ui/src/app/shared/dialog/backup-bookmarks-dialog/` stating that Jupyter notebook notes are included without their raw `.ipynb` content, displayed for the notes download only; verify the notice appears in the notes download dialog and does not appear for the bookmarks download.

## 4. End-to-end verification

- [x] 4.1 Verify the owner flow: upload a notebook, open its details, download it, and confirm the downloaded `.ipynb` is byte-equivalent to the uploaded original.
- [x] 4.2 Verify the public flow: confirm a non-owner viewing a public notebook's details can download the original file, and that a markdown note's details offer no notebook download action.
- [x] 4.3 Verify the export flow: confirm the personal notes export includes notebook notes without any raw notebook payload, and that the notes download dialog shows the notice, while the bookmarks export is unchanged.
- [x] 4.4 Run `npm test` in `apps/codever-api`, and `ng lint` plus `npm run build` in `apps/codever-ui`; confirm all pass.
