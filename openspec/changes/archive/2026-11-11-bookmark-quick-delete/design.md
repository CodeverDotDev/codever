## Context

See `proposal.md` for the motivation and user-visible scope. The bookmark
card already confirms deletion and calls the existing personal or
administrator deletion service. Search deletion currently reloads the page.
Bookmark cards emit a deletion event, but shared list hosts do not all use
that event to remove the card.

## Goals / Non-Goals

**Goals:**

- Reuse existing delete services, confirmation, and authorization checks.
- Propagate successful deletion to all bookmark-list hosts.
- Keep each list's current query and view state while removing the card.
- Show an empty-results message when a search has no remaining cards.
- Keep client-side bookmark collections consistent after deletion.

**Non-Goals:**

- Change bookmark API routes, responses, or authorization behavior.
- Change how bookmark search, filtering, or pagination is performed.
- Change deletion semantics or add undo behavior.

## Decisions

### Remove cards in their list hosts

Have the bookmark card notify its list host only after the delete service
succeeds. The mixed search-result host and shared bookmark-list host should
track successfully deleted bookmark identities and omit those cards from
their rendered results. This avoids mutating search or store-owned arrays
and works when an observable emits again with stale results.

Alternatives considered:

- Reloading the page repeats the current disruptive behavior.
- Removing the bookmark from a shared source array risks changing state
  owned by search or store services.

### Derive the search empty state from rendered results

The search-results host should expose an empty state when its filtered
rendered bookmark results contain no cards after a deletion. Keep the
existing search query and other list state intact.

Alternative considered: relying on the original search response count would
leave a blank results area after the final card is removed.

### Keep existing services and store cleanup

Retain the current personal and administrator delete calls and their
existing store-cleanup behavior. Do not remove a card or update local
collections until the deletion call succeeds. Keep failures visible through
the existing error notification path.

Alternatives considered:

- A new API endpoint or server-side behavior is unnecessary for this UI
  change.
- Optimistically removing the card would require restoring it on failure.

### Keep details-page navigation consistent

Navigate home after successful deletion from a details page for either
authorized deletion path. On failure, stay on the details page. This keeps
the details route from continuing to display a deleted resource.

## Risks / Trade-offs

- [A list host misses a delete event] -> Bind and test the event in every
  bookmark-list host where Delete is available.
- [A later observable emission restores the deleted card] -> Filter by
  successfully deleted bookmark identities for the host's lifetime.
- [Failure is mistaken for success] -> Emit deletion only after the service
  succeeds and preserve the existing error notification path.
- [A stale client-side collection still shows the bookmark] -> Retain and
  test the existing store cleanup for personal and administrator deletion.

## Migration Plan

No data migration or API deployment is required. Roll back by reverting the
UI changes; existing bookmark deletion services remain compatible.
