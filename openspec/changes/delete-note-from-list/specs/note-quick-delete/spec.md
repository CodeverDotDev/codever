## Purpose

Lets users delete their own notes directly from note cards in lists and on
the details page, with a confirmation step, without opening the editor.

## ADDED Requirements

### Requirement: Delete action on owned note cards

The system SHALL show a Delete action in the footer of every note card whose
note belongs to the logged-in user, including search results, the My Notes
dashboard list, and the note details page. The action SHALL appear alongside
the existing Edit and Clone actions. The system SHALL NOT show the Delete
action to anonymous users, on notes owned by other users, or in the shared
(share-link) note view.

#### Scenario: Owner sees Delete in search results

- **WHEN** a logged-in user views search results containing one of their own
  notes
- **THEN** that note card shows a Delete action next to Edit and Clone

#### Scenario: Owner sees Delete on the details page

- **WHEN** a logged-in user opens the details page of their own note
- **THEN** the note card shows a Delete action

#### Scenario: Other user's public note has no Delete

- **WHEN** a logged-in user views a public note owned by another user
- **THEN** no Delete action is shown on that note card

#### Scenario: Anonymous user sees no Delete

- **WHEN** an anonymous visitor views a public note
- **THEN** no Delete action is shown

#### Scenario: Shared view has no Delete

- **WHEN** anyone opens a note through a share link
- **THEN** no Delete action is shown, even for the note's owner

### Requirement: Deletion requires confirmation

Activating the Delete action SHALL open a confirmation dialog that names the
note. The note SHALL be deleted only when the user confirms. Cancelling SHALL
leave the note and the current view unchanged.

#### Scenario: User cancels deletion

- **WHEN** the owner clicks Delete on a note card and cancels the dialog
- **THEN** no delete request is sent
- **AND** the note card remains visible and unchanged

#### Scenario: User confirms deletion

- **WHEN** the owner clicks Delete on a note card and confirms the dialog
- **THEN** a delete request for that note is sent for the owner
- **AND** on success a notification states the note was deleted

### Requirement: Deleted note disappears from lists in place

After a successful confirmed delete from a list (search results or the My
Notes dashboard), the system SHALL remove that note's card from the list
without reloading the page, keeping the current query, filter text, and
remaining results.

#### Scenario: Delete from search results

- **WHEN** the owner confirms deleting a note from search results and the
  delete succeeds
- **THEN** that note's card is no longer displayed
- **AND** the page is not reloaded
- **AND** the other results, search query, and filter text stay as they were

#### Scenario: Delete from the My Notes dashboard

- **WHEN** the owner confirms deleting a note from the My Notes dashboard list
  and the delete succeeds
- **THEN** that note's card is no longer displayed without a page reload

### Requirement: Delete from the details page leaves the page

After a successful confirmed delete from the note details page, the system
SHALL navigate the user to the home page.

#### Scenario: Delete from details page

- **WHEN** the owner confirms deleting a note on its details page and the
  delete succeeds
- **THEN** the user is navigated to the home page
- **AND** a notification states the note was deleted

### Requirement: Failed deletion keeps the note

If the delete request fails, the system SHALL show an error notification and
SHALL keep the note card displayed.

#### Scenario: Server error on delete

- **WHEN** the owner confirms deleting a note and the delete request fails
- **THEN** an error notification is shown
- **AND** the note card remains visible

### Requirement: Deleted note leaves no stale personal references

After a successful delete, the deleted note SHALL no longer appear in the
user's pinned entries, history, or favorites within the current session,
without requiring a page reload.

#### Scenario: Pinned note deleted from a list

- **WHEN** the owner deletes a note that is pinned and a favorite
- **THEN** the note no longer appears in the pinned entries or favorites
  views during the same session
