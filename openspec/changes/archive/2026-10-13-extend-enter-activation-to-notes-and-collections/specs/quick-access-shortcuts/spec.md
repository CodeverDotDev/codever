## MODIFIED Requirements

### Requirement: Shortcut labels match the bindings

The UI SHALL label each shortcut with the combination it actually responds
to in the help, about, tab, quick-access, collection, filter, dialog, and
bookmark-details surfaces. The shortcut documentation SHALL describe `k+k`
as opening the only visible bookmark's main link in supported non-editable
contexts and `Enter` as activating the only visible result of any supported
type from a focused supported filter.

#### Scenario: Hot Keys help page lists current shortcuts

- **WHEN** a user opens the Hot Keys help page
- **THEN** Pinned is shown as `Ctrl/Cmd+Shift+P`, History as
  `Ctrl/Cmd+Shift+H`, the search box as `Ctrl/Cmd+K`, `k+k` is described as
  opening the only visible bookmark in supported contexts, and `Enter` is
  described as activating the only visible result of any supported type
  from a focused supported filter

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

### Requirement: Open the only visible bookmark from a focused filter

The web UI SHALL open the main link of the only visible bookmark in a
focused Pinned/History filter, side Pinned filter, search-results filter,
collection-details filter, or collection-contents dialog filter when the
user presses `Enter`. The action SHALL work whether the filter is empty or
contains text, SHALL open the URL in a new browser tab, and SHALL preserve
the current UI and filter state.

#### Scenario: Enter opens one bookmark from the focused side Pinned filter

- **WHEN** the side Pinned filter has focus and exactly one visible bookmark
  remains, including when the filter is empty
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the side panel and filter state remain unchanged

#### Scenario: Enter opens one bookmark from the focused dialog filter

- **WHEN** the Pinned or History dialog filter has focus and exactly one
  visible bookmark remains
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the dialog and filter state remain unchanged

#### Scenario: Enter opens one bookmark from the focused search filter

- **WHEN** the search-results filter has focus and exactly one visible
  bookmark remains
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the search results and filter state remain unchanged

#### Scenario: Enter opens one bookmark from a focused collection-details filter

- **WHEN** a collection-details filter has focus and exactly one visible
  bookmark remains
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the collection page and filter state remain unchanged

#### Scenario: Enter opens one bookmark from the focused contents filter

- **WHEN** the collection contents dialog filter has focus and exactly one
  visible bookmark remains
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the dialog and filter state remain unchanged

#### Scenario: Focused filter does not open a note or ambiguous result

- **WHEN** the focused supported filter has zero or multiple visible
  results, or its only visible result is a note or a collection
- **THEN** pressing `Enter` does not open a bookmark link

### Requirement: Open the only visible collection from a focused filter

The web UI SHALL navigate to the details page of the only visible
collection when a focused supported filter that can list collections - the
My Collections filter, the side Pinned filter, or the Pinned dialog filter
- leaves exactly one visible collection. The action SHALL preserve the
existing collection navigation semantics, SHALL open the collection in the
current tab, and SHALL do nothing when zero or multiple collections are
visible.

#### Scenario: Enter opens one collection from the focused My Collections filter

- **WHEN** the My Collections filter has focus and exactly one collection
  remains, including when the filter is empty
- **THEN** the collection details page opens in the current tab

#### Scenario: Enter opens one collection from the focused side Pinned filter

- **WHEN** the side Pinned filter has focus and exactly one visible
  collection remains, including when the filter is empty
- **THEN** the collection details page opens in the current tab
- **AND** the side panel and filter state remain unchanged

#### Scenario: Enter opens one collection from the focused Pinned dialog filter

- **WHEN** the Pinned dialog filter has focus and exactly one visible
  collection remains
- **THEN** the collection details page opens in the current tab
- **AND** the dialog closes

#### Scenario: Focused My Collections filter does not navigate ambiguously

- **WHEN** the My Collections filter has focus and zero or multiple
  collections remain
- **THEN** pressing `Enter` does not navigate to a collection

## ADDED Requirements

### Requirement: Open the only visible note from a focused filter

The web UI SHALL navigate to the details page of the only visible note when
the user presses `Enter` in a focused Pinned/History filter, side Pinned
filter, collection-details filter, or collection-contents dialog filter.
The action SHALL work whether the filter is empty or contains text, SHALL
open the note details page in the current tab using the public or personal
note route according to the note's visibility, SHALL close an open
quick-access dialog, and SHALL do nothing when zero or multiple results are
visible or the only visible result is not a note. The search-results filter
SHALL NOT activate a note, because a matching note's content is already
displayed inline there.

#### Scenario: Enter opens one note from the focused side Pinned filter

- **WHEN** the side Pinned filter has focus and exactly one visible note
  remains, including when the filter is empty
- **THEN** the note details page opens in the current tab
- **AND** the side panel and filter text remain unchanged

#### Scenario: Enter opens one note from the focused dialog filter

- **WHEN** the Pinned or History dialog filter has focus and exactly one
  visible note remains
- **THEN** the note details page opens in the current tab
- **AND** the dialog closes

#### Scenario: Search-results filter does not activate a lone note

- **WHEN** the search-results filter has focus and exactly one visible note
  remains
- **THEN** no navigation occurs
- **AND** the search results and filter state remain unchanged

#### Scenario: Enter opens one note from a focused collection filter

- **WHEN** a collection-details filter or the collection contents dialog
  filter has focus and exactly one visible note remains
- **THEN** the note details page opens in the current tab

#### Scenario: Focused filter does not open an ambiguous note

- **WHEN** the focused supported filter has zero or multiple visible
  results, or its only visible result is a bookmark or a collection
- **THEN** pressing `Enter` does not open a note details page
