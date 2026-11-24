## Why

A bare link pasted into a chat or email says nothing about what it points
to. When sharing a note or bookmark, users want to paste the title and the
tags together with the link, without retyping them.

## What Changes

- The Share dialogs get a "Copy with details" button next to the existing
  copy action. It copies two lines of plain text: the title followed by the
  tags as `#tag`, then the link.
- Bookmark dialog: next to "Link"; the copied link is the bookmark's own
  URL (as "Link" copies today).
- Public note dialog: next to "Copy link"; the copied link is the public
  note URL.
- Private note dialog with an active revocable link: next to "Copy" in the
  revocable-link row; the copied link is the revocable share link.
- The bookmark revocable-link row keeps only its plain "Copy".
- Existing copy, Email and Tweet buttons are unchanged.

## Capabilities

### New Capabilities

- `share-copy-with-details`: copying a note or bookmark's title, tags and
  link as plain text from the Share dialogs.

### Modified Capabilities

None.

## Impact

- App: codever-ui only (bookmark and note Share dialogs, a small shared
  text builder). No codever-api changes.
- Routes: no public or personal API routes change; no new requests are
  made, so there are no localStorage cache implications.
- Models: no Mongoose model changes.
- Dependencies: none added.
