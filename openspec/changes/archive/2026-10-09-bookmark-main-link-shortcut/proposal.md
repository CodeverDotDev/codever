## Why

Users can already reach collections, bookmark details, and bookmark main links
through visible controls, but repeatedly moving between filtered quick-access,
collection, search, and details views adds friction. Focused keyboard
actions will make the common case of activating the only relevant result faster
while preserving the current Codever context.

## What Changes

- Add a `k+k` keyboard sequence for opening the main link of the only visible
  bookmark in supported non-editable contexts.
- Recognize the second `k` only within a short timeout of the first press
  (target: 400 ms), ignore key auto-repeat, and leave ordinary text entry
  unaffected.
- Add `Enter` behavior when the Pinned/History or search-results filter is
  focused and exactly one visible bookmark remains, including when the filter is
  empty but only one bookmark is visible.
- Add `Enter` behavior when the My Collections filter is focused and exactly one
  visible collection remains, navigating to that collection's details page.
- Add `Enter` behavior when a collection-details filter is focused and exactly
  one visible bookmark remains, opening that bookmark's main link in a new tab.
- Do nothing when there are zero or multiple relevant results, or when the only
  relevant entry is a note.
- Open the bookmark URL in a new browser tab and preserve the current page,
  dialog, search results, and filter state.
- Preserve collection navigation in the current tab while preserving the
  collection filter state according to existing routing behavior.
- Add discoverable shortcut hints to the Hot Keys/help surfaces, relevant filter
  controls, collection navigation, and the bookmark details main-link
  affordance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quick-access-shortcuts`: extend shortcuts from opening Pinned
  and History to activating an unambiguous result from supported quick-access,
  collection, search, and details contexts, and keep shortcut hints aligned
  with the actual bindings.

## Impact

- **Affected app:** `codever-ui` only.
- **Routes and authentication:** no API routes change. The behavior is available
  in authenticated Pinned/History and My Collections contexts and in public or
  personal bookmark/search/details views according to the existing access rules.
  Entering a collection uses the existing personal collection route.
- **APIs and Mongoose models:** no changes.
- **Dependencies:** no new dependencies.
- **UI areas:** global keyboard handling, Pinned/History dialog filtering, the
  side Pinned quick-access filter, My Collections filtering, collection-details
  filtering, search-result filtering, bookmark details, and shortcut/help text.

