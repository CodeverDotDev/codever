## Context

The bookmark Share dialog (`social-share-dialog`) copies
`bookmark.location` with a hidden-textarea `execCommand('copy')`. The note
Share dialog (`note-social-share-dialog`) shows a content component with
"Copy link" (CDK `Clipboard`) for public notes, and a revocable-link row
with "Copy" (`navigator.clipboard.writeText`) for owners.

## Goals / Non-Goals

**Goals:**

- One pure, unit-tested function builds the details block for both entry
  types, so both dialogs produce the same format.
- Small, local template changes in the existing dialogs.

**Non-Goals:**

- Changing the Email body or Tweet text.
- Rich text / HTML clipboard formats.
- A summary of the note content or bookmark description: dropped to keep
  the copy short and avoid Markdown/notebook parsing; public notes get a
  summary in their link preview (`public-link-previews`).
- Remembering a preference between plain copy and copy with details.

## Decisions

- **Separate button, not a checkbox.** One click, no hidden state, no
  question of whether a preference persists or affects other buttons.
- **Text builder in `shared/share-details/share-details.ts`**: exports
  `buildShareDetails(title, tags, link)` returning
  `` `${[title, ...tags.map((t) => '#' + t)].join(' ')}\n${link}` ``.
  A pure function shared by both dialogs keeps the format identical.
- **Clipboard writes use `navigator.clipboard.writeText`**, matching the
  revocable-link copy, with the same error handling ("could not be
  copied"). Existing buttons keep their current mechanism.
- **Placement**:
  - bookmark dialog: a new column after "Link";
  - note content component: a new column after "Copy link" (public notes);
  - note dialog, private-note revocable-link row: a button between "Copy"
    and "Stop sharing". The public-note revocable-link row does not get
    it, because the main row already has it.

## Risks / Trade-offs

- [`navigator.clipboard` requires a secure context] → Production and
  localhost are secure; failures show the error message.

## Migration Plan

UI-only; ships with a normal UI deploy and is rolled back by redeploying
the previous build. No data changes.
