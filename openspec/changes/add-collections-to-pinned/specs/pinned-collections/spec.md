## Purpose

Lets users pin collections and reach them from the quick-access pinned list and the Ctrl+P popup,
mixed in with pinned bookmarks and notes, and browse a pinned collection's contents in a filterable dialog.

## ADDED Requirements

### Requirement: Pin and unpin a collection

The system SHALL let an authenticated user pin and unpin their own collection from both the collections list and the collection detail view.

#### Scenario: Pin from the collections list

- **WHEN** an authenticated user activates the pin action on one of their collections in the My Collections list
- **THEN** the collection SHALL be added to the user's pinned entries

#### Scenario: Unpin from the collections list

- **WHEN** an authenticated user activates the unpin action on a collection that is currently pinned
- **THEN** the collection SHALL be removed from the user's pinned entries

#### Scenario: Pin from the collection detail view

- **WHEN** an authenticated user activates the pin action on the collection detail view
- **THEN** the collection SHALL be added to the user's pinned entries

#### Scenario: Unpin from the collection detail view

- **WHEN** an authenticated user activates the unpin action on the collection detail view for a collection that is currently pinned
- **THEN** the collection SHALL be removed from the user's pinned entries

### Requirement: Pinned collections appear mixed with pinned bookmarks and notes

The system SHALL show pinned collections together with pinned bookmarks and notes in a single ordered quick-access list,
preserving the user's pinned order.

#### Scenario: Quick-access list shows a mixed pinned list

- **WHEN** an authenticated user has pinned bookmarks, notes, and collections
- **THEN** the quick-access pinned list SHALL display all of them in one list in the user's pinned order

#### Scenario: Ctrl+P popup shows a mixed pinned list

- **WHEN** an authenticated user opens the Ctrl+P quick-access popup and has pinned bookmarks, notes, and collections
- **THEN** the popup SHALL display all of them in one list in the user's pinned order

### Requirement: Navigate to a pinned collection

The system SHALL navigate to the collection detail page when the user activates a pinned collection entry.

#### Scenario: Open pinned collection from quick access

- **WHEN** an authenticated user clicks a pinned collection in the quick-access list or the Ctrl+P popup
- **THEN** the SPA SHALL navigate to that collection's detail page at `/my-collections/:id`

### Requirement: Browse a pinned collection's contents in a dialog

The system SHALL let the user open a pinned collection's bookmarks and notes in a dialog with a filter.

#### Scenario: Open the collection contents dialog

- **WHEN** an authenticated user activates the dialog action on a pinned collection
- **THEN** a dialog SHALL open showing the collection's bookmarks and notes

#### Scenario: Filter the collection contents

- **WHEN** the user enters text in the collection contents dialog filter
- **THEN** the dialog SHALL show only the bookmarks and notes whose name, title, or tags match the filter text

### Requirement: Pinned entries distinguish resource type

The pinned user-data field SHALL store each pinned entry with an explicit resource type so bookmarks, notes, and collections can be resolved without ambiguity.

#### Scenario: Pinned entries carry a type

- **WHEN** the system reads a user's pinned entries
- **THEN** each entry SHALL include a type that is one of `bookmark`, `note`, or `collection`, together with the resource id

### Requirement: Pinned endpoints accept and return collections

The personal pinned endpoints SHALL accept typed pinned entries and SHALL return collections alongside bookmarks and notes in the user's pinned order.

#### Scenario: Update pinned entries with typed input

- **WHEN** an authenticated user's client sends typed pinned entries to update the user's pinned list
- **THEN** the system SHALL store the entries and respond with success

#### Scenario: Invalid pinned entry type is rejected

- **WHEN** a client sends a pinned entry whose type is not `bookmark`, `note`, or `collection`
- **THEN** the system SHALL respond with HTTP 400

#### Scenario: Get pinned entries returns mixed resources

- **WHEN** an authenticated user requests their pinned resources
- **THEN** the response SHALL include bookmarks, notes, and collections in the user's pinned order, with collections returned without their full contents
