## Context

See `proposal.md` for motivation and agreed scope. Drafts cover only
blank-start creates and live in `localStorage`, several per type; every other
changed authoring form is protected by an unsaved-changes warning. The
original plan predates several relevant implementation details:

- Both editors now contain ordered `copyableFields` arrays and collection
  selections outside their form groups. Bookmark metadata and accepted AI
  changes can patch controls with `emitEvent: false`.
- Note forms can be built in both `ngOnChanges` and `ngOnInit`; drafts and the
  change baseline must bind to the final form and authenticated identity, not
  an obsolete form instance.
- Editors are hosted by route wrappers: `create-personal-*`, update wrappers,
  `clone-*`, and `new-entry`. Clone and copy-to-mine are flags on the shared
  editors; extension captures arrive with `initiator`/`popup` query params, and
  the bookmark editor calls `window.close()` after saving in popup mode.
- Both update wrappers fetch fresh details from personal APIs rather than
  trusting router state. Preserve this behavior.
- The note editor has `destroy$`; the bookmark editor lacks equivalent cleanup.
- `LocalStorageService` wraps `localStorage` and clears it for cache-version
  invalidation; that clear must now keep draft keys.
- Personal-data `localStorage` caching is opt-in. Drafts are a separate,
  always-on feature: they hold only the user's own unpublished input, are
  bounded in count and age, and are removed on logout.
- Logout handling is in `app-init.ts` using Keycloak signals. Navigation also
  calls `cleanUserRelatedData()` before logout redirects.
- No `CanDeactivate` guard or `beforeunload` handling exists in the UI yet.

This cross-cutting editor, routing, and authentication lifecycle change
warrants a design artifact. Decisions 1-4, 6, and 7 implement the
`new-entry-drafts` capability; Decision 5 implements
`unsaved-changes-warning`, and Decision 3's shared change tracking serves
both. Existing tagging and copyable-field resource validation remains
unchanged.

## Goals / Non-Goals

**Goals:** separate draft storage from resource persistence, reuse form
helpers, keep forgotten new-entry drafts across tab and browser close, make
recovery status truthful across lifecycle transitions, and warn before
discarding changes that no draft protects.

**Non-Goals:** edit drafts, cross-device sync, server concurrency,
collaboration, live cross-tab list updates, saving from the leave dialog, or
replacement of resource-save and authentication behavior.

## Decisions

### 1. Typed local storage records, one per create visit

Add a shared `DraftService` under `core/cache` over `localStorage`, with its
own JSON envelope, versioned records, and failure handling modelled on
`LocalStorageService`. Use an explicit draft namespace, not HTTP cache entries:

```text
codever-draft:v2:{userId}:{type}:{draftId}

record:
  schemaVersion, identity (userId, type, id), savedAt
  form: resource-specific raw editable values
  options: relevant selected save options
```

Each create visit creates its draft id lazily on its first write, so visits
and tabs write separate keys and never overwrite each other. Encode identity
segments consistently and validate the envelope and record before use. Use
typed resource-specific snapshots. Never persist tokens, profile data, or
derived HTML. Do not use the helpers that trim fields for final submission
when capturing a draft: unfinished text, over-limit tags, and incomplete
copyable-field rows must survive.

Use structural validation for draft records, not final resource validators.
`list(user, type)` returns readable drafts newest first, followed by
unreadable ones. Retention is bounded:

- at most 10 readable drafts per user and type; saving or listing trims the
  oldest beyond that;
- drafts not updated for 7 days expire; they are removed when loaded or
  listed, and `pruneExpired` removes them for all users at app start;
- unreadable or unsupported records are never trimmed or expired
  automatically; they are listed with Delete and removed on logout.

This keeps quota use small. Cache-version invalidation keeps keys with the
`codever-draft:v2:` prefix.

Cross-tab: each draft has its own key, so concurrent tabs only share the
list. Restoring re-reads the draft, so one removed meanwhile is reported as no
longer available. If two tabs restore the same draft, the last write wins. No
`storage` event listener refreshes open lists (possible follow-up).

Alternative: `sessionStorage` with one slot per type (an earlier revision).
Replaced: a draft forgotten after in-app navigation was lost on tab close,
and protecting it needed an app-wide close prompt on every page.

Alternative: `localStorage` behind the personal-data opt-in. Rejected: drafts
are the user's own unpublished input with bounded retention and logout
removal, and an opt-in would hide recovery from most users.

Alternative: Mongo or IndexedDB. Mongo violates the agreed frontend-only phase;
IndexedDB adds asynchronous lifecycle complexity not needed here.

Alternative: per-entry edit drafts with a stored server baseline and conflict
review. Rejected: the baseline comparison, conflict UI, and storage growth
outweigh the benefit once edits get a leave warning.

### 2. Explicit draft eligibility

Compute draft eligibility once from the entry route/input context, before
authoring. Only blank-start creates acquire a draft session. Create wrappers
identify supplied content and capture context, including note
code/comment/tags/origin/reference and bookmark URL/title/description.
Explicit extension initiator/popup context also excludes the create session,
even when payload fields happen to be empty. The in-app "+" menu adds
`initiator=browser`; that value supplies no content and keeps the create
eligible. Do not treat ordinary display-only query parameters as content.
Typing a URL into a blank-start bookmark remains eligible.

Edits, clone, and copy-to-mine never acquire a draft session; clone/copy flags
take precedence over create classification. Excluded flows therefore cannot
list, restore, overwrite, or remove create drafts, including from their
success handlers. They remain covered by the unsaved-changes warning
(Decision 5).

Uploading a notebook suspends draft handling before any extracted text patches
occur, leaving the stored Markdown draft untouched. Keep that editor visit
excluded from drafting even if the notebook is subsequently removed, and switch
it to warning-based protection.

Alternative: infer eligibility from current form emptiness. Rejected because
typing, clearing input, and asynchronous metadata would change identity.

### 3. Shared change tracking and draft lifecycle

Keep change tracking, persistence, and session lifecycle in shared services;
keep form mapping and UI integration in each editor. The same
resource-specific snapshot mapper serves both drafts and the leave warning.

Each editor records an initial snapshot once its initial content settles: the
empty form for blank creates, fresh server data for edits, source data for
clone/copy, and prefilled values plus metadata lookups started by the prefill
for captures. Compare normalized raw snapshots, not `dirty`, so event-
suppressed patches are handled and untouched clones/captures stay clean. User-
accepted AI or metadata changes and user-initiated metadata lookups count as
changes.

Model explicit draft states rather than relying only on `dirty`:

```text
ineligible  (warning-protected)
          |
          v
waiting-for-identity-and-form
          |
          v
        active --> saved / logged-out
          |  ^
          |  +-- restore(id): current draft becomes the restored one
          |
          +--> storage-error / unavailable  (warning-protected)
```

A new untouched create form creates no record; returning it to its initial
empty state removes the visit's current draft. Subscribe with a one-second
debounce and teardown. Explicitly notify the session after metadata/AI
updates that suppress events and collection selection changes outside the
form. Capture values at flush time. Rebuild tags and copyable-field arrays
using existing validators and helpers; restore with events suppressed, then
start ordinary monitoring. On bookmark restoration, invalidate pending
metadata responses and do not trigger a scrape that replaces restored
content. Resume normal URL lookups only after a subsequent user URL change.

The note snapshot includes its editable form and selected collection IDs. The
bookmark snapshot includes all editable form controls, read-later/pinned flags,
and selected collection IDs. Restore auxiliary state such as `makePublic`
consistently. Revalidate collection availability through the existing
selection flow and report unavailable selections rather than dropping them.

Flush synchronously on editor destruction, `pagehide`, `beforeunload`, and
when the page becomes hidden. Stop pending timers before a terminal
transition. Every write checks identity, eligibility, and session state
again. A successful resource response ends the handled session before
history/collection requests and removes only the draft this visit wrote or
restored; listed drafts the user did not restore are untouched. Resource
failures retain the latest eligible draft.

Alternative: only subscribe to `valueChanges`. Rejected because it misses
suppressed patches and loses input on exits inside the debounce interval.

### 4. Draft list with explicit restore and delete

A blank-start create editor shows a persistent list of the user's stored
drafts of its type (excluding the visit's own), newest first. Each row shows
the title (the bookmark URL as fallback, otherwise "untitled"; labels capped
at 80 characters), the save time, and Restore and Delete actions. Unreadable
rows show only Delete. Autosave keeps running while the list is shown.

Restore replaces the form only after a per-row confirmation if the user has
already changed it. Pending input is flushed first and stays listed as its own
draft; the restored draft then becomes the visit's current draft. Delete
removes only that stored draft, never current input. The editor shows a short
note that drafts are kept in this browser for 7 days, are removed on logout,
and are not published or synced.

Cancel is the explicit discard path. On an active draft create with changes,
a shared `confirmCancel` helper opens a Material dialog ("Discard this new
note/bookmark?", "Keep editing" focused, "Discard"). Discard removes only the
visit's own draft, cancels pending writes, and disarms protection, so the
following navigation is silent. Unchanged forms, and restored drafts not
changed since restoring, leave without a dialog and keep stored drafts. Edits
and suspended or unavailable sessions keep the normal guard on Cancel.

### 5. Unsaved-changes warning

Add an editor-protection registry in `core` and a functional `CanDeactivate`
guard on personal authoring routes: bookmark/note create, edit, clone, and
copy-to-mine. The `new-entry` route only redirects to a type-specific create
route and renders no editor, so the guard is registered on the redirect
targets instead. The active editor registers a protection state; the guard
queries the registry, so route wrappers do not need `ViewChild` plumbing.

The guard first asks an active draft session to flush synchronously. It allows
navigation without a prompt when the form is unchanged, or when the current
snapshot equals the last successfully written create draft. Otherwise it opens
an Angular Material confirmation dialog (external template/styles) with "Stay"
(default focus) and "Leave without saving". Leaving discards in-memory changes
only; the guard never removes a stored draft. Use
`canceledNavigationResolution: 'computed'` or equivalent so a cancelled browser
Back keeps history and the URL consistent.

Register a `beforeunload` listener whenever a form has changes. On the event,
the registry first flushes pending create drafts, then calls
`preventDefault()` and sets `returnValue` only if unprotected changes remain.
A stored draft survives reload and close, so drafted creates close silently;
edits, captures, clones, copies, notebooks, and failed writes still prompt.
Browsers show their generic prompt with no custom buttons; this also covers
extension popup windows. Remove the listener when the form is clean to avoid
unnecessary prompts and back/forward-cache penalties. No app-wide close prompt
is needed because drafts outlive the tab.

Disarm protection after a successful resource response, before navigation or
`window.close()`. Explicit logout disarms protection before
`cleanUserRelatedData()` and the Keycloak redirect. A failed save keeps
protection armed, so error-driven bookmark navigation passes through the
guard and the user can stay. Other full-page authentication redirects rely on
the native prompt where the browser shows it; a re-login keeps stored drafts.

No changes to `keycloak.protect()`, `UserIdValidator`, public access, or server
authorization are required. Guards rely only on client-side state.

Alternative: offer "Save" in the dialog. Rejected for this phase because
invalid forms cannot be saved from a guard and would need a separate error
path.

### 6. Logout cleanup and cache independence

On explicit navigation logout and Keycloak `AuthLogout`, stop writers before
removing all of the departing user's drafts from `localStorage`; retain the
session user ID before resetting user stores, falling back to the remembered
user. Other open tabs stop writing that user's drafts when they process the
logout; drafts are keyed by user ID and never listed to a different user.

If the authenticated identity changes while an editor stays mounted, the
draft session is suspended for the rest of that visit: the previous user's
input is never written to, or listed for, the new user. The input stays
protected by the leave warning.

Drafts are independent of HTTP caching: the personal-data opt-in and
`HttpClientLocalStorageService` are unchanged, cache-version invalidation
keeps draft keys, and edit wrappers keep loading fresh personal details.

### 7. Storage errors

Catch storage access, quota, and parse failures at the draft boundary with
explicit result states and visible editor messaging. Keep the last successfully
stored record when a write fails, and treat the editor as warning-protected.
Unavailable storage shows that drafts are unavailable. Malformed or
unsupported records are listed with Delete and are never silently overwritten.
Log operation/error metadata only, never draft text. A cleanup failure must be
reported without preventing logout.

## Risks / Trade-offs

- Drafts persist in the browser for up to 7 days, readable by anyone using
  the same browser profile while the user stays signed in, and by a
  successful XSS attack. Mitigate with bounded count and age, logout removal,
  start-up pruning, and no content in telemetry.
- Closing the browser without logging out leaves drafts until they expire or
  the user logs out.
- Open draft lists do not update live when another tab saves or deletes a
  draft; restore reports a missing draft instead.
- Restoring the same draft in two tabs can lose the earlier tab's changes
  (last write wins).
- Unsaved edits, captures, clones, and notebook changes are lost on a crash or
  forced process termination; the warning only covers deliberate exits.
- The native leave prompt is generic and cannot explain drafts or offer save.
- Snapshot normalization mistakes can cause false warnings or missed ones;
  cover each editor flow with tests and prefer warning over silent loss.
- A failed storage removal can leave a recoverable stale draft. Report the
  failure rather than claim cleanup succeeded.

## Migration Plan

No server migration or data backfill is required. Introduce the versioned
namespace and draft service, then logout handling, then shared change tracking
and the leave guard, then editor flows. Use existing real-template Vitest
fixtures for regression coverage. Keep all implementation tasks unchecked
until their stated checks pass. Earlier `v1` session drafts are not migrated;
they disappear with their tab.

Deploy frontend assets normally. Rollback removes the warning and the draft
list; leftover `codever-draft:v2:` keys are unused and can be removed by a
later cleanup or by logging out on a version that still knows them.
