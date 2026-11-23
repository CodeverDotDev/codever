## Why

Administrators currently moderate public content one entry at a time, from
ordinary lists, and only for bookmarks: there is no place to see what is
happening on the platform, no way to act on public notes through the admin
API, no record of what an administrator removed, and no undo. Spam in public
notes and bookmarks keeps appearing, so moderation needs a dedicated, safe
workspace.

While exploring this, two defects in the existing admin API surfaced:
`GET /api/admin/bookmarks/:bookmarkId` only requires a login, so any
logged-in user can read any bookmark, private ones included; and the admin
bookmark delete leaves the bookmark id in other users' likes, read-later,
pinned and history lists, unlike the owner's own delete.

## What Changes

- New `/admin` page in **codever-ui**, lazy-loaded and shown only to users
  with the `ROLE_ADMIN` realm role, with three areas:
  - **Overview**: new users, and new bookmarks and notes split into public
    and private, in the last 24 hours, 7 days and 30 days; top tags of
    public bookmarks in the last 7 days; users with the most new public
    entries in the last 7 days.
  - The dashboard never shows private entries, only their total counts, and
    its actions answer 404 for a private entry.
  - **Public content**: latest public bookmarks and notes, plus a search
    with filters for type and owner; per-entry Open, Unpublish and Delete;
    bulk Unpublish and Delete for selected entries, behind one confirmation.
  - **Audit log**: every admin unpublish, delete and restore, newest first,
    with filters for action and type, and a Restore action on deletes.
- **Unpublish** makes a public bookmark or note private. The owner keeps it
  and can make it public again; there is no lock.
- **Delete by an admin** keeps a full copy of the entry for 90 days, so it
  can be restored from the audit log. Restore brings back the entry with its
  original id and dates, but not share links, favorites, likes, pins,
  read-later or history references, which the delete removed.
- Admin delete of bookmarks and notes removes the same references from
  other users as the owner's own delete.
- New admin routes in **codever-api** under `/api/admin` (authenticated,
  `realm:ROLE_ADMIN`; no public or personal routes change):
  overview, public-content list and search, unpublish, note delete, bulk
  moderation, audit log list and restore.
- **Fix**: `GET /api/admin/bookmarks/:bookmarkId` requires `ROLE_ADMIN`.
  Nothing in codever-ui calls it today.
- The older admin bookmark endpoints read, edit and delete only public
  bookmarks: get by id, filter list, full update and delete by URL. Deleting
  all bookmarks of a user is unchanged.
- An "Admin" link in the user menu and in the sidebar under "Dashboard",
  only for administrators.
- Out of scope, planned as a second change: banning users (disabling the
  Keycloak account and unpublishing their content) and deleting users with
  full cleanup of notes, collections, share links and likes.
- Not in this change: notifying owners about moderation, user reports,
  blocked domains, a feedback viewer and a feature-toggle UI.

## Capabilities

### New Capabilities

- `admin-moderation`: the admin dashboard at `/admin`, its access rule, the
  platform overview, finding public bookmarks and notes, unpublish, delete
  with reference cleanup, bulk actions, the audit log and restore from it,
  and the role check for reading any bookmark through the admin API.

### Modified Capabilities

None. `bookmark-quick-delete` keeps its behaviour: admins still delete from
ordinary bookmark lists. Those deletes now also appear in the audit log and
can be restored, which the new capability specifies.

## Impact

- **Apps**: codever-api and codever-ui.
- **APIs** (all under `/api/admin`, `keycloak.protect('realm:ROLE_ADMIN')`):
  - new: `GET /overview`, `GET /public-entries`,
    `PATCH /bookmarks/:bookmarkId/unpublish`, `PATCH /notes/:noteId/unpublish`,
    `DELETE /notes/:noteId`, `POST /moderation/bulk`, `GET /audit-log`,
    `POST /audit-log/:entryId/restore`;
  - changed: `DELETE /bookmarks/:bookmarkId` (audit entry, snapshot, full
    reference cleanup, public only), `GET /bookmarks/:bookmarkId` (role
    check, public only), `GET /bookmarks`, `PUT /bookmarks/:bookmarkId` and
    `DELETE /bookmarks?location=` (public only);
  - documented in `apps/codever-api/docs/openapi/openapi.yaml`.
- **Mongoose models**: new `AdminAuditEntry` (permanent) and
  `AdminDeletedSnapshot` (expires after 90 days through a TTL index).
  `Bookmark`, `Note` and `User` schemas are unchanged.
- **UI**: new lazy `admin` feature module and route; `AuthGuard` sends users
  without a required role to the home page; navigation link; existing
  `AdminService` extended. Admin GETs are not cached in localStorage.
- **Dependencies**: none new.
