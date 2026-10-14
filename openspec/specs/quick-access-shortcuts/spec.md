# quick-access-shortcuts Specification

## Purpose

Let users open the Pinned and History quick-access dialogs from the keyboard with combinations that do not override the browser's own shortcuts, on Windows/Linux and macOS alike.

## Requirements

### Requirement: Pinned quick-access shortcut

The web UI SHALL open the Pinned quick-access dialog when the user presses `Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS while the Codever app has focus and the user is signed in.

#### Scenario: Open Pinned from the keyboard
- **WHEN** a signed-in user presses `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) while the app has focus
- **THEN** the Pinned quick-access dialog opens

#### Scenario: Pinned shortcut requires sign-in
- **WHEN** a signed-out user presses the Pinned shortcut while the app has focus
- **THEN** the Pinned dialog does not open
- **AND** a sign-in prompt is shown

### Requirement: History quick-access shortcut

The web UI SHALL open the History quick-access dialog when the user presses `Ctrl+Shift+H` on Windows/Linux or `Cmd+Shift+H` on macOS while the Codever app has focus and the user is signed in.

#### Scenario: Open History from the keyboard
- **WHEN** a signed-in user presses `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (macOS) while the app has focus
- **THEN** the History quick-access dialog opens

#### Scenario: History shortcut requires sign-in
- **WHEN** a signed-out user presses the History shortcut while the app has focus
- **THEN** the History dialog does not open
- **AND** a sign-in prompt is shown

### Requirement: Quick-access shortcuts avoid browser-native conflicts

Quick-access shortcuts SHALL NOT reuse the combinations browsers bind to native Print and History, and pressing a quick-access shortcut SHALL suppress any browser action otherwise bound to that combination while the app has focus.

#### Scenario: Native Print is available again
- **WHEN** a user presses `Ctrl+P` (Windows/Linux) or `Cmd+P` (macOS) while the app has focus
- **THEN** the browser's native Print action proceeds
- **AND** no Codever quick-access dialog opens

#### Scenario: Native History is available again
- **WHEN** a user presses `Ctrl+H` (Windows/Linux) or `Cmd+H` (macOS) while the app has focus
- **THEN** the browser's own action for that combination proceeds
- **AND** the Codever History dialog does not open

#### Scenario: Quick-access combination owns its browser binding
- **WHEN** a user presses `Ctrl+Shift+P`, `Ctrl+Shift+H`, `Cmd+Shift+P`, or `Cmd+Shift+H` while the app has focus
- **THEN** the corresponding Codever dialog responds
- **AND** a browser action otherwise bound to that combination, such as Firefox's New Private Window, does not occur

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
  and presses `k+k` within 400 milliseconds outside an editable control
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
