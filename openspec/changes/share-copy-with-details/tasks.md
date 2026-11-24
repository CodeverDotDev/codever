## 1. Details text builder

- [ ] 1.1 Add `shared/share-details/share-details.ts` with
  `buildShareDetails(title, tags, link)`; verify with
  `share-details.spec.ts` covering title with tags, no tags, and that the
  result is exactly two lines

## 2. Share dialogs

- [ ] 2.1 Bookmark dialog: add "Copy with details" after "Link", copying
  the block with `bookmark.location`, "Copied" feedback and an error
  message on failure; verify in `social-share-dialog.component.spec.ts`
  (clipboard text, feedback, failure, no button in the revocable row)
- [ ] 2.2 Public note: add "Copy with details" after "Copy link" in
  `note-social-share-dialog-content`, copying the block with the public
  note URL; verify with a new
  `note-social-share-dialog-content.component.spec.ts`
- [ ] 2.3 Private note: add "Copy with details" to the revocable-link row
  for private notes, copying the block with the share link; verify in
  `note-social-share-dialog.component.spec.ts` (shown only with an active
  link, not in the public-note revocable row)

## 3. Checks

- [ ] 3.1 Run the UI tests, `npm run lint` and `npm run build` in
  `apps/codever-ui`; verify no failures and no new lint errors
- [ ] 3.2 In the running app, copy with details from a bookmark, a public
  note and a private note with a revocable link; verify the pasted text
  matches the spec
