## 1. Draft identity and storage

- [x] 1.1 Add typed create-draft identities (user, type, per-visit draft id),
  resource snapshots, versioned envelopes, and namespaced
  `codever-draft:v2:` keys under the UI core cache/model area. Verify Vitest
  unit tests distinguish users, resource types, and draft ids.
- [x] 1.2 Implement a `localStorage`-backed save/load/list/remove, per-user
  cleanup, 7-day expiry with start-up pruning, and a 10-draft cap per user
  and type, with structural validation and explicit storage failure results.
  Verify Vitest tests cover quota errors, unavailable storage, malformed JSON,
  unsupported versions, incomplete fields, newest-first listing, trimming,
  expiry, preservation of the other type's drafts, and that cache-version
  clearing keeps draft keys.

## 2. Logout lifecycle

- [x] 2.1 Gate draft sessions on the current authenticated identity. Verify
  Vitest tests cover delayed user data, a different user in the same tab, and
  independence from the personal-data storage setting.
- [x] 2.2 Wire explicit navigation logout and `app-init.ts` AuthLogout to stop
  writers before removing the user's drafts from this browser, and have
  other tabs stop writing when they process the logout. Verify Vitest
  tests cover pending timers, teardown, missing reset identity, and visible
  cleanup failures without blocking logout.

## 3. Shared change tracking and draft lifecycle

- [x] 3.1 Add shared snapshot normalization and initial-snapshot capture once
  initial content settles (blank, fresh edit data, clone/copy source, prefill
  plus prefill-initiated metadata). Verify Vitest tests report unchanged for
  untouched forms and changed for user edits, accepted AI/metadata changes,
  and event-suppressed patches.
- [x] 3.2 Add create-draft session states and one-second debounced writes, with
  explicit notifications for non-emitting programmatic changes. Verify
  fake-timer tests at 999/1,000 milliseconds, untouched forms, removal when a
  blank create returns to empty, and event-suppressed changes.
- [x] 3.3 Flush eligible changes on teardown, pagehide, and page hiding; cancel
  pending work on terminal transitions. Verify lifecycle tests retain the
  latest input before debounce and never recreate drafts cleared by saving,
  discarding, or logout.
- [x] 3.4 Add the draft list (newest first, title or untitled, save time,
  per-draft Restore/Delete) and recovery-status UI, including the
  browser/7-day retention note, using external templates/styles. Verify
  component tests cover autosave while drafts are listed, confirmation before
  replacing typed input, keeping replaced input as its own draft, delete
  without erasing current input, a draft removed elsewhere, unreadable
  drafts, storage errors, and keyboard accessibility.
- [x] 3.5 Make Cancel on a changed active draft create confirm via a Material
  discard dialog (external template/styles) and, on Discard, remove only the
  visit's own draft and disarm. Verify tests cover unchanged and
  restored-unchanged forms leaving without a dialog, Keep editing staying,
  other drafts untouched, no recreation after teardown, and edits deferring
  to the guard.

## 4. Unsaved-changes warning

- [x] 4.1 Add a core editor-protection registry exposing changed and
  draft-protected state, draft-protected only when the current snapshot
  equals the last successful write. Verify Vitest tests cover clean,
  draft-protected, write-failed, unavailable-storage, and notebook states.
- [x] 4.2 Add a functional `CanDeactivate` guard and Material confirmation
  dialog ("Stay" default, "Leave without saving") with external
  template/styles, and register it on bookmark/note create, edit, clone, and
  copy-to-mine routes (`new-entry` only redirects to them). Verify Vitest
  tests: unprotected changes prompt,
  draft-protected creates leave silently, Stay cancels, Leave proceeds
  without touching stored drafts, and a synchronous flush runs first;
  confirm manually (7.3) that a cancelled Back keeps URL/history consistent.
- [x] 4.3 Register `beforeunload` whenever a form has changes; on the event,
  flush pending create drafts first and call `preventDefault`/`returnValue`
  only when unprotected changes remain. Verify Vitest tests for arming,
  disarming, flushed creates closing silently, and failed writes prompting;
  manually confirm the native prompt on reload, tab close, and extension
  popup close for edits and captures, and no prompt for drafted creates.
- [x] 4.4 Disarm protection after successful saves before navigation or
  `window.close()`, and on explicit logout before cleanup and redirect; keep
  it armed after failed saves. Verify Vitest tests for each bypass and for
  error-driven bookmark navigation still prompting.

## 5. Note editor integration

- [x] 5.1 Classify blank-start create eligibility in the note create wrapper;
  exclude supplied content/capture context, clone/copy, edits, and notebook
  sessions from drafting. Verify component tests preserve a seeded create
  draft across opening, changing, saving, and leaving each excluded flow.
- [x] 5.2 Bind change tracking and the draft session only after final
  form/identity readiness. Capture raw fields, tags, ordered copyable fields,
  and collection selections; rebuild arrays on restore. Verify component tests
  cover async hydration, invalid rows, selected collections, accepted AI
  changes, and unchanged resource validation.
- [x] 5.3 Suspend drafting before notebook-generated form patches, keep that
  exclusion through the visit, and switch to warning protection. Verify
  component tests cover upload, removal, notebook save, the leave prompt, and
  preservation of the earlier Markdown draft.
- [x] 5.4 Integrate create success cleanup before secondary side effects, keep
  drafts on failure, and register edit/clone/copy forms with the guard. Verify
  tests remove only the visit's own draft, preserve bookmark drafts and
  unresolved listed drafts, and that changed
  edits prompt while untouched ones do not.

## 6. Bookmark editor integration

- [x] 6.1 Classify blank-start bookmark creates; exclude prefilled/capture,
  clone/copy, and edits from drafting. Verify component tests preserve seeded
  drafts through all excluded lifecycle paths, including successful saves and
  later clearing of prefilled controls.
- [x] 6.2 Add lifecycle teardown for draft and guard subscriptions and capture
  snapshots including tags, copyable fields, visibility, dates, read-later,
  pinned, and collection choices. Verify component tests restore raw values,
  derived display state, and incomplete inputs without changing validation.
- [x] 6.3 Treat prefill-initiated metadata as initial state, notify autosave
  after user-initiated metadata/AI patches, and protect restored content from
  new or in-flight scraping responses. Verify delayed-response tests show an
  untouched capture stays clean, restoration is stable, and a later user URL
  change works normally.
- [x] 6.4 Integrate create/update success and error paths with scoped draft
  cleanup and guard disarming, including popup `window.close()`. Verify tests
  cover error-driven navigation prompting, secondary store or collection
  failures, unresolved listed drafts, and preservation of note drafts.

## 7. Cross-feature verification

- [x] 7.1 Extend existing real-template Vitest fixtures, following
  `shared/tags/tag-editors.spec.ts` and copyable-field tests. Run the draft,
  guard, editor, logout, tagging, and copyable-field suites with `ng test`;
  verify both editors and all excluded flows pass.
- [x] 7.2 In a browser, exercise bookmark and note drafts, several drafts of
  one type, a changed and an untouched edit, clone, copy-to-mine, and an
  extension capture. Verify drafts are listed only in matching blank create
  editors, warnings appear only for unprotected changes, and a capture never
  removes a create draft.
- [x] 7.3 Exercise navigation inside the debounce window, a cancelled Back,
  reload, tab and browser close, two tabs creating the same type, more than
  10 drafts, a Keycloak re-login redirect, and logout. Verify the observable
  scenarios in both delta specs, that drafts are removed on logout, and that
  the UI does not promise sync or saving from the leave dialog.
- [x] 7.4 Run `ng lint` on changed UI code and a production build. Verify
  successful checks, no API/model changes, and no unrelated generated
  artifacts in the implementation diff.
