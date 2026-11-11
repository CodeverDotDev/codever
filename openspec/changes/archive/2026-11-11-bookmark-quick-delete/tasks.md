## 1. In-Place Deletion

- [x] 1.1 Remove the search-page reload after successful deletion, preserve
  confirmation and owner/admin behavior, and verify the bookmark-card tests
  cover confirmation, cancellation, failure, and details navigation.
- [x] 1.2 Handle successful bookmark-deletion events in every shared list
  host, remove cards without mutating source arrays, and verify list tests
  preserve the current query, filters, and view state.
- [x] 1.3 Derive the search empty state from rendered results and verify
  deleting the last matching bookmark displays the empty-results message.
- [x] 1.4 Preserve personal and administrator store cleanup and verify
  deleted bookmarks no longer appear in affected client-side collections.

## 2. Integration Verification

- [x] 2.1 Run the targeted bookmark-card, search-result, and bookmark-list
  UI tests and verify deletion behavior across all affected list surfaces.
- [x] 2.2 Run the frontend lint command and verify the changed UI code has
  no lint errors.
