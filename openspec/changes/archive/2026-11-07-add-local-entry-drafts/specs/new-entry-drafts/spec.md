## Purpose

Recover unfinished new bookmarks and Markdown notes in the same browser, even
after the tab or browser was closed, while keeping draft content separate
from saved resources.

## ADDED Requirements

### Requirement: Browser-local drafts and owner isolation

Draft persistence and restoration SHALL require an authenticated user and
SHALL be isolated by user. Drafts SHALL be stored in the browser's local
storage: they SHALL survive reloads, in-app navigation, and closing the tab or
browser, and SHALL be available to every tab of the same browser profile.
Drafts SHALL not depend on the personal-data local-storage setting and SHALL
be kept when the application clears its cached data. Eligible editors SHALL
explain that drafts are kept in this browser for 7 days, are removed on
logout, and are not published or synced.

#### Scenario: Draft survives closing the browser
- **WHEN** a user closes the tab or browser after a create draft was stored
  and later opens a blank-start create editor of that type
- **THEN** the draft is listed for restoration

#### Scenario: Default storage preference
- **WHEN** a user without the personal-data storage opt-in pauses in a changed
  blank-start create form
- **THEN** the draft is stored

#### Scenario: Application cache cleared
- **WHEN** the application clears its cached data after a version change
- **THEN** stored drafts are kept

#### Scenario: Different signed-in user
- **WHEN** a different user signs in in the same browser
- **THEN** the previous user's drafts are neither listed nor modified

### Requirement: Multiple create drafts per resource type

Each blank-start create visit SHALL write its own draft, so drafts from
different visits or tabs do not overwrite each other. The system SHALL retain
at most 10 readable create drafts per user and resource type (bookmark,
note); saving another SHALL remove the oldest beyond that limit. Drafts not
updated for 7 days SHALL expire and be removed when encountered and at
application start. Bookmark and note drafts SHALL be independent. Edits of
saved entries SHALL never be stored as drafts.

#### Scenario: Two tabs create the same type
- **WHEN** a user starts a new note in two tabs without saving either
- **THEN** both drafts are retained and listed separately

#### Scenario: Bookmark and note drafts coexist
- **WHEN** a user starts a new bookmark and a new note without saving either
- **THEN** both drafts are retained
- **AND** each create editor lists only its own resource type's drafts

#### Scenario: Draft limit reached
- **WHEN** a user already has 10 note drafts and a new note visit is drafted
- **THEN** the oldest note draft is removed and 10 remain

#### Scenario: Expired draft
- **WHEN** a draft has not been updated for 7 days
- **THEN** it is removed and no longer listed

#### Scenario: Saving one new entry
- **WHEN** the user successfully saves a new note written to or restored from
  a draft
- **THEN** only that draft is removed; other note and bookmark drafts remain

#### Scenario: Editing a saved entry
- **WHEN** a user changes, saves, or abandons an edit of a saved entry
- **THEN** no draft is created, listed, or removed by that edit

### Requirement: Eligible flows and excluded-flow isolation

Draft management SHALL cover only bookmark and Markdown-note creates that start
without supplied content or capture context. Extension/bookmarklet-prefilled
creates, clone, copy-to-mine, notebook authoring, and edits SHALL be excluded.
Exclusion SHALL remain in effect even if a prefilled form is later emptied.
Creates opened from the in-app "+" menu (`initiator=browser`) SHALL count as
blank-start creates.

#### Scenario: Create opened from the in-app menu
- **WHEN** a user opens a create form from the app's "+" menu
- **THEN** the create is draft-eligible like a create without query parameters

#### Scenario: Excluded capture flow with existing create drafts
- **WHEN** a user opens, changes, saves, or abandons a prefilled create form
  while create drafts are stored
- **THEN** no create draft is listed, restored, overwritten, or deleted
- **AND** the drafts are still listed on a later blank-start create visit

#### Scenario: Clone or copy-to-mine
- **WHEN** a user opens, saves, or abandons a clone or copy-to-mine flow
- **THEN** no create draft is restored, overwritten, or deleted by that flow

#### Scenario: Switching to notebook mode
- **WHEN** an eligible Markdown create editor accepts a notebook upload
- **THEN** draft persistence stops before notebook-derived content is captured
- **AND** any existing Markdown draft remains unchanged, even on notebook save
- **AND** the editor explains that notebook changes are not draft-protected

### Requirement: Autosave incomplete authoring state

Eligible changed create forms SHALL autosave after 1,000 milliseconds without
another change, while the page is running normally and storage is available.
Persistence SHALL not require a valid resource submission. Drafts SHALL
preserve entered text, tags, visibility, ordered copyable fields including
incomplete rows, and applicable save options. Accepted generated content SHALL
also be captured. Untouched initial forms SHALL not create drafts.

#### Scenario: Incomplete note
- **WHEN** a user types content without a title or required tags and pauses
  for 1,000 milliseconds
- **THEN** the incomplete content is stored as a draft
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

#### Scenario: Form returned to empty
- **WHEN** a user clears every change in a blank-start create form
- **THEN** that visit's draft is removed

### Requirement: Draft list with restore and delete

A blank-start create editor SHALL list the user's stored drafts of its
resource type, newest first, each with its title (bookmarks fall back to the
URL; otherwise marked untitled), its save time, and explicit restore and
delete actions. The visit's own draft SHALL not be listed in its own editor.
Listing drafts SHALL not block autosave of current input. Restoring SHALL not
submit the entry and SHALL continue that draft instead of creating another.
Replacing changed current input with a draft SHALL require explicit
confirmation; the replaced input SHALL remain listed as a draft when it was
stored. Unreadable drafts SHALL be listed with a delete action only.

#### Scenario: Drafts listed on a blank create
- **WHEN** a user opens a blank-start create editor with stored drafts
- **THEN** the drafts are listed newest first with title and save time
- **AND** typing into the form autosaves a separate draft

#### Scenario: Restore a draft
- **WHEN** the user chooses restore and confirms any replacement of changed
  input
- **THEN** the form contains the draft values and normal validation applies
- **AND** further changes update that draft and no create request is made

#### Scenario: Draft removed elsewhere
- **WHEN** the user restores a draft that another tab has saved or deleted
- **THEN** the editor reports that the draft is no longer available
- **AND** the form is unchanged

#### Scenario: Delete a stored draft
- **WHEN** the user deletes a listed draft
- **THEN** only that draft is removed
- **AND** current form input remains available

### Requirement: Cancel discards a new entry

Cancel on an active draft create with changes SHALL ask for confirmation
before leaving. Confirming SHALL remove only the draft that visit wrote or
restored, SHALL disable its pending writes, and SHALL leave without the
unsaved-changes warning. Declining SHALL keep the user in the editor with
input and draft intact. Cancel SHALL leave without confirmation when the form
is unchanged, or when a restored draft is unchanged since restoring, and the
restored draft SHALL then remain stored. Cancel on edits and other
non-drafted flows SHALL keep the unsaved-changes warning behavior.

#### Scenario: Confirm discarding a new entry
- **WHEN** the user changes a blank-start create, clicks Cancel, and confirms
  Discard
- **THEN** the visit's draft is removed and the editor is left
- **AND** other stored drafts are not changed and no warning is shown

#### Scenario: Keep editing
- **WHEN** the user clicks Cancel on a changed create and chooses Keep
  editing or dismisses the dialog
- **THEN** the editor stays open and the input and draft are kept

#### Scenario: Cancel on an unchanged form
- **WHEN** the user clicks Cancel on an untouched blank-start create
- **THEN** the editor is left without a dialog

#### Scenario: Cancel after restoring without changes
- **WHEN** the user restores a draft and clicks Cancel without changing it
- **THEN** the editor is left without a dialog and the draft remains stored

#### Scenario: Cancel on a changed edit
- **WHEN** the user clicks Cancel on a changed edit
- **THEN** no discard dialog is shown and the unsaved-changes warning applies

### Requirement: Pending changes and successful-save cleanup

The system SHALL attempt to flush eligible pending create changes on normal
editor exit, page hiding, reload, and tab close lifecycle events. Confirmed
successful resource saves SHALL remove only the draft that editor visit wrote
or restored and SHALL disable pending writes from that visit. Failed saves
SHALL retain recoverable work.

#### Scenario: Leaving before debounce completes
- **WHEN** the user types and navigates away before 1,000 milliseconds elapse
- **THEN** the latest eligible state is flushed before editor teardown

#### Scenario: Closing with pending changes
- **WHEN** a reload or tab close delivers the page lifecycle event with
  pending changes
- **THEN** the latest eligible state is written before the document unloads

#### Scenario: Successful save followed by teardown
- **WHEN** a resource save succeeds and navigation destroys the editor
- **THEN** neither a pending timer nor teardown recreates the removed draft
- **AND** failures in later history or collection updates do not recreate it

#### Scenario: Failed resource save
- **WHEN** the resource create fails
- **THEN** the draft remains recoverable, including on an error-driven exit

### Requirement: Logout removes drafts

Logout SHALL stop active draft writers and remove all of the departing user's
create drafts from this browser. Other open tabs SHALL stop writing that
user's drafts when they process the logout and SHALL never list them to a
different user.

#### Scenario: Logout with pending writes
- **WHEN** the user logs out
- **THEN** their create drafts are removed from this browser
- **AND** delayed writes and editor teardown do not recreate them

#### Scenario: Other tab after logout
- **WHEN** another open tab processes the logout
- **THEN** it does not recreate or list drafts of the departing user

### Requirement: Visible storage failures and format compatibility

Unavailable or full browser storage, malformed records, and unsupported draft
versions SHALL produce an actionable message rather than a false saved
indication or editor crash. Unsaved input SHALL remain editable. Draft content
SHALL not be included in diagnostic logging.

#### Scenario: Storage write fails
- **WHEN** the browser rejects a draft write
- **THEN** the editor shows that the latest changes are not saved as a draft
- **AND** existing stored drafts and current input remain intact

#### Scenario: Storage unavailable
- **WHEN** browser storage cannot be accessed
- **THEN** the editor shows that drafts are unavailable and the leave warning
  protects changes

#### Scenario: Invalid or unsupported saved record
- **WHEN** an editor encounters an unreadable or unsupported draft
- **THEN** it lists the draft with a delete action without applying it
- **AND** it never overwrites, expires, or trims that record automatically
