## Why

`Enter` in a focused filter already opens a lone bookmark, but it does
nothing for a lone note or a lone pinned collection. Now that pinned
lists mix bookmarks, notes, and collections, the shortcut silently
fails on exactly the result a user has filtered down to.

## What Changes

- Extend `Enter` in every supported focused filter so it activates the
  single visible result of any supported type:
  - bookmark - open the main link in a new browser tab (unchanged)
  - note - open the note details page in the current tab
  - collection - open the collection details page in the current tab
- Apply this to the Pinned/History dialog filter, the side Pinned
  filter, the search-results filter, the collection-details filter,
  the My Collections filter, and the collection-contents dialog filter.
- Keep the exactly-one rule: zero or multiple visible results do
  nothing, and an ambiguous mix is never activated.
- Treat an empty filter as valid; a naturally single visible result is
  still unambiguous.
- Keep `k+k` bookmark-only: it opens an external main link, which
  notes and collections do not have.
- Make inline filter hints name the actual target type (bookmark, note,
  or collection) instead of always saying "bookmark".
- Align the help and shortcut labels with the new behavior.
- Fix the side Pinned hint so it never disagrees with its `Enter`
  action when the filter is empty.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quick-access-shortcuts`: the focused-filter `Enter` requirements
  change from bookmark-only activation to type-aware activation for
  bookmarks, notes, and collections, and the shortcut-label requirement
  changes so hints describe the actual target.

## Impact

- **Affected app:** `codever-ui` only.
- **Routes and authentication:** no API routes change. The behavior
  stays available in authenticated Pinned/History and My Collections
  contexts and in public or personal bookmark/note/search/details views
  under the existing access rules; note and collection activation reuse
  the existing in-app details routes.
- **APIs and Mongoose models:** no changes.
- **Dependencies:** no new dependencies.
- **UI areas:** global keyboard shortcut handling, the Pinned/History
  dialog filter, the side Pinned quick-access filter, search-result
  filtering, My Collections filtering, collection-details filtering,
  the collection-contents dialog filter, and shortcut/help hint text.
