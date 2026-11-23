## Context

See proposal.md for motivation and specs/admin-moderation/spec.md for the
behaviour. Relevant current state:

- `apps/codever-api/src/routes/admin/admin.router.js` is mounted at
  `/api/admin` and builds its own `keycloak-connect` instance. The API is
  `bearer-only`, so a missing token and a missing role both answer 403.
- `admin.service.deleteBookmarkById` revokes share links and removes favorite
  references, but does not `$pull` the id from `User.readLater`, `likes`,
  `pinned` and `history`, as `personal-bookmarks.service.deleteBookmarkById`
  does. There is no admin note endpoint.
- Public search lives in `routes/public/public-search.service.js`
  (`bookmarksSearchService.findPublicBookmarks` plus
  `PublicNotesService.searchPublicNotes`, merged by score).
- `Bookmark` and `Note` use `timestamps: true` and have `select: false`
  fields (`shareableId`, `initiator`, `lastAccessedAt`, `ownerVisitCount`).
- In codever-ui, `AuthGuard` already reads `route.data.roles` but returns
  `false` when a role is missing; no route sets `roles` today. The
  `AdminService` in `core/admin` covers bookmark update and delete only.

## Goals / Non-Goals

**Goals:**

- One admin service layer that both the dashboard and the existing admin
  list actions use, so every admin delete is audited and restorable.
- Admin deletes and owner deletes clean up the same references.

**Non-Goals:**

- Banning or deleting users, and any call to the Keycloak admin API.
- Snippets: they are already served as notes.
- Real-time updates of the dashboard; figures are computed per request.

## Decisions

### API layering

New code follows Router -> Service -> Model, all in
`apps/codever-api/src/routes/admin/`:

```
admin.router.js ----------> admin.service.js          (existing, bookmarks)
  |                    +--> admin-overview.service.js  (aggregations)
  |                    +--> admin-moderation.service.js
  |                    |      unpublish, delete, bulk, restore
  |                    +--> admin-audit.service.js     (record, list)
  v
keycloak.protect('realm:ROLE_ADMIN') on every route
```

The existing `DELETE /bookmarks/:bookmarkId` route calls
`admin-moderation.service.deleteEntry('bookmark', id, admin)` instead of
`AdminService.deleteBookmarkById`. The router reads the administrator from
`request.kauth.grant.access_token.content` (`sub`, `preferred_username` or
`name`) and passes it to the service. No `UserIdValidator` is involved: the
admin routes do not act on the caller's own data.

Validation errors throw `ValidationError` (400), unknown ids
`NotFoundError` (404), and restore conflicts a new `AdminRestoreConflictError`
mapped to 409 in `app.js`, next to `PublicBookmarkExistingError`.

### Shared reference cleanup

Extract the cleanup that runs after a successful delete into
`common/resource-cleanup.service.js` with `cleanupDeletedBookmarks(ids)` and
`cleanupDeletedNotes(ids)` (share-link revoke by resource, favorite
references, the `User.updateMany` `$pull`). The personal and admin deletes
both call it. Alternative: call the personal service with the owner's id
from the admin path. Rejected because it couples the admin path to the
owner check and its 404 semantics.

### Audit log and snapshot are two collections

- `AdminAuditEntry` (`admin_audit_entries`, permanent): `action`
  (`unpublish | delete | restore`), `targetType` (`bookmark | note`),
  `targetId`, `ownerId`, `adminId`, `adminName`, `summary` (`title`,
  `location`), `restoredAt`, `restoreEntryId`, `snapshotId`; `createdAt`
  via timestamps. Index `{ createdAt: -1 }` and
  `{ action: 1, targetType: 1, createdAt: -1 }`.
- `AdminDeletedSnapshot` (`admin_deleted_snapshots`): `targetType`,
  `document` (Mixed, the raw stored document), `deletedAt` with a TTL index
  `expireAfterSeconds: 90 days`.

A TTL index removes whole documents, so keeping the copy in the audit entry
would delete the audit history as well. Two collections keep the log
permanent and let only the copy expire. The audit list joins the snapshot
existence (one `$in` query per page) to return `restorable: boolean`.

### Taking and restoring the snapshot

Delete reads the raw document through `Model.collection.findOne({_id})`, so
`select: false` fields are included, writes the snapshot, deletes the
document, runs the cleanup, then writes the audit entry. Restore inserts the
raw document with `Model.collection.insertOne`, which keeps `_id`,
`createdAt` and `updatedAt` exactly and skips Mongoose middleware.

Restore checks, in order: audit entry is a delete and not restored (else
404 / 409), snapshot exists (else 404), owner `User` exists (409), no
document with the same `_id` (409), for bookmarks the owner has no bookmark
with the same `location` (409), and for public bookmarks
`verifyPublicBookmarkExistenceOnCreation`; on conflict the copy is inserted
with `public: false` and the response has `restoredAsPrivate: true`. After
inserting, the snapshot is deleted and the delete entry gets `restoredAt`.
These steps are not transactional (the deployment has no replica set
requirement today); the `_id` check makes a repeated restore safe.

### Unpublish

`findOneAndUpdate({_id, public: true}, {$set: {public: false}},
{timestamps: false})`, so the owner's `updatedAt` and ordering are not
changed. A `null` result answers 404, whether the entry is missing or
private, so the response never reveals a private entry. The response body is
`{type, id}` only.

### Public-only guard

Unpublish, admin delete, bulk and the public-content list all filter on
`public: true` in the query itself, not after loading the document. Admin
delete reads the snapshot with `findOne({_id, public: true})` and answers
404 for a private entry. Restore only ever re-inserts entries that were
public when deleted. Admin dashboard data therefore never includes private
entries.

The older bookmark functions in `admin.service.js` get the same filter:
`getBookmarkById` and `updateBookmark` query `{_id, public: true}` and throw
`NotFoundError` otherwise; `getBookmarksWithFilter` always sets
`public: true` and the `public` query parameter is ignored;
`deleteBookmarksByLocation` selects `{location, public: true}`.
`deleteBookmarksByUserId` keeps selecting all of the user's bookmarks, since
it returns no content and the planned delete-user change relies on it. The
admin edit in `save-bookmark-form` only opens for bookmarks shown in public
lists, so it is not affected.

### Public content list

`GET /public-entries` without `q` queries `Bookmark` and `Note` with
`{public: true}` (plus `userId`), sorted by `createdAt` desc, and merges both
pages by date; with `q` it calls `getPublicSearchResults` (bookmarks only or
notes only when `type` is set, through the same underlying functions). The
mapper returns `{type, id, title, location, tags, ownerId,
ownerDisplayName, createdAt}`; note owner names come from one `User.find`
by the page's `userId`s. Pagination uses
`PaginationQueryParamsHelper.getPageAndLimit(request)`.

### Overview

Computed per request with `countDocuments` on `createdAt >= now - window`
for `User`, and for `Bookmark` and `Note` with `public: true` and with
`public: false` (missing `public` counts as private), one
`$unwind`/`$group` aggregation for tags, and a `$unionWith` aggregation over
public bookmarks and notes for most active users, joined with `User` for the
display name. Private entries are only ever counted with `countDocuments`;
the tag and most-active aggregations start with `{ public: true }`, so no
private document is loaded. 15 counts plus 2 aggregations per page view is
acceptable for
an admin-only page. An index on `createdAt` for both collections is added
if `explain` shows a collection scan in the integration test database.

### Bulk

`POST /moderation/bulk` validates the whole body first (400), then processes
entries sequentially with the single-entry functions, catching
`NotFoundError` and other errors per entry into `failed[]`. Sequential keeps
the cleanup `updateMany` calls from piling up; 100 entries is the cap.

### UI

- New lazy feature module `apps/codever-ui/src/app/admin/` routed at
  `admin` with `canActivate: [AuthGuard]` and `data: { roles:
  ['ROLE_ADMIN'] }`. Child tabs: `overview` (default), `public-content`,
  `audit-log`.
- `AuthGuard` returns `router.parseUrl('/')` instead of `false` when a
  required role is missing, so a direct load of `/admin` lands on home. No
  existing route uses `roles`, so nothing else changes.
- The user menu shows "Admin" when
  `keycloakService.isUserInRole('ROLE_ADMIN')`, as the bookmark list does.
  The sidebar in `app.component` shows it directly under "Dashboard" when
  `keycloak.hasRealmRole('ROLE_ADMIN')`; the component already injects the
  `Keycloak` instance.
- `core/admin/admin.service.ts` gets the new calls. They use plain
  `HttpClient`, not `HttpClientLocalStorageService`: admin data must always
  be fresh and must not be stored in the browser.
- Confirmations reuse the existing Material confirm dialog pattern used by
  quick delete; toasts use `iziToast` as elsewhere.

### OpenAPI

Every new and changed admin route is documented in
`apps/codever-api/docs/openapi/openapi.yaml` under an `admin` tag.

## Risks / Trade-offs

- [Raw insert skips schema validation] -> the inserted document is exactly
  the one Mongoose stored before; restore never accepts client data.
- [Restore is not atomic] -> each step is idempotent or guarded; a crash
  between insert and marking leaves a restorable-looking entry whose second
  attempt fails with 409 on the `_id` check.
- [Overview cost grows with data] -> admin-only, per request; add
  `createdAt` indexes and cache later if needed.
- [Admin token claims vary] -> fall back from `name` to
  `preferred_username` to `sub` for `adminName`.
- [Snapshots hold private content for 90 days] -> stored only server-side,
  readable only through restore, and removed by TTL.

## Migration Plan

- Deploy API and UI together; no data migration. Mongoose creates the two
  new collections and their indexes on first use (`autoIndex`), including
  the TTL index. In production, verify the TTL index exists with
  `db.admin_deleted_snapshots.getIndexes()`.
- Rollback: redeploy the previous version; the two new collections are
  unused and can be dropped.
