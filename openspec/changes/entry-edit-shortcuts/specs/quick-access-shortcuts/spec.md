## MODIFIED Requirements

### Requirement: Shortcut labels match the bindings

The UI SHALL label each shortcut with the combination it actually responds
to in the help, about, tab, quick-access, collection, filter, dialog,
bookmark-details, note-details and entry-form surfaces. The shortcut
documentation SHALL describe `k+k` as opening the only visible bookmark's
main link in supported non-editable contexts, `Enter` as activating the only
visible result of any supported type from a focused supported filter, `e` as
opening the edit form from a note or bookmark details page,
`Ctrl/Cmd+Enter` as saving the note or bookmark form, and `Escape` as
leaving the edit form.

#### Scenario: Hot Keys help page lists current shortcuts

- **WHEN** a user opens the Hot Keys help page
- **THEN** Pinned is shown as `Ctrl/Cmd+Shift+P`, History as
  `Ctrl/Cmd+Shift+H`, the search box as `Ctrl/Cmd+K`, `k+k` is described as
  opening the only visible bookmark in supported contexts, and `Enter` is
  described as activating the only visible result of any supported type
  from a focused supported filter, `e` is described as editing the entry
  of a details page, `Ctrl/Cmd+Enter` as saving the note or bookmark form,
  and `Escape` as leaving the edit form

#### Scenario: Contextual filter hint explains Enter

- **WHEN** a user views a focused supported filter that leaves exactly one
  visible result the surface can activate
- **THEN** the filter surface indicates that `Enter` activates that result
- **AND** the hint names the target as a bookmark, a note, or a collection

#### Scenario: Contextual filter hint is hidden when the result is ambiguous

- **WHEN** a focused supported filter leaves zero or multiple visible
  results
- **THEN** the filter surface shows no `Enter` hint

#### Scenario: Bookmark details hint explains k+k

- **WHEN** a user views a bookmark details page
- **THEN** the main-link affordance indicates that `k+k` opens the
  bookmark's main link in a new tab

#### Scenario: Collection hints explain Enter

- **WHEN** a user views the My Collections page, a collection details page,
  or the collection contents dialog
- **THEN** the relevant filter surface indicates that `Enter` activates the
  only visible result

#### Scenario: In-app shortcut hints match the bindings

- **WHEN** shortcut hints appear in the about page, the Home bookmark tabs,
  or the quick-access panel
- **THEN** they show the same combinations the app responds to

#### Scenario: Entry edit shortcuts are labelled
- **WHEN** a user can see the Edit action on a note or bookmark details
  page, or the Save or Cancel action in the note or bookmark edit form
- **THEN** the action indicates its shortcut: `e` for Edit,
  `Ctrl+Enter` or `Cmd+Enter` (matching the user's platform) for Save, and
  `Escape` for Cancel in edit mode
