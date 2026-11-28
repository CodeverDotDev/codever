# entry-edit-shortcuts Specification

## Purpose

Let users open, save and leave the edit form of their notes and bookmarks
from the keyboard, so that viewing, editing and saving an entry needs no
mouse.

## Requirements

### Requirement: Open the edit form from a details page with `e`

The web UI SHALL open the edit form of the displayed entry when the user
presses `e` on a note details page (`/my-notes/:id/details`,
`/notes/:id/details`) or a bookmark details page (`/my-bookmarks/:id/details`,
`/bookmarks/:id`), with the same result as the page's Edit action. The
shortcut SHALL be available only when that Edit action is offered to the
user. It SHALL NOT act when the key is pressed in an editable control, with
`Ctrl`, `Cmd` or `Alt` held, as a key auto-repeat, or while a dialog is open,
and it SHALL NOT act in entry lists, search results or shared-link views.

#### Scenario: Edit own note from its details page
- **WHEN** a signed-in user views the details page of their own note and
  presses `e` outside an editable control
- **THEN** the note's edit form opens

#### Scenario: Edit own bookmark from its details page
- **WHEN** a signed-in user views the details page of their own bookmark and
  presses `e` outside an editable control
- **THEN** the bookmark's edit form opens

#### Scenario: No edit for entries the user cannot edit
- **WHEN** a user presses `e` on the details page of an entry for which no
  Edit action is offered, such as another user's public note, a shared-link
  view, or any entry while signed out
- **THEN** nothing happens

#### Scenario: Typing is not intercepted
- **WHEN** a user types `e` in a search box, filter, comment or other
  editable control on a details page
- **THEN** the character is entered as text and the edit form does not open

#### Scenario: Modifiers and dialogs are ignored
- **WHEN** a user presses `Ctrl+E`, `Cmd+E` or `Alt+E`, or presses `e` while
  a dialog is open over the details page
- **THEN** the edit form does not open
- **AND** any browser or dialog behavior for that key is unchanged

#### Scenario: Lists are not affected
- **WHEN** a user presses `e` on a page listing several entries
- **THEN** no edit form opens

### Requirement: Save the note or bookmark form with Ctrl/Cmd+Enter

The web UI SHALL submit the note form and the bookmark form when the user
presses `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (macOS) while focus is
anywhere in the form, with the same result as pressing the form's Save
button, including its validation. When the Save button is disabled, the
combination SHALL do nothing.

#### Scenario: Save an edited note from the content field
- **WHEN** a user edits a note's content and presses `Ctrl+Enter` or
  `Cmd+Enter` with the cursor in the content field
- **THEN** the note is saved exactly as with the Save button

#### Scenario: Save a bookmark from any field
- **WHEN** a user presses `Ctrl+Enter` or `Cmd+Enter` with focus in any field
  of a valid bookmark form
- **THEN** the bookmark is saved exactly as with the Save button

#### Scenario: Invalid form is not saved
- **WHEN** a user presses `Ctrl+Enter` or `Cmd+Enter` while the form is
  invalid and its Save button is disabled
- **THEN** nothing is saved
- **AND** no line break is inserted in the focused field

### Requirement: Leave the edit form with Escape

The web UI SHALL leave the note and bookmark edit forms when the user
presses `Escape`, with the same result as the form's Cancel action,
including its protection against losing unsaved changes. When an
autocomplete panel, menu or dialog is open, `Escape` SHALL only close it.
The shortcut SHALL apply to editing an existing entry only, not to creating,
cloning or copying one.

#### Scenario: Leave an unchanged edit form
- **WHEN** a user opened the edit form from a details page, made no changes,
  and presses `Escape`
- **THEN** the user returns to the details page

#### Scenario: Unsaved changes are protected
- **WHEN** a user has changed the edit form and presses `Escape`
- **THEN** the same unsaved-changes protection as for Cancel applies
- **AND** the changes are not lost without the user's confirmation

#### Scenario: Escape closes an open panel first
- **WHEN** the tag suggestions or another autocomplete panel, menu or dialog
  is open in the edit form and the user presses `Escape`
- **THEN** only that panel, menu or dialog closes
- **AND** the edit form stays open

#### Scenario: Create form is not left
- **WHEN** a user presses `Escape` in the form for a new, cloned or copied
  entry
- **THEN** the form stays open
