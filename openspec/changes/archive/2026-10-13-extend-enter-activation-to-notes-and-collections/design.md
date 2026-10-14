## Context

See `proposal.md` for motivation. Current state that shapes the approach:

- Five components own both their filter and their `Enter` handler:
  `HotKeysDialogComponent` (Pinned/History dialog),
  `QuickAccessResourcesComponent` (side Pinned),
  `AsyncSearchResultListComponent` (search results),
  `CollectionDetailComponent`, and
  `MyCollectionsPageComponent` (collections only).
- `MainLinkShortcutService` today resolves only the global `k+k` sequence and
  exposes one shared action, `openBookmarkInNewTab(bookmark, isLoggedIn)`, which
  promotes history and calls `window.open`.
- Each component's `Enter` handler independently re-implements the same
  "exactly one bookmark" test and type check. With three activatable types and
  six surfaces, that mapping is now duplicated six times.
- `UserDataResource` is a union of `Bookmark | Note | PinnedCollection`; all
  three carry `_id` and `type`.
- `CollectionContentsDialogComponent` has a filter but no `Enter` handler.
- Filter pipes differ by surface: `ResourceTitleFilterPipe` (dialog),
  `ResourceFilterPipe` (search, pinned), and a local `applyFilter()` split into
  `filteredBookmarks`/`filteredNotes` (collection details and the contents
  dialog).
- `NoteDetailsComponent` already reads `window.history.state.note` as an
  instant-render seed and promotes a visited note to history itself.

The 2026-10-09 design deliberately kept `Enter` in the owning components
"which can distinguish collections from bookmarks". That decision assumed two
types; this change revisits the dispatch half while keeping filter ownership
local.

## Goals / Non-Goals

**Goals:**

- One place that maps a visible resource type to its activation target, so the
  bookmark/note/collection rules cannot drift across six surfaces.
- Keep each component in ownership of its own filtered result set.
- Consistent tab semantics: external main link in a new tab; in-app details in
  the current tab.
- Hints that name the actual target type, driven by one shared description.
- Focused, invertible unit tests for the new type dispatch.

**Non-Goals:**

- No change to `k+k` resolution, priorities, or its bookmark-only contract.
- No new API, auth, Mongoose, or localStorage cache behavior.
- No change to how each surface filters (pipe choice stays local).
- No unification of the filter pipes themselves; that is a separate refactor.

## Decisions

### Dispatch lives in one shared method, filtering stays in components

Add `activateResource(resource: UserDataResource, userIsLoggedIn: boolean)` to
`MainLinkShortcutService`, which injects `Router` and switches on `type`:

- `bookmark` -> existing `openBookmarkInNewTab` (history promotion + new tab).
- `note` -> `router.navigate(noteDetailsRoute(note), { state: { note } })`.
- `collection` -> `router.navigate(['/my-collections', id])`.

Each component's `onFilterEnter` becomes: resolve the single visible resource,
then call `activateResource` once. Components keep their pipe and their
`filteredBookmarks`/`filteredNotes` state.

Alternative considered: keep the switch in each component (status quo
pattern). Rejected - six copies of the same three-way routing rule is exactly
the drift the 2026-10-09 design avoided for two types by centralizing the
bookmark rule; the same argument now applies to three.

Alternative considered: a brand-new `ResourceActivationService`. Rejected as
churn now - it would duplicate the registration and history logic already in
`MainLinkShortcutService`. Renaming that service is deferred (see Open
Questions).

### Each surface declares the types it can activate

`activateResource` also takes the surface's activatable types. Search results
pass `bookmark` only.

A matching note in search results already renders its full content inline and
auto-expands when it is the only filtered result (`showMoreText` is set from
`filteredCount === 1`), with the title linking to the details page on its own.
Navigating away would abandon a page that already shows that content and would
lose the search context. Collection details and the collection contents dialog
render only a note title, so they do activate notes.

Bookmarks keep activating on search results: the card expands the
*description*, not the remote page, so opening the main link still adds value.

Alternative considered: activate every type on every surface. Rejected - it
would navigate away from search results that are already displaying the note
body.

### Route choice stays in a shared note/collection link helper

The public-vs-personal note route already depends on `note.public` in three
places with slightly different shapes. `activateResource` will use one helper
so the public/personal decision is made once. Collections have a single route
(`/my-collections/:id`).

### New tab for external URLs, current tab for in-app routes

Bookmarks keep opening `location` in a new tab. Notes and collections navigate
the current tab, matching what clicking them already does today
(`navigateToDetails` in `QuickAccessResourcesComponent` and `openCollection` in
`MyCollectionsPageComponent`), and matching the existing "keep collection
navigation in the current tab" decision.

Alternative considered: open notes in a new tab for symmetry with bookmarks.
Rejected - it would duplicate the SPA in a second tab with no filter context and
break the click-consistency the entry already has.

Alternative considered: navigate the current tab for bookmarks too. Rejected -
it would regress the existing main-link convention and the reason the side
panel and dialogs stay open.

### Cardinality is "exactly one visible result", summed across split lists

Components with a single filtered list pass `filtered.length === 1`.
Components with two lists (`CollectionDetailComponent` and
`CollectionContentsDialogComponent`) require
`filteredBookmarks.length + filteredNotes.length === 1`. A shared pure helper
resolves the single resource for the single-list case so the count and the
`type` check are written once. Zero, several, or a mixed pair are all no-ops.

The empty filter is allowed: a naturally single result is unambiguous. This is
already specified but contradicted in the side Pinned hint getter, which bails
out when `pinnedFilterText.trim()` is empty; that guard is removed.

### Hints are type-aware, from one description helper

A small shared helper maps the single visible resource to a hint phrase
("bookmark", "note", or "collection"). Each surface renders the hint only when
a single visible result exists, so the hint and the action can never disagree.
This replaces the hard-coded "bookmark" wording in the side Pinned, dialog,
search, and collection-details templates.

Alternative considered: one generic string ("the only matching result").
Rejected by the user in favour of naming the target.

### In-app activation from a dialog closes the dialog

Navigating from the Pinned/History dialog or the collection contents dialog
leaves the current page, so the dialog closes - mirroring the existing
`[mat-dialog-close]="true"` note and collection links in those templates.
Bookmark activation keeps the dialog open because the new tab does not disturb
the current page.

### Note navigation seeds router state and relies on existing promotion

Passing `state: { note }` gives `NoteDetailsComponent` an instant placeholder
while it always re-fetches the fresh copy. History promotion for notes is
already performed by `NoteDetailsComponent`, so the handlers add nothing.

## Risks / Trade-offs

- **[Risk]** A component passes the wrong list (e.g. unfiltered vs filtered) to
  the shared resolver. **Mitigation:** the existing `*.filters.spec.ts` suites
  already construct components with explicit filtered state; extend them per
  surface and assert the activated resource id and type.
- **[Risk]** Removing the side Pinned `trim()` guard changes hint visibility.
  **Mitigation:** it is currently unreachable (the filter input renders only
  above five pinned entries, where an empty filter cannot leave one result), so
  no observable behavior changes; the guard removal only makes the hint
  logically consistent with the action.
- **[Risk]** Two list-ordering sources (`filteredBookmarks` + `filteredNotes`)
  could count as one each and total two. **Mitigation:** sum both arrays before
  comparing to one, and test the bookmark+note pair as no-op.
- **[Risk]** A public note reached from search would take the personal route.
  **Mitigation:** derive the route from `note.public` in the shared helper and
  cover both visibility cases in tests.
- **[Trade-off]** `MainLinkShortcutService` becomes a general activation
  service while keeping a main-link name. Accepted for now to keep the diff
  small; renaming is deferred.

## Migration Plan

Pure UI change; no data, API, or cache migration. Deploy the UI alone. Rollback
is a revert of the UI commit, which restores bookmark-only `Enter` with no
persisted state to unwind.

## Open Questions

- Rename `MainLinkShortcutService` to reflect that it now activates notes and
  collections, or keep the name to limit churn? Deferrable - it does not change
  the specs or the task breakdown.
- Should `k+k` ever activate a note or a collection? Deferred - the sequence
  contract is "open the main link", which notes and collections do not have.
