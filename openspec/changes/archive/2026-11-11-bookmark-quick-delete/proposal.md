## Why

Deleting a bookmark from search results currently reloads the whole page,
interrupting the user's search and losing the current view. Other bookmark
lists already have an event path for removal, so all bookmark lists should
respond consistently and without a disruptive reload.

## What Changes

- Keep the existing Delete button and confirmation dialog, including the
  current owner and administrator visibility and authorization behavior.
- After a confirmed successful deletion, remove the bookmark card in place
  from every list that displays it, without reloading or resetting the
  current search, filter, or scroll position.
- On the bookmark details page, navigate home after a successful deletion.
- Keep the card visible and show an error notification if deletion fails.
- Update client-side bookmark stores after successful deletion so quick
  access and dashboard lists do not retain stale entries.

## Capabilities

### New Capabilities

- `bookmark-quick-delete`: smooth, confirmed bookmark deletion from result
  cards and bookmark details.

### Modified Capabilities

None.

## Impact

- **Apps**: `codever-ui` only.
- **Routes**: uses the existing personal authenticated bookmark-delete route
  for owners and existing admin deletion behavior for administrators.
  No routes or authorization rules change.
- **APIs**: no endpoint or response changes.
- **Mongoose models**: none.
- **Dependencies**: none added.
- **UI code**: bookmark card, mixed search-result list, and bookmark-list
  hosts, with tests for in-place removal and unchanged filters.
