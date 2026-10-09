## MODIFIED Requirements

### Requirement: Shortcut labels match the bindings

The UI SHALL label each shortcut with the combination it actually responds to in
the help, about, tab, quick-access, collection, filter, and bookmark-details
surfaces. The shortcut documentation SHALL describe `k+k` as opening the only
visible bookmark's main link in supported non-editable contexts and `Enter` as
activating the only relevant result from a focused supported filter.

#### Scenario: Hot Keys help page lists current shortcuts

- **WHEN** a user opens the Hot Keys help page
- **THEN** Pinned is shown as `Ctrl/Cmd+Shift+P`, History as
  `Ctrl/Cmd+Shift+H`, the search box as `Ctrl/Cmd+K`, `k+k` is described as
  opening the only visible bookmark in supported contexts, and `Enter` is
  described as activating the only relevant result from a focused supported
  filter

#### Scenario: Contextual filter hint explains Enter

- **WHEN** a user views a Pinned/History filter or search-results filter
- **THEN** the filter surface indicates that `Enter` opens the only visible
  bookmark when exactly one bookmark is available

#### Scenario: Bookmark details hint explains k+k

- **WHEN** a user views a bookmark details page
- **THEN** the main-link affordance indicates that `k+k` opens the bookmark's
  main link in a new tab

#### Scenario: Collection hints explain Enter

- **WHEN** a user views the My Collections page or a collection details page
- **THEN** the relevant filter surface indicates that `Enter` activates the only
  relevant visible result

#### Scenario: In-app shortcut hints match the bindings

- **WHEN** shortcut hints appear in the about page, the Home bookmark tabs, or
  the quick-access panel
- **THEN** they show the same combinations the app responds to

## ADDED Requirements

### Requirement: Open the only visible bookmark with a key sequence

The web UI SHALL open the main link of the only visible bookmark in the active
supported non-editable context when the user presses `k` twice and the second
press occurs within 400 milliseconds of the first. The action SHALL open the URL
in a new browser tab and SHALL preserve the current Codever page, dialog, search
results, and filter state.

#### Scenario: Open one bookmark from a dialog

- **WHEN** a user has an open Pinned or History dialog with exactly one visible
  bookmark and presses `k+k` within 400 milliseconds
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the dialog and its current filter state remain open and unchanged

#### Scenario: Open one bookmark from a search result

- **WHEN** a user is viewing search results with exactly one visible bookmark
  and
  presses `k+k` within 400 milliseconds outside an editable control
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the search page and its current filter state remain unchanged

#### Scenario: Open a bookmark from its details page

- **WHEN** a user is viewing a bookmark details page and presses `k+k` within
  400 milliseconds outside an editable control
- **THEN** the displayed bookmark's main link opens in a new browser tab
- **AND** the details page remains open

#### Scenario: Sequence timeout prevents activation

- **WHEN** the second `k` press occurs more than 400 milliseconds after the
  first press
- **THEN** no bookmark link opens

#### Scenario: Ambiguous or non-bookmark context does not activate

- **WHEN** zero or multiple entries are visible, or the only visible entry is a
  note
- **THEN** no bookmark link opens

#### Scenario: Editable controls remain usable

- **WHEN** a user presses `k+k` while an editable control other than a supported
  filter has focus
- **THEN** the characters are handled as ordinary text input and no bookmark
  link opens

### Requirement: Open the only visible bookmark from a focused filter

The web UI SHALL open the main link of the only visible bookmark in a focused
Pinned/History filter, side Pinned filter, search-results filter, or
collection-details filter when the user presses `Enter`. The action SHALL work
whether the filter is empty or contains text, SHALL open the URL in a new
browser tab, and SHALL preserve the current UI and filter state.

#### Scenario: Enter opens one bookmark from the focused side Pinned filter

- **WHEN** the side Pinned filter has focus and exactly one visible bookmark
  remains, including when the filter is empty
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the side panel and filter state remain unchanged

#### Scenario: Enter opens one bookmark from the focused dialog filter

- **WHEN** the Pinned or History dialog filter has focus and exactly one visible
  bookmark remains
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the dialog and filter state remain unchanged

#### Scenario: Enter opens one bookmark from the focused search filter

- **WHEN** the search-results filter has focus and exactly one visible bookmark
  remains
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the search results and filter state remain unchanged

#### Scenario: Enter opens one bookmark from a focused collection-details filter

- **WHEN** a collection-details filter has focus and exactly one visible
  bookmark remains
- **THEN** the bookmark's main link opens in a new browser tab
- **AND** the collection page and filter state remain unchanged

#### Scenario: Focused filter does not open a note or ambiguous result

- **WHEN** the focused supported filter has zero or multiple visible entries, or
  its only visible entry is a note
- **THEN** pressing `Enter` does not open a bookmark link

### Requirement: Open the only visible collection from a focused filter

The web UI SHALL navigate to the details page of the only visible collection
when
the My Collections filter has focus and the filter result contains exactly one
collection. The action SHALL preserve the existing collection navigation
semantics and SHALL do nothing when zero or multiple collections are visible.

#### Scenario: Enter opens one collection from the focused My Collections filter

- **WHEN** the My Collections filter has focus and exactly one collection
  remains, including when the filter is empty
- **THEN** the collection details page opens in the current tab

#### Scenario: Focused My Collections filter does not navigate ambiguously

- **WHEN** the My Collections filter has focus and zero or multiple collections
  remain
- **THEN** pressing `Enter` does not navigate to a collection
