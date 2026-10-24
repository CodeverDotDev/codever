## Purpose

Recover unfinished bookmark and Markdown-note authoring on the same browser,
while respecting storage consent and keeping draft content separate from saved
resources and from drafts belonging to other entries.

## ADDED Requirements

### Requirement: Explicit consent and owner isolation

Draft persistence and restoration SHALL require an authenticated user and the
existing personal-data local-storage opt-in. Drafts SHALL be isolated by user.
The settings and eligible editors SHALL explain that drafts are browser-local,
not published or synced, and removed on logout or consent withdrawal.

#### Scenario: Default storage preference
- **WHEN** a user without storage consent authors an eligible entry
- **THEN** no draft is read into the form or persisted
- **AND** the editor explains that local draft recovery is disabled

#### Scenario: Different signed-in user
- **WHEN** a different user opens an eligible editor in the same browser
- **THEN** another user's drafts are neither offered nor modified

### Requirement: Separate create and per-entry edit drafts

The system SHALL retain one create draft per user and resource type and one
edit draft per user, resource type, and saved entry ID. Multiple different
entries SHALL support concurrent unsaved drafts, subject to browser capacity.
These slots SHALL be independent, with no implicit history of prior versions.

#### Scenario: Several entries have unsaved work
- **WHEN** a user drafts a new note and edits two saved notes and a bookmark
- **THEN** all four drafts coexist
- **AND** returning to each editor offers only its corresponding draft

#### Scenario: Saving one edit
- **WHEN** the user successfully saves one edited entry
- **THEN** its handled draft is cleared without clearing the other edit drafts
  or either create draft

### Requirement: Eligible flows and excluded-flow isolation

Draft management SHALL cover creates that start without supplied content or
capture context, and edits of the authenticated user's existing bookmarks and
Markdown notes. Extension/bookmarklet-prefilled creates, clone, copy-to-mine,
notebook authoring, and edits of another owner's entry SHALL be excluded.
Exclusion SHALL remain in effect even if a prefilled form is later emptied.

#### Scenario: Excluded capture flow with an existing create draft
- **WHEN** a user opens, changes, saves, or abandons a prefilled create form
- **THEN** the previous create draft is not restored, overwritten, or deleted
- **AND** it is still offered on a later blank-start create visit

#### Scenario: Clone, copy, or other-owner edit
- **WHEN** a user opens, saves, or abandons one of these excluded flows
- **THEN** neither create nor edit drafts are managed by that flow

#### Scenario: Switching to notebook mode
- **WHEN** an eligible Markdown editor accepts a notebook upload
- **THEN** draft persistence stops before notebook-derived content is captured
- **AND** any existing Markdown draft remains unchanged, even on notebook save
- **AND** the editor explains that notebook changes are not draft-protected

### Requirement: Autosave incomplete authoring state

Eligible changed forms SHALL autosave after 1,000 milliseconds without another
change, while the page is running normally and storage is available. Persistence
SHALL not require a valid resource submission. Drafts SHALL preserve entered
text, tags, visibility, ordered copyable fields including incomplete rows, and
applicable save options. Accepted generated content SHALL also be captured.
Untouched initial forms SHALL not create drafts.

#### Scenario: Incomplete note
- **WHEN** a user types content without a title or required tags and pauses
  for 1,000 milliseconds
- **THEN** the incomplete content is stored as a local draft
- **AND** no resource is created or published

#### Scenario: Complete authoring state
- **WHEN** a draft with tags, incomplete copyable fields, visibility, and
  selected save options is restored
- **THEN** those values and their ordering are retained for further editing
- **AND** normal validation still blocks an invalid resource save

#### Scenario: Accepted generated changes
- **WHEN** a user accepts AI refinement or bookmark metadata changes
- **THEN** the resulting eligible form state is included in autosave even if
  no subsequent keyboard input occurs

#### Scenario: Intentional empty edit
- **WHEN** a user clears a previously populated editable field
- **THEN** the draft retains that deletion rather than treating it as no work

### Requirement: Explicit restore and discard

An existing draft SHALL be offered with its save time and explicit restore or
discard actions. Pending decisions SHALL not permit autosave to overwrite that
draft. Restoring SHALL not submit the entry. Replacing newly entered content
with a draft SHALL require explicit confirmation.

#### Scenario: Unresolved draft offer
- **WHEN** a user leaves a restore offer unresolved and types into the form
- **THEN** the stored draft remains unchanged
- **AND** the editor indicates that new content is not yet draft-protected

#### Scenario: Restore a draft
- **WHEN** the user chooses restore and confirms any replacement of new input
- **THEN** the form contains the draft values and normal validation applies
- **AND** no create or update request is made by restoration

#### Scenario: Discard a stored draft
- **WHEN** the user explicitly discards the offered draft
- **THEN** only that draft is removed
- **AND** current form input remains available and can begin a new draft

### Requirement: Fresh-server comparison for edit restoration

Before offering restoration of an edit draft, the system SHALL load
the current saved entry and compare it with the baseline captured when drafting
started. A changed or unverifiable baseline SHALL prevent applying the draft
directly. Conflicting content SHALL remain available for review and copying,
or explicit discard, without silently replacing current server content.

#### Scenario: Saved entry unchanged
- **WHEN** the freshly loaded entry matches an edit draft's baseline
- **THEN** the user can explicitly restore that draft into the editor

#### Scenario: Saved entry changed elsewhere
- **WHEN** the current saved content differs from the draft's baseline
- **THEN** the editor presents a conflict warning and current saved content
- **AND** the old draft remains available for review/copying or discard
- **AND** automatic draft replacement and direct restore are suspended

#### Scenario: Entry cannot be loaded
- **WHEN** the fresh entry request fails or the entry is no longer available
- **THEN** the normal loading error remains visible and the draft is not applied
- **AND** the draft is retained rather than converted into a new resource

### Requirement: Pending changes and successful-save cleanup

The system SHALL attempt to flush eligible pending changes on normal editor
exit, page hiding, and reload lifecycle events. Confirmed successful resource
saves SHALL clear only the corresponding handled draft and disable pending
writes from that editor session. Failed saves SHALL retain recoverable work.
An unresolved restore offer or conflicting draft SHALL not be cleared merely
because the user saves different content from the current form.

#### Scenario: Leaving before debounce completes
- **WHEN** the user types and navigates away before 1,000 milliseconds elapse
- **THEN** the latest eligible state is flushed before editor teardown

#### Scenario: Reload with lifecycle delivery
- **WHEN** a reload delivers the page lifecycle event with pending changes
- **THEN** the latest eligible state is written before the document unloads

#### Scenario: Successful save followed by teardown
- **WHEN** a resource save succeeds and navigation destroys the editor
- **THEN** neither a pending timer nor teardown recreates the cleared draft
- **AND** failures in later history or collection updates do not recreate it

#### Scenario: Failed resource save
- **WHEN** the resource create or update fails
- **THEN** the draft remains recoverable, including on an error-driven exit

### Requirement: Cache changes preserve drafts but privacy cleanup removes them

Application cache-version invalidation SHALL preserve draft records without
preserving unrelated cached personal data. Logout and storage-consent withdrawal
SHALL clear the user's create and edit drafts and stop active draft writers.
Preserved drafts SHALL not be offered until current consent is established.

#### Scenario: Application cache version changes
- **WHEN** application startup invalidates cached data for a new cache version
- **THEN** existing drafts remain available after authentication and consent
  have been established again

#### Scenario: Logout or consent withdrawal with pending writes
- **WHEN** the user logs out or disables personal-data storage
- **THEN** their create and edit drafts are removed
- **AND** delayed writes, other active tabs, and editor teardown do not
  recreate drafts after processing the cleanup signal

### Requirement: Visible storage failures and format compatibility

Unavailable or full browser storage, malformed records, and unsupported draft
versions SHALL produce an actionable recovery-unavailable message rather than a
false saved indication or editor crash. Unsaved input SHALL remain editable.
Draft content SHALL not be included in diagnostic logging. Storage pressure
SHALL not silently evict unrelated drafts.

#### Scenario: Storage write fails
- **WHEN** the browser rejects a draft write
- **THEN** the editor shows that the latest changes are not locally saved
- **AND** existing stored drafts and current input remain intact

#### Scenario: Invalid or unsupported saved record
- **WHEN** an editor encounters an unreadable or unsupported draft
- **THEN** it offers an explicit discard action without applying the record
- **AND** it does not silently overwrite that record with a new draft

### Requirement: Detected same-slot changes require a decision

When another tab is detected changing or deleting the same draft slot, the
editor SHALL pause automatic writes and warn the user before replacing that
slot. It SHALL retain current in-memory input and offer explicit recovery or
replacement. Different entry slots SHALL not block one another.

#### Scenario: Another tab changes the same entry draft
- **WHEN** a tab detects that another tab saved a different draft revision
- **THEN** it stops automatic writes to that slot and reports the conflict
- **AND** it does not silently replace either its current form or the detected
  stored revision

#### Scenario: Another tab clears the handled draft
- **WHEN** a tab detects the slot was cleared after saving or discarding
- **THEN** it does not silently recreate that slot from stale input
