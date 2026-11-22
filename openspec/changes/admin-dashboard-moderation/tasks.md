## 1. Security fix and shared cleanup (codever-api)

- [x] 1.1 Protect `GET /api/admin/bookmarks/:bookmarkId` with
  `realm:ROLE_ADMIN`; verify with an integration test that a non-admin token
  gets 403 and an admin token gets 200
- [x] 1.2 Limit the older admin bookmark endpoints to public bookmarks (get
  by id and update answer 404 for private, filter list always public, delete
  by URL spares private; delete by user unchanged); verify with integration
  tests for each case in `admin.router.integration-test.js`
- [x] 1.3 Extract `common/resource-cleanup.service.js`
  (`cleanupDeletedBookmarks`, `cleanupDeletedNotes`) and use it from the
  personal bookmark and note deletes; verify existing personal delete unit
  and integration tests still pass and new unit tests cover the `$pull`s

## 2. Audit log and snapshots (codever-api)

- [x] 2.1 Add `AdminAuditEntry` and `AdminDeletedSnapshot` models with their
  indexes, including the 90-day TTL index; verify with a model unit test
  that reads `schema.indexes()`, as `share-link.test.js` does
- [x] 2.2 Add `admin-audit.service.js` (record, list with filters and
  `restorable` flag); verify with unit tests for filters, ordering and
  invalid filter values (400)
- [x] 2.3 Add `AdminRestoreConflictError` and map it to 409 in `app.js`;
  verify with a unit test of the error mapping or a restore conflict
  integration test

## 3. Moderation services and routes (codever-api)

- [x] 3.1 Implement unpublish for bookmarks and notes (private or unknown
  id 404 without audit entry, response `{type, id}` only, `updatedAt`
  unchanged); verify with unit tests
- [x] 3.2 Implement admin delete for bookmarks and notes with snapshot,
  shared cleanup and audit entry; switch the existing
  `DELETE /bookmarks/:bookmarkId` to it (private entry 404); verify with
  unit tests and an integration test that another user's read-later and
  history lose the id
- [x] 3.3 Implement restore with the conflict rules from the design
  (made-private fallback, 409 cases, 404 for missing or expired copy);
  verify with unit tests per rule and one integration test that restores a
  deleted bookmark with its original id and dates
- [x] 3.4 Implement bulk moderation (body validation, 1-100 entries,
  per-entry results); verify with unit tests for validation and partial
  failure
- [x] 3.5 Add `GET /public-entries` (latest and search, `type` and `userId`
  filters, owner display names); verify with unit tests and an integration
  test that private entries are never returned
- [x] 3.6 Add `GET /overview` (new users, public and private window counts,
  top tags, most active users by public entries); verify with unit tests on
  seeded dates at the window boundaries and that private entries only change
  the private counts
- [x] 3.7 Wire all routes in `admin.router.js` with
  `keycloak.protect('realm:ROLE_ADMIN')`; verify with an integration test
  that each new route answers 403 for a non-admin token
- [x] 3.8 Document all new and changed routes in `openapi.yaml`; verify the
  spec loads at `/api/docs` without errors

## 4. Admin dashboard (codever-ui)

- [x] 4.1 Make `AuthGuard` redirect to `/` when a required role is missing;
  verify with a Vitest spec for allowed, missing-role and anonymous cases
- [x] 4.2 Add the lazy `admin` module and route with `ROLE_ADMIN`, and the
  "Admin" link in the user menu and in the sidebar under "Dashboard" for
  administrators only; verify with Vitest specs for the route config and
  link visibility and position
- [x] 4.3 Extend `core/admin/admin.service.ts` with the new calls, without
  localStorage caching; verify with Vitest specs using
  `HttpTestingController`
- [x] 4.4 Build the Overview tab; verify with a Vitest spec that renders the
  figures, top tags and most active users from a stubbed response
- [x] 4.5 Build the Public content tab (search, filters, pagination,
  Open/Unpublish/Delete, selection with bulk actions behind one
  confirmation, in-place removal, failure report); verify with Vitest specs
  for confirm, cancel and partial failure
- [x] 4.6 Build the Audit log tab (filters, pagination, Restore only when
  restorable, made-private notice, 409 message); verify with Vitest specs
- [x] 4.7 Run `npm run lint` and `npm run build` in `apps/codever-ui` and
  `npm test` in `apps/codever-api`; verify all pass apart from known
  unrelated failures

## 5. End-to-end check

- [ ] 5.1 With Docker infrastructure and both apps running, log in as an
  administrator and as `mock`: confirm `/admin` access rules, unpublish and
  delete a public test bookmark and note, restore the deletion from the audit
  log, and run one bulk action; verify by observing the dashboard and the
  owner's lists
