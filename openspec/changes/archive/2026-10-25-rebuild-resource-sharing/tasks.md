## 1. Sharing model and lifecycle

- [x] 1.1 Add the dedicated ShareLink model with immutable plaintext token,
  owner/resource references, active state, lifecycle dates, and indexes from
  design.md. Verify actual unique/partial index behavior with Mongo-backed
  integration tests and default token exclusion with unit tests.
- [x] 1.2 Implement 32-byte random token generation and owner-scoped
  status/create operations in a shared service. Verify format, inactive
  reads, repeat copying, unchanged visibility, and no writes on GET with
  colocated `*.test.js` tests.
- [x] 1.3 Handle concurrent creation and token collisions with bounded
  retries and explicit conflict errors. Verify concurrent requests converge
  using `*.integration-test.js`, and inject collisions/failures in unit
  tests to prove no unpersisted token is returned.
- [x] 1.4 Implement idempotent revocation by link ID and new-generation
  creation. Verify revoke/recreate, stale revoke, and create/revoke races
  with unit tests and Mongo-backed integration tests.

## 2. Owner API and active-sharing discovery

- [x] 2.1 Mount authenticated sharing routes under the personal user router;
  apply Keycloak protection, user-ID validation, type/ID/body validation, and
  response mapping. Verify 200/201/204 contracts and 400/401/404 denial cases
  for both resource types with integration tests.
- [x] 2.2 Implement combined active-sharing listing with current titles,
  visibility, stable ordering, existence/ownership filtering before paging,
  and accurate counts. Reuse the pagination helper with strict input checks.
  Verify mixed types, foreign data, orphan records, page limits, tie ordering,
  and empty/out-of-range pages with integration tests.
- [x] 2.3 Isolate sharing from ordinary create/update, import, clone, export,
  and response paths; reject reserved REST sharing fields and never copy
  grants. Verify attempts to set/clear legacy or new fields, legacy-field
  projection, and unchanged MCP write behavior with focused regression tests.
- [x] 2.4 Wire single and bulk resource deletion to revoke matching links
  without changing existing deletion cleanup. Verify deleted/orphaned
  resources cannot resolve or appear in listings, including cleanup-failure
  cases, with deletion unit tests and sharing integration tests.

## 3. Anonymous resolution and legacy retirement

- [x] 3.1 Replace bookmark/note public shared lookup with new-link-only
  resolution checking active state, resource type, existence, and owner.
  Verify valid private/public reads and indistinguishable malformed, unknown,
  revoked, wrong-type, legacy, and deleted-resource 404s in integration tests.
- [x] 3.2 Add explicit shared response mappers implementing the exact
  allowlists, including copyable fields and conditional notebook source.
  Verify exact response keys and omission of injected future/internal fields
  with mapper unit tests and endpoint integration tests.
- [x] 3.3 Remove legacy create-on-GET handlers and token generation paths
  without deleting existing resources or backfilling tokens. Verify old
  creation routes return 404, retained legacy data never authorizes access,
  and normal public URLs still work with integration tests.
- [x] 3.4 Apply no-store and no-referrer policies to relevant responses,
  including early errors, and sanitize token-bearing failures. Verify
  success, validation, authentication, not-found, and persistence-failure
  headers/bodies with focused API tests.

## 4. Owner dialogs and dashboard

- [x] 4.1 Add typed UI sharing status/list payloads and a shared core service
  using uncached HttpClient calls. Verify paths, methods, response handling,
  and absence of localStorage writes with Vitest HTTP tests.
- [x] 4.2 Replace automatic creation in bookmark/note share dialogs with
  status, explicit Create link, repeat Copy link, and confirmed Stop sharing.
  Keep public URLs separate and show content-disclosure/revocation notices.
  Verify inactive/active/error states, non-owner behavior, clipboard failure,
  and reopening after revocation with Vitest component tests.
- [x] 4.3 Add the lazy Shared by me dashboard tab and `tab=shared` mapping
  without altering existing tab names/legacy navigation. Verify direct-link
  activation and existing dashboard route behavior with Vitest tests.
- [x] 4.4 Add the paginated mixed-resource list with Copy link, authenticated
  Open resource, and Stop sharing. Verify current titles, public badges,
  empty/loading/error states, revocation failure, stale rows, and last-page
  adjustment with Vitest component tests.

## 5. Shared read-only views and browser privacy

- [x] 5.1 Adapt shared bookmark/note views to typed reduced payloads with an
  explicit read-only rendering boundary. Verify signed-out and signed-in
  viewers cannot trigger owner actions/history updates, especially when
  owner fields are absent, with Vitest tests.
- [x] 5.2 Preserve sanitized content rendering, copyable fields, and original
  notebook download; add unavailable-link and retryable-error states. Verify
  HTML/script fixtures, field copying, notebook bytes, and error distinctions
  with focused UI tests and observable browser behavior.
- [x] 5.3 Establish document-level no-referrer protection before shared
  content loads on direct and client-side navigation. Verify external link
  and embedded-resource requests omit the page referrer in browser tests.
- [x] 5.4 Exclude sharing credentials/content from service-worker data caches
  and handle previously cached sharing responses during client cutover.
  Verify with an installed production-build PWA that refresh/offline access
  after revocation cannot return cached shared content as a success.

## 6. Logging, proxy, and operational documentation

- [x] 6.1 Redact share credentials in application request URLs, Referer
  fields, errors, and automated telemetry, covering current and legacy URL
  shapes. Verify captured file/console logs and mocked telemetry contain no
  test token while preserving unrelated diagnostics.
- [x] 6.2 Update nginx shared-page/API logging and header behavior, including
  redirects, SPA fallback, and error logs. Verify configuration with
  `nginx -t`, inspect actual proxy responses, and confirm request/referrer
  fixtures leave no raw tokens in access/error logs.
- [x] 6.3 Update OpenAPI and deployment documentation for owner/public
  contracts, explicit sharing, plaintext-token risk, index provisioning,
  coordinated cutover, and fail-closed rollback. Verify documented examples
  against integration responses and rehearse index/cutover/rollback steps
  locally without restoring old-link access.

## 7. End-to-end acceptance and regressions

- [x] 7.1 Exercise create, close/reopen, repeat copy, anonymous read,
  dashboard revoke, unavailable old URL, and explicit re-share for bookmarks,
  Markdown notes, and notebooks. Verify with Cypress end-to-end coverage
  against local authentication/database services.
- [x] 7.2 Verify ordinary public access survives revocation, private search
  visibility is unchanged, existing old links fail, and cross-owner
  management is denied through the deployed proxy. Record observable
  acceptance results alongside the local integration test run.
- [x] 7.3 Run targeted API unit/integration suites, UI Vitest suites, lint,
  and production build covering changed surfaces. Verify existing notebook
  download, copyable-field, dashboard-navigation, and MCP contracts remain
  passing; expand testing only for failures or shared-component regressions.
