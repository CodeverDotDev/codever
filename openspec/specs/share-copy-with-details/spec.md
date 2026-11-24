# share-copy-with-details Specification

## Purpose

Lets users copy a note's or bookmark's title, its tags and its link as
plain text from the Share dialogs, to paste into messages or emails.

## Requirements

### Requirement: Copy with details in the Share dialogs

The Share dialogs SHALL offer a "Copy with details" action that copies a
plain-text block for the entry to the clipboard:

- Bookmark Share dialog: next to the action that copies the bookmark's URL;
  the block uses the bookmark's own URL.
- Public note Share dialog: next to the action that copies the public note
  link; the block uses the public note URL.
- Private note Share dialog, while a revocable link is active: next to the
  revocable link's copy action; the block uses the revocable share link.

The bookmark dialog's revocable-link row SHALL NOT offer the action. The
existing copy, Email and Tweet actions SHALL behave as before. After a
successful copy the button SHALL briefly show "Copied"; when the clipboard
is unavailable or the copy fails, the dialog SHALL show an error message.

#### Scenario: Bookmark copied with details

- **WHEN** the user clicks "Copy with details" in a bookmark's Share dialog
- **THEN** the clipboard holds the bookmark's details block ending with the
  bookmark's own URL
- **AND** the button briefly shows "Copied"

#### Scenario: Public note copied with details

- **WHEN** the user clicks "Copy with details" in a public note's Share
  dialog
- **THEN** the clipboard holds the note's details block ending with the
  public note URL

#### Scenario: Private note with an active revocable link

- **WHEN** the owner clicks "Copy with details" next to an active revocable
  link of a private note
- **THEN** the clipboard holds the note's details block ending with the
  revocable share link

#### Scenario: Private note without an active link

- **WHEN** a private note's Share dialog shows no active revocable link
- **THEN** no "Copy with details" action is shown

#### Scenario: Clipboard unavailable

- **WHEN** the copy to the clipboard fails
- **THEN** the dialog shows an error message and the clipboard is unchanged

### Requirement: Details block content

The copied block SHALL be plain text of two lines:

1. The title (the note title or the bookmark name), followed by the tags,
   each prefixed with `#`, separated from the title and from each other by
   single spaces. Without tags the line is the title alone.
2. The link.

The block SHALL NOT include the note content or bookmark description.

#### Scenario: Title with tags

- **WHEN** a note has title "Probes" and tags `kubernetes`, `devops`
- **THEN** the block is "Probes #kubernetes #devops" followed by a line
  with the link

#### Scenario: No tags

- **WHEN** a bookmark has no tags
- **THEN** the block is the bookmark name followed by a line with its URL

#### Scenario: Content is not copied

- **WHEN** a note with content is copied with details
- **THEN** no part of its content appears in the block
