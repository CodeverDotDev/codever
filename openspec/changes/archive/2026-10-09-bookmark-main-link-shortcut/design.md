## Context

The existing `codever-ui` application has global keyboard handling for the
Pinned and History dialogs. Pinned/History dialogs, the side Pinned quick-access
panel, My Collections, collection details, search results, and bookmark details
use separate components and expose collection navigation or bookmark main
links. The side panel is rendered alongside page content, so the design must
resolve the details-page versus side-panel ambiguity through focus state rather
than DOM presence. No API, authentication, persistence, or bookmark data-model
behavior is changing.

## Goals / Non-Goals

**Goals:**

- Add one consistent double-`k` action for unambiguous bookmark contexts.
- Use `Enter` as the natural action when a supported filter owns focus.
- Make bookmark opening available only for one visible bookmark and never for
  notes or ambiguous bookmark collections.
- Navigate to a collection only when the My Collections filter has focus and
  exactly one collection is visible.
- Preserve the existing UI while opening external bookmark URLs in a new tab.
- Keep shortcut help and contextual hints aligned with the actual behavior.
- Provide focused unit/component coverage for timing, focus, result count,
  bookmark type, collection navigation, and new-tab behavior.

**Non-Goals:**

- No API endpoints, authentication rules, Mongoose models, or localStorage cache
  behavior.
- No shortcut for opening notes, snippets, or multiple results.
- No use of `k+k` to navigate to collections; collection navigation is an
  `Enter` action while its filter has focus.
- No replacement of the existing Pinned, History, or search shortcuts.
- No automatic closing, resetting, or navigation of the current Codever page
  after opening a bookmark.
- No shortcut interception in ordinary editable controls.

## Decisions

### Centralize sequence recognition, keep result resolution local

Use a small UI keyboard-shortcut coordination mechanism for recognizing `k+k`,
including a 400 ms timer, auto-repeat rejection, cancellation, and editable-
control checks. Each surface should expose or provide its currently
visible resources to the action resolver rather than duplicating timing logic in
every component. Focused filters handle `Enter` through their owning components,
which can distinguish collections from bookmarks and retain ownership of their
filtered data. This avoids multiple competing global listeners while allowing
each component to retain ownership of its filtered collection.

Alternative considered: adding independent key handlers to every component.
This would be simpler initially but would duplicate timeout behavior and make
dialog, side-panel, search, collection, and details precedence harder to keep
consistent.

### Use focus to resolve the side-panel/details conflict

When a supported filter input has focus, `Enter` resolves only that filter's
visible collection. The side Pinned panel wins only while its filter is
focused. Outside the filter, `k+k` resolves the active page or dialog, so
a bookmark details page wins over the merely visible side panel.

Alternative considered: prioritizing whichever component appears first in DOM.
That is brittle because the side panel is globally rendered and does not
represent the user's active intent.

### Use exact visible-result cardinality and type-specific activation

The action resolver operates on the entries currently visible after the relevant
filter and type rules. For bookmark contexts, it opens only when the visible
bookmark count is exactly one and the selected resource type is `bookmark`. In
My Collections, `Enter` navigates only when the visible collection count is
exactly one. In collection details, the bookmark action is based on the filtered
bookmark set; notes are not activation targets. Empty filter text is allowed; a
naturally single relevant result is still unambiguous.

Alternative considered: requiring non-empty filter text. That would create an
arbitrary distinction between a collection that naturally has one item and one
narrowed to one item.

### Open directly in a new tab and preserve state

Use the same new-tab behavior as the existing main-link controls and promote the
bookmark to history through the existing behavior where applicable. The shortcut
must not close dialogs, clear filters, navigate away from details, or replace
current Codever tab. Because the action is initiated by a keyboard event, the
new-tab request remains directly user initiated.

Alternative considered: navigating the current tab or closing the dialog after
opening. Both would break the existing main-link convention and make repeated
opening less efficient.

### Keep collection navigation in the current tab

The My Collections filter's `Enter` action reuses existing collection-details
navigation in the current tab. It must not open a new tab because a collection
is an in-app grouping rather than an external main link. Once inside the
collection, `Enter` on a focused filter uses the bookmark-specific new-tab
action.

Alternative considered: opening a collection in a new tab. This would make
collection navigation inconsistent with the existing collection-card click and
would blur the distinction between navigating to a collection and opening an
external bookmark.

### Place hints by scope

Keep the complete behavior in the Hot Keys/help surface. Put `Enter` guidance
beside the Pinned/History, collection, and search filter controls, and put the
`k+k` hint beside the bookmark details main-link affordance. Do not add `k+k` to
every search-result or collection bookmark card, which would add noise and imply
cursor-specific behavior that is not part of the design.

## Risks / Trade-offs

- **[Risk]** A user presses the first `k` intending to type and then presses
  another `k` within 400 ms. **Mitigation:** do not recognize `k+k` in editable
  controls; use `Enter` for supported focused filters.
- **[Risk]** Browser popup blocking prevents a new tab from opening.
  **Mitigation:** call the existing direct new-tab behavior synchronously from
  the trusted keyboard event and leave the UI unchanged if opening fails.
- **[Risk]** Different components expose filtered results differently.
  **Mitigation:** define and test a shared action contract around the currently
  visible collection and keep filtering/counting in the owning component.
- **[Risk]** Collection details displays bookmarks and notes under one unified
  filter. **Mitigation:** use the filtered bookmark set for the bookmark action,
  never make a note an activation target, and do nothing when more than one
  bookmark remains.
- **[Risk]** The My Collections list is loaded through a paginated personal data
  request. **Mitigation:** treat the currently rendered collection page as the
  visible candidate set and verify the one-collection case through component
  behavior tests.
- **[Risk]** A global listener fires while a modal or nested interactive element
  has focus. **Mitigation:** give focused supported filters first priority for
  `Enter`, suppress global `k+k` handling in editable controls, and test
  dialog/page precedence explicitly.
- **[Risk]** A 400 ms timeout may feel too short or too long for some users.
  **Mitigation:** keep the interval in one named value so it can be
  adjusted after usability feedback without changing the behavior contract.
