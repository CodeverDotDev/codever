## 1. Draft identity and storage

- [ ] 1.1 Add typed create/edit draft identities, resource snapshots, versioned
  envelopes, and namespaced keys under the UI core cache/model area. Verify
  unit tests distinguish users, resource types, create slots, and entry IDs.
- [ ] 1.2 Implement save/load/remove and per-user cleanup with structural
  validation and explicit storage failure results. Verify unit tests cover
  quota errors, unavailable storage, malformed JSON, unsupported versions,
  incomplete fields, and preservation of previously stored/unrelated drafts.
- [ ] 1.3 Add revision/writer tracking, storage-event handling, and pre-write
  revision checks. Verify unit tests pause detected same-slot writers and
  prevent stale deletion/recreation without blocking different entry slots.

## 2. Privacy and cache lifecycle

- [ ] 2.1 Gate draft sessions on current authenticated identity and confirmed
  personal-storage consent. Verify unit tests cover delayed user data, default
  opt-out, account changes, and revalidation after a cache-version change.
- [ ] 2.2 Wire explicit navigation logout, `app-init.ts` AuthLogout, and consent
  withdrawal to stop writers before removing the user's draft namespace.
  Verify unit tests cover pending timers, teardown, cross-tab invalidation,
  missing reset identity, and visible cleanup failures without blocking logout.
- [ ] 2.3 Make cache-version cleanup preserve draft records without preserving
  unrelated caches or implicitly granting consent. Verify unit tests cover
  both create/edit slots, unsupported draft versions, and normal cache removal.
- [ ] 2.4 Update local-storage settings copy to distinguish cache expiry from
  draft retention, browser locality, logout removal, and privacy risks. Verify
  rendered settings and component tests match the existing opt-in behavior.

## 3. Shared editor lifecycle and recovery UI

- [ ] 3.1 Add shared session states and one-second debounced snapshot handling,
  with explicit notifications for non-emitting programmatic changes. Verify
  fake-timer tests at 999/1,000 milliseconds, unchanged forms, blank create
  reset, deliberate empty edits, and event-suppressed changes.
- [ ] 3.2 Flush eligible changes on teardown, pagehide, and page hiding; cancel
  pending work on terminal transitions. Verify lifecycle tests retain the
  latest input before debounce and never recreate drafts cleared by saving,
  discarding, or privacy cleanup.
- [ ] 3.3 Add persistent restore/discard and recovery-status UI using external
  templates/styles. Verify component tests cover pending-offer write
  suspension, explicit confirmation before replacing typed input, discard
  without erasing current input, storage errors, and keyboard accessibility.
- [ ] 3.4 Implement canonical edit baselines and fresh-server comparison,
  including timestamp and editable fields. Add conflict review/copy/discard
  and explicit replacement after manual reconciliation. Verify unit/component
  tests cover unchanged content, changed content without changed timestamps,
  missing baselines, request failure, unavailable entries, and no stale restore.

## 4. Note editor integration

- [ ] 4.1 Classify blank-start create eligibility in the note create wrapper;
  exclude supplied content/capture context, clone/copy, and notebook sessions.
  Verify component tests preserve a seeded create draft across opening,
  changing, saving, and leaving each excluded flow.
- [ ] 4.2 Bind the note draft session only after final form/identity readiness,
  and after fresh owner data for edits. Capture raw fields, tags, ordered
  copyable fields, and collection selections; rebuild arrays on restore.
  Verify component tests cover async hydration, invalid rows, selected
  collections, accepted AI changes, and unchanged resource validation.
- [ ] 4.3 Suspend drafting before notebook-generated form patches and retain
  that exclusion through the editor visit. Verify component tests cover upload,
  removal, notebook save, and preservation of the earlier Markdown draft.
- [ ] 4.4 Integrate create/update success cleanup before secondary side effects,
  and retain drafts on failure. Verify tests preserve other entry/create slots,
  unresolved offers, conflicting drafts, and newer detected tab revisions.

## 5. Bookmark editor integration

- [ ] 5.1 Classify blank-start bookmark creates and owner edits; exclude
  prefilled/capture, clone/copy, and other-owner editing. Verify component
  tests preserve seeded drafts through all excluded lifecycle paths, including
  successful saves and later clearing of prefilled controls.
- [ ] 5.2 Add lifecycle teardown for draft-related subscriptions and integrate
  snapshots including tags, copyable fields, visibility, dates, read-later,
  pinned, and collection choices. Verify component tests restore raw values,
  derived display state, and incomplete inputs without changing save validation.
- [ ] 5.3 Notify autosave after metadata/AI patches and protect restored content
  from new or in-flight scraping responses. Verify delayed-response tests show
  restoration is stable and a subsequent user URL change still works normally.
- [ ] 5.4 Integrate create/update success and error paths with scoped cleanup.
  Verify tests cover error-driven navigation, failures in secondary store or
  collection updates, unresolved offers, and preservation of unrelated drafts.

## 6. Cross-feature verification

- [ ] 6.1 Extend existing real-template Karma/Jasmine fixtures, following
  `shared/tags/tag-editors.spec.ts` and copyable-field tests. Run the selected
  draft, editor, privacy, tagging, and copyable-field suites in ChromeHeadless;
  verify both supported editors and excluded flows pass.
- [ ] 6.2 Exercise multiple edit drafts plus both create slots in a browser.
  Verify each restores only in its matching editor, saving/discarding one
  preserves others, and a prefilled extension flow never clears a create draft.
- [ ] 6.3 Exercise navigation inside the debounce window, reload, cache-version
  invalidation, server-change conflicts, two same-entry tabs, logout, and
  consent withdrawal. Verify the observable scenarios in the delta spec and
  confirm the UI does not promise atomic multi-tab or server concurrency.
- [ ] 6.4 Run scoped ESLint on changed UI TypeScript and a production build.
  Verify successful checks, no API/model changes, and no unrelated generated
  artifacts are included in the implementation diff.
