# unsaved-changes-warning Specification

## Purpose

Warn before a user leaves a bookmark or note authoring form with changes that
are neither saved nor protected by a stored new-entry draft (see the
`new-entry-drafts` capability).

## Requirements

### Requirement: Warn before discarding unprotected changes

When the user leaves any bookmark or note authoring form with changes not
stored in a create draft, the system SHALL ask for confirmation. Before
deciding, the system SHALL attempt to store pending eligible create changes
as a draft. Reload, tab close, and popup close SHALL request the browser's
confirmation only when unprotected changes remain. Changes SHALL be measured
against the state shown once the editor finished loading its initial content.
Leaving without saving SHALL not modify any stored draft.

#### Scenario: Leaving a changed edit inside the application
- **WHEN** a user changes a saved entry and navigates elsewhere in the app
- **THEN** a confirmation offers "Stay" and "Leave without saving"
- **AND** choosing "Stay" keeps the user on the form with changes intact
- **AND** choosing "Leave without saving" navigates without saving or storing

#### Scenario: Reloading or closing with unprotected changes
- **WHEN** a user reloads, closes the tab, or closes the capture popup with an
  edit, capture, clone, copy, or notebook form that has changes
- **THEN** the browser's leave confirmation is requested

#### Scenario: Reloading or closing a drafted create
- **WHEN** a user reloads or closes the tab while a blank-start create's
  changes can be stored as its draft
- **THEN** the changes are stored and no confirmation is requested

#### Scenario: Untouched form
- **WHEN** a user opens an edit, clone, copy-to-mine, or prefilled capture and
  leaves without changing it
- **THEN** no confirmation is shown, including for content loaded
  automatically as part of the initial capture

#### Scenario: Changed prefilled capture
- **WHEN** a user adds text or tags to an extension-prefilled form and leaves
- **THEN** a confirmation is shown

#### Scenario: Blank create protected by a stored draft
- **WHEN** a blank-start create's latest changes are stored as its draft and
  the user navigates elsewhere in the application
- **THEN** the user can leave without a confirmation

#### Scenario: Blank create without a stored draft
- **WHEN** the draft write failed, storage is unavailable, or notebook mode is
  active, and the user leaves with changes
- **THEN** a confirmation is shown

### Requirement: Warning bypass on save and logout

Confirmed successful resource saves and explicit logout SHALL not trigger the
unsaved-changes confirmation. A failed save SHALL keep changes protected.

#### Scenario: Successful save
- **WHEN** a create, edit, clone, copy, or capture save succeeds
- **THEN** the following navigation or popup close happens without a
  confirmation

#### Scenario: Failed save followed by navigation
- **WHEN** a save fails and the application or user then navigates away
- **THEN** the confirmation is shown, so the user can stay with changes intact

#### Scenario: Explicit logout
- **WHEN** a user explicitly logs out from an authoring form with changes
- **THEN** logout proceeds without a confirmation
