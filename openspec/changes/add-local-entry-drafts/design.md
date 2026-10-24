## Context

See `proposal.md` for motivation and agreed scope. The original plan predates
several relevant implementation details:

- Both editors now contain ordered `copyableFields` arrays and collection
  selections outside their form groups. Bookmark metadata and accepted AI
  changes can patch controls with `emitEvent: false`.
- Note forms can be built in both `ngOnChanges` and `ngOnInit`; drafts must bind
  to the final form and authenticated identity, not an obsolete form instance.
- Both update wrappers fetch fresh details from personal APIs rather than
  trusting router state. Preserve this behavior.
- The note editor has `destroy$`; the bookmark editor lacks equivalent cleanup.
- `LocalStorageService` wraps data in a JSON envelope, throws on storage/parse
  failures, and uses `localStorage.clear()` for cache invalidation.
- Personal-data storage is opt-in. Its current settings description promises
  24-hour caching, which does not describe draft retention.
- Logout handling is in `app-init.ts` using Keycloak signals, not the old
  `app.module.ts` event subscription mentioned by the source plan. Navigation
  also calls `cleanUserRelatedData()` before logout redirects.
- Existing update APIs match ID and owner but do not enforce a version
  precondition. Some update paths do not explicitly supply `updatedAt`.

This cross-cutting editor, privacy, and cache lifecycle change warrants a design
artifact. Existing tagging and copyable-field resource validation remains
unchanged.

## Goals / Non-Goals

**Goals:** separate draft storage from resource persistence, reuse form helpers,
and make recovery status truthful across lifecycle transitions.

**Non-Goals:** transactional server concurrency, collaboration, automatic
merges, or replacement of resource-save and authentication behavior.

## Decisions

### 1. Typed local storage records with independent slots

Add a shared `DraftService` under `core/cache` using `LocalStorageService`.
Use an explicit draft namespace and versioned records, not HTTP cache entries.
Represent create/edit identity as a discriminated union:

```text
codever-draft:v1:{userId}:{type}:create
codever-draft:v1:{userId}:{type}:edit:{entryId}

record:
  schemaVersion, identity, savedAt, revision, writerId
  form: resource-specific raw editable values
  options: relevant selected save options
  base: edit-only canonical server values and updatedAt when available
```

Encode identity segments consistently and validate the envelope and record
before use. Use typed resource-specific snapshots, not arbitrary server objects.
Never persist tokens, profile data, or derived HTML. Do not use the helpers that
trim fields for final submission when capturing a draft: unfinished text,
over-limit tags, and incomplete copyable-field rows must survive.

Use structural validation for draft records, not final resource validators.
Absent optional values must normalize consistently during baseline comparison.
No automatic expiration or app-imposed count cap is proposed; browser quota is
the effective limit. A failed write must not evict a different draft.

Alternative: Mongo or IndexedDB. Mongo violates the agreed frontend-only phase;
IndexedDB adds asynchronous lifecycle complexity not needed for these bounded
text forms. Notebook payloads remain excluded.

### 2. Explicit eligibility and session identity

Compute eligibility once from the entry route/input context, before authoring.
Create wrappers identify supplied content and capture context, including note
code/comment/tags/origin/reference and bookmark URL/title/description. Explicit
extension initiator/popup context also excludes the create session, even when
payload fields happen to be empty. Do not treat ordinary display-only query
parameters as content. Typing a URL into a blank-start bookmark remains
eligible.

For edits, wait for authenticated identity and the loaded resource; require
matching owner, ID, and supported type. Clone/copy flags take precedence over
edit/create classification. Excluded flows never acquire a draft session, so
their success handlers cannot clear a draft.

Uploading a notebook suspends draft handling before any extracted text patches
occur, leaving the stored Markdown draft untouched. Keep that editor visit
excluded even if the notebook is subsequently removed; show the limitation.
This avoids silently storing notebook text as a Markdown replacement.

Alternative: infer eligibility from current form emptiness. Rejected because
typing, clearing input, and asynchronous metadata would change identity.

### 3. Shared lifecycle with resource-specific snapshots

Keep persistence and session lifecycle in the shared service; keep form mapping
and UI integration in each editor. Model explicit states rather than relying
only on `dirty`:

```text
ineligible / consent-disabled
          |
          v
waiting-for-identity-and-form
          |
          +--> restore-pending --> active
          |          |
          |          +--> conflict / unsupported
          v
        active --> saved / discarded / privacy-stopped
          |
          +--> storage-error / tab-conflict
```

Compare snapshots against initial form state. A new untouched form creates no
record; returning a handled create form to its initial empty state removes its
draft. Edit snapshots compare to the server baseline, so clearing a title or
content is a real unsaved edit, not an empty draft to drop.

Subscribe with a one-second debounce and teardown. Explicitly notify the draft
session after metadata/AI updates that suppress events and collection selection
changes outside the form. Capture values at flush time, not only at the last
form event. Rebuild tags and copyable-field arrays using existing validators and
helpers; restore with events suppressed, then start ordinary monitoring.
On bookmark restoration, invalidate pending metadata responses and do not
trigger a scrape that replaces restored content. Resume normal URL lookups only
after a subsequent user URL change, with responses scoped to that URL/session.

The note snapshot includes its editable form and selected collection IDs.
The bookmark snapshot includes all editable form controls, read-later/pinned
flags, and selected collection IDs. Restore auxiliary state such as
`makePublic` consistently. Revalidate collection availability through the
existing selection flow and report unavailable selections rather than silently
dropping them. Retain server identity, origin, and other non-editable fields
from fresh data, never from an old form snapshot.

Flush synchronously on editor destruction and `pagehide`, and when the page
becomes hidden. Stop pending timers before a terminal transition. Every write
checks identity, consent, eligibility, and session state again. A successful
resource response ends the handled session before history/collection requests.
Only clear a draft this session restored or wrote; an unresolved or conflicting
offer remains untouched if different current-form content is saved.
Resource failures retain the latest eligible draft, including bookmark error
paths that navigate away.

Alternative: only subscribe to `valueChanges`. Rejected because it misses
suppressed patches and loses input on exits inside the debounce interval.

### 4. Explicit recovery and conservative edit conflicts

Use a persistent editor recovery banner rather than an expiring toast. While a
decision is pending, pause autosave and explain that newly typed content is not
yet protected. Restore replaces the form only after confirmation if the user
has already changed it. Discard removes the offered snapshot, not current input;
subsequent changed input can start a fresh draft.

For edits, store a canonical baseline of the editable server fields alongside
the draft and retain `updatedAt` where available. On reopening, use a fresh
personal detail GET and compare both the canonical fields and timestamp.
Compare raw server values consistently rather than transformed date-input
values. A missing or unsupported baseline is unverifiable, not an automatic
match. Do not rely solely on timestamps or `__v`, because not all update paths
are known to maintain them as concurrency tokens.

If the baseline differs, keep the editor on current server content. Offer a
read-only draft review with copyable plain-text/JSON content and explicit
discard. Do not offer direct stale restore. The user can manually reconcile
copied text into current fields, then explicitly replace the old draft with
that working state. This rebases the new draft on the fresh entry.

On missing/failed detail GETs, retain the draft and surface the normal error;
do not apply it or create a replacement resource. No draft dashboard or orphan
recovery browser is added in this phase.

Alternative: silently restore or offer force-overwrite. Rejected because both
encourage losing edits saved elsewhere.

### 5. Consent, logout, and cache invalidation are different operations

Use the existing current user's `enableLocalStorage` preference and consent
state; wait for authoritative user data after startup. Expand settings wording
to separate 24-hour caches from drafts retained until save/discard/logout.
Show the storage-disabled state on eligible editors.

On consent withdrawal or logout, stop writers before removing all draft slots
for the departing user. Wire both explicit navigation logout and Keycloak
`AuthLogout`; retain the session user ID before resetting user stores. Ensure
other tabs process consent/logout invalidation, clear their writer state, and
cannot re-enable from stale cached user data.

Change cache-version invalidation to selectively remove non-draft keys rather
than clearing storage and rewriting draft copies. Preserve the whole recognized
draft namespace, including unsupported versions for explicit user handling.
Do not preserve unrelated personal caches. Do not infer consent from preserved
draft existence; re-establish it from the current authenticated user.

No changes to `keycloak.protect()`, `UserIdValidator`, public access, or server
authorization are required. Drafts do not use `HttpClientLocalStorageService`;
existing GET cache invalidation after resource saves remains in place.

Alternative: exempt drafts from all cleanup. Rejected because it contradicts
logout privacy and the existing opt-out semantics.

### 6. Storage errors and multiple tabs

Catch storage access, quota, and parse failures at the draft boundary with
explicit result states and visible editor messaging. Keep the last successfully
stored record when a write fails. Log operation/error metadata only, never
draft text. A cleanup failure must be reported without preventing logout.

Use opaque revision and writer IDs, observe `storage` events, and re-read the
slot before writes/removals. If its revision differs from the session's expected
revision, pause autosave and ask for an explicit restore/replace decision.
Never remove a newer detected revision merely because this tab saved an entry.
After another tab deletes the slot, stale sessions must not recreate it
automatically. Different slots remain independent.

This is detection, not an atomic compare-and-swap: localStorage has no
transaction primitive. Truly simultaneous same-slot writers can still race.
The UI must not promise multi-tab collaboration or perfect conflict prevention.
Atomic browser locking or a transactional store can be a separate enhancement.

## Risks / Trade-offs

- Abrupt crashes can lose the last debounce interval; lifecycle events are
  best-effort. Communicate local recovery rather than guaranteed backup.
- Drafts contain private text in readable browser storage. Require opt-in,
  enforce cleanup, and avoid content in telemetry.
- Many edit drafts can fill storage, especially with server baselines. Surface
  failures without silent eviction; raw notebooks remain excluded.
- `updatedAt` plus content comparison is conservative and can warn after an
  otherwise harmless server change. Prefer review over a missed conflict.
- A server update can race after the fresh GET. Backend conditional writes are
  outside scope, so this change does not guarantee lost-update prevention.
- A failed storage removal can leave a recoverable stale draft. Report the
  failure and suspend writes rather than claim cleanup succeeded.
- A full rollback to an older build can run its old all-storage cache cleanup.
  Preservation is guaranteed only by builds with the new cleanup behavior.

## Migration Plan

No server migration or data backfill is required. Introduce the versioned
namespace and service, then privacy/cache handling, then eligible editor flows.
Use existing real-template Karma/Jasmine fixtures for regression coverage.
Keep all implementation tasks unchecked until their stated checks pass.

Deploy frontend assets normally. Rollback does not change server entries, but
older clients will not understand drafts and may clear them on cache changes.
Document this limitation rather than adding a backend rollout dependency.
