## Purpose

Give users a private, account-level way to mark bookmarks and notes they value
while keeping favorites separate from public reactions and search relevance.

## ADDED Requirements

### Requirement: Favorite accessible bookmarks and notes

The system SHALL let an authenticated user mark a bookmark or note as a
personal favorite when the resource is public or belongs to that user. The
favorite state SHALL be private to that user and SHALL persist with their
account. The system SHALL prevent users from accessing private bookmarks or
notes owned by another user. Favorite controls and mutations SHALL respect the
same resource access boundary.

#### Scenario: Favorite a public bookmark or note

- **WHEN** an authenticated user marks a public bookmark or note as a favorite
- **THEN** that resource is marked as a favorite for that user
- **AND** the state is available when that user signs in on another device

#### Scenario: Favorite an owned private resource

- **WHEN** an authenticated user marks their own private bookmark or note as a
  favorite
- **THEN** that resource is marked as a favorite for that user
- **AND** no other user can see that favorite state

#### Scenario: Another user's private resource remains inaccessible

- **WHEN** a user requests or attempts to favorite a private bookmark or note
  owned by someone else
- **THEN** the system does not return the resource's content
- **AND** the favorite API returns `NotFoundError` with HTTP 404
- **AND** the system does not change the user's favorite state

#### Scenario: Guest selects the favorite control

- **WHEN** a guest selects the favorite control on a bookmark or note
- **THEN** the system prompts the guest to sign in
- **AND** it does not change any favorite state

### Requirement: Update favorites through an authenticated personal API

The personal API SHALL accept a favorite mutation for one bookmark or note,
including its resource type, ID, and desired favorite state. It SHALL only
change the authenticated user's favorite state and SHALL return the resulting
state. The API SHALL reject malformed requests with `ValidationError` and HTTP
400. It SHALL return `NotFoundError` and HTTP 404 when the resource does not
exist or is private and belongs to another user. A user-ID authorization
failure SHALL return `UseridValidationError` and HTTP 401.

#### Scenario: Add or remove a favorite through the personal API

- **WHEN** an authenticated user submits a valid favorite mutation for an
  accessible bookmark or note
- **THEN** only that user's favorite state for that resource changes
- **AND** the response identifies the resource type, ID, and resulting state

#### Scenario: Reject malformed favorite mutations

- **WHEN** a favorite mutation omits or malforms its resource type, resource ID,
  or desired state
- **THEN** the API returns `ValidationError` with HTTP 400
- **AND** it does not change favorite state

#### Scenario: Reject an inaccessible or missing resource

- **WHEN** a favorite mutation targets a missing resource or another user's
  private resource
- **THEN** the API returns `NotFoundError` with HTTP 404
- **AND** it does not change favorite state

#### Scenario: Reject updates to another user's profile

- **WHEN** the authenticated user's identity does not match the requested user
  ID
- **THEN** the API returns `UseridValidationError` with HTTP 401
- **AND** it does not change any favorite state

### Requirement: Show and toggle favorite state

The UI SHALL show a favorite control on bookmark and note cards, search results,
and detail views. An inactive favorite SHALL appear as a neutral outlined star;
an active favorite SHALL appear as a filled amber star. Selecting the control
SHALL add or remove the resource from the signed-in user's favorites and update
the displayed state.

#### Scenario: Mark a resource from a card or search result

- **WHEN** a signed-in user selects the inactive star on a bookmark or note
- **THEN** the resource becomes a favorite
- **AND** the star changes to its filled amber state

#### Scenario: Remove a favorite from a detail view

- **WHEN** a signed-in user selects the active star on a favorited resource
- **THEN** the resource is removed from that user's favorites
- **AND** the star changes to its neutral outlined state

#### Scenario: Favorite does not change a public Like

- **WHEN** a user favorites a public bookmark
- **THEN** its public Like count and other users' favorite states remain
  unchanged

### Requirement: Preserve search ranking

The system SHALL NOT alter search result ordering or relevance because a
resource is a personal favorite.

#### Scenario: Search returns a favorite and a non-favorite

- **WHEN** a user searches for bookmarks or notes that include both favorite
  and non-favorite matches
- **THEN** results retain the existing search ordering
- **AND** favorite status is shown without changing that ordering

### Requirement: Remove favorite references when resources are deleted

When a bookmark or note is deleted, the system SHALL remove its favorite
reference from every user's account, regardless of who deleted it or whether
the resource was public. This SHALL apply to every supported deletion path,
including administrative and bulk deletion.

#### Scenario: Delete a public bookmark favorited by multiple users

- **WHEN** a public bookmark is deleted after multiple users have favorited it
- **THEN** the bookmark ID is removed from every user's favorite state

#### Scenario: Delete a note favorited by multiple users

- **WHEN** a note is deleted after multiple users have favorited it
- **THEN** the note ID is removed from every user's favorite state

#### Scenario: Delete resources through an administrative or bulk path

- **WHEN** one or more bookmarks are deleted through an administrative or bulk
  operation
- **THEN** every deleted bookmark's favorite reference is removed from all
  users' accounts
