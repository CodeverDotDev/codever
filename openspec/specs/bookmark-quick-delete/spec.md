# bookmark-quick-delete Specification

## Purpose

Lets users and administrators remove bookmarks directly from the lists where
the Delete action is available, without interrupting the current view.

## Requirements

### Requirement: Confirm bookmark deletion
The system SHALL require confirmation before deleting a bookmark, and SHALL
preserve the existing rule that only the bookmark owner or an administrator
can use the Delete action.

#### Scenario: Confirm deletion
- **WHEN** an authorized user selects Delete and confirms the dialog
- **THEN** the system proceeds with deletion

#### Scenario: Cancel deletion
- **WHEN** an authorized user selects Delete and cancels the dialog
- **THEN** the bookmark remains unchanged

#### Scenario: Unauthorized user views a bookmark
- **WHEN** a user who is neither the bookmark owner nor an administrator
  views a bookmark
- **THEN** the Delete action is not available

### Requirement: Remove deleted bookmarks from lists in place
The system SHALL remove a successfully deleted bookmark from every bookmark
list where its Delete action is available, without reloading the page or
resetting the current search, filter, or scroll position.

#### Scenario: Delete from search results
- **WHEN** a user confirms deletion of a bookmark in search results
- **THEN** the bookmark disappears from the results without a page reload
- **AND** the current search remains unchanged

#### Scenario: Delete from another bookmark list
- **WHEN** a user confirms deletion of a bookmark in a bookmark list
- **THEN** the bookmark disappears from that list without a page reload
- **AND** the current list view remains unchanged

#### Scenario: Last matching search result is deleted
- **WHEN** deletion removes the last bookmark matching the current search
- **THEN** the system displays an empty-results message

#### Scenario: Delete fails
- **WHEN** deletion of a bookmark fails
- **THEN** the bookmark remains visible in the list
- **AND** the system reports the failure to the user

### Requirement: Navigate away after deleting a bookmark detail
The system SHALL navigate to the home page after a bookmark is successfully
deleted from its details page.

#### Scenario: Delete bookmark from details
- **WHEN** an authorized user confirms deletion from a bookmark details page
- **THEN** the bookmark is deleted and the user is navigated home

#### Scenario: Detail deletion fails
- **WHEN** deletion from a bookmark details page fails
- **THEN** the user remains on the details page and the system reports the
  failure

### Requirement: Update bookmark views after deletion
The system SHALL update affected client-side bookmark views after a
successful deletion so that deleted bookmarks do not remain in later
quick-access or dashboard lists.

#### Scenario: Deleted bookmark is in client-side collections
- **WHEN** a bookmark is successfully deleted and exists in a client-side
  bookmark collection
- **THEN** the deleted bookmark is removed from that collection
