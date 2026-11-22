## Purpose

Gives administrators a dashboard at `/admin` to watch recent platform
activity and to moderate public bookmarks and notes safely: unpublish or
delete them one by one or in bulk, see every moderation action in an audit
log, and restore entries deleted by mistake.

## ADDED Requirements

### Requirement: Admin-only access

The system SHALL show the admin dashboard at `/admin` only to logged-in
users with the `ROLE_ADMIN` realm role, and SHALL show an "Admin" link only
to those users, both in the user menu and in the sidebar directly under
"Dashboard". Every admin API endpoint in this capability
SHALL reject a request without a valid token or without the `ROLE_ADMIN`
realm role with HTTP 403 and SHALL NOT change any data.

#### Scenario: Administrator opens the dashboard

- **WHEN** a logged-in user with `ROLE_ADMIN` opens `/admin`
- **THEN** the admin dashboard is shown with the Overview, Public content and
  Audit log areas

#### Scenario: Anonymous visitor opens the dashboard

- **WHEN** a visitor who is not logged in opens `/admin`
- **THEN** the visitor is sent to the login page
- **AND** returns to `/admin` after logging in

#### Scenario: Regular user opens the dashboard

- **WHEN** a logged-in user without `ROLE_ADMIN` opens `/admin`
- **THEN** the user is sent to the home page and the dashboard is not shown

#### Scenario: Admin link visibility

- **WHEN** a logged-in user without `ROLE_ADMIN` views the user menu and the
  sidebar
- **THEN** no "Admin" link is shown
- **AND** a user with `ROLE_ADMIN` sees an "Admin" link to `/admin` in the
  user menu and in the sidebar directly under "Dashboard"

#### Scenario: Admin API called without the role

- **WHEN** a request without a token, or with the token of a user without
  `ROLE_ADMIN`, calls any admin endpoint of this capability
- **THEN** the API responds with HTTP 403 and no data is read or changed

### Requirement: Admin bookmark API covers public bookmarks only

The existing admin bookmark endpoints SHALL require the `ROLE_ADMIN` realm
role and SHALL read, change or delete only public bookmarks:

- `GET /api/admin/bookmarks/:bookmarkId` SHALL respond with HTTP 403 to
  callers without the role, and with HTTP 404 when the bookmark does not
  exist or is private;
- `GET /api/admin/bookmarks` SHALL return only public bookmarks, whatever
  its `public` query parameter says;
- `PUT /api/admin/bookmarks/:bookmarkId` SHALL respond with HTTP 404 and
  change nothing when the bookmark is private;
- `DELETE /api/admin/bookmarks?location=` SHALL delete only the public
  bookmarks with that URL and leave private ones unchanged.

`DELETE /api/admin/bookmarks?userId=` SHALL keep deleting all bookmarks of
that user; it returns no bookmark data.

#### Scenario: Regular user reads a private bookmark through the admin API

- **WHEN** a logged-in user without `ROLE_ADMIN` requests
  `GET /api/admin/bookmarks/:bookmarkId` for another user's private bookmark
- **THEN** the API responds with HTTP 403 and returns no bookmark data

#### Scenario: Administrator reads a public bookmark

- **WHEN** an administrator requests `GET /api/admin/bookmarks/:bookmarkId`
  for an existing public bookmark
- **THEN** the API responds with HTTP 200 and the bookmark

#### Scenario: Administrator requests a private bookmark

- **WHEN** an administrator requests `GET /api/admin/bookmarks/:bookmarkId`
  for a private bookmark
- **THEN** the API responds with HTTP 404 and returns no bookmark data

#### Scenario: Filter without the public parameter

- **WHEN** an administrator requests `GET /api/admin/bookmarks?userId=...`
  without `public=true` for a user with public and private bookmarks
- **THEN** only that user's public bookmarks are returned

#### Scenario: Administrator edits a private bookmark

- **WHEN** an administrator sends `PUT /api/admin/bookmarks/:bookmarkId` for
  a private bookmark
- **THEN** the API responds with HTTP 404 and the bookmark is unchanged

#### Scenario: Delete by URL spares private copies

- **WHEN** an administrator deletes bookmarks by a URL that two users saved
  as public and one user saved as private
- **THEN** the two public bookmarks are deleted and the private one remains

### Requirement: Platform overview

The admin dashboard SHALL show an overview of recent activity, served by
`GET /api/admin/overview` with HTTP 200:

- the number of new users, and of new bookmarks and new notes split into
  public and private, created in the last 24 hours, 7 days and 30 days;
- the 10 most used tags of public bookmarks created in the last 7 days, with
  their counts;
- the 10 users who created the most public bookmarks and notes in the last
  7 days, with their display name and the number of public entries created.

The overview SHALL count from the current server time at the moment of the
request. Private bookmarks and notes SHALL appear only as these totals per
window; no figure SHALL be broken down by user, tag or any other property of
private entries.

#### Scenario: Overview counts recent public activity

- **WHEN** an administrator opens the dashboard after 3 users signed up and
  5 bookmarks, 2 of them public, were created in the last 24 hours
- **THEN** the 24-hour figures show 3 new users, 2 new public bookmarks and
  3 new private bookmarks
- **AND** no title, URL, tag or owner of the private bookmarks is shown

#### Scenario: Entries older than a window are not counted

- **WHEN** a public note was created 10 days ago
- **THEN** it is counted in the 30-day figures and not in the 24-hour or
  7-day figures

#### Scenario: Most active users point to likely spam

- **WHEN** one user created 40 public bookmarks in the last 7 days
- **THEN** that user appears in the most active users list with 40 public
  entries created

#### Scenario: Private activity does not make a user most active

- **WHEN** a user created 100 private notes and no public entries in the
  last 7 days
- **THEN** that user does not appear in the most active users list

### Requirement: No insight into private entries

The admin dashboard SHALL NOT show the title, content, URL, tags or owner
of any private bookmark or note, and the admin endpoints it uses SHALL NOT
return them. The only information about private entries SHALL be the
overview's total counts per time window. Admin actions on a single entry
SHALL respond to a private entry in the same way as to an unknown id,
except where a requirement below says otherwise.

#### Scenario: Admin acts on a private entry

- **WHEN** an administrator calls unpublish for a note that is private
- **THEN** the API responds with HTTP 404 and returns no note data

### Requirement: Find public bookmarks and notes

The admin dashboard SHALL list public bookmarks and notes of all users,
served by `GET /api/admin/public-entries`, with these optional query
parameters:

- `q`: search text; when present, the results are the entries matching the
  same search as the public search, best matches first; when absent, the
  newest public entries come first;
- `type`: `bookmark`, `note` or `all` (default `all`);
- `userId`: only entries owned by this user;
- `page` and `limit`: pagination, as in other list endpoints.

Each result SHALL include its type, id, title (the bookmark name or note
title), the URL for bookmarks, tags, owner id and display name, and creation
date. Only public entries SHALL be returned. An invalid `type` SHALL be
rejected with HTTP 400.

#### Scenario: Latest public entries

- **WHEN** an administrator opens the Public content area without a search
- **THEN** public bookmarks and notes of all users are listed, newest first
- **AND** private entries are not listed

#### Scenario: Search public entries

- **WHEN** an administrator searches for "casino"
- **THEN** public bookmarks and notes matching "casino" are listed, best
  matches first

#### Scenario: Filter by owner and type

- **WHEN** an administrator filters by a user and by type `note`
- **THEN** only that user's public notes are listed

#### Scenario: Invalid type filter

- **WHEN** `GET /api/admin/public-entries?type=snippet` is requested
- **THEN** the API responds with HTTP 400

### Requirement: Unpublish a public entry

An administrator SHALL be able to unpublish a public bookmark or note, through
`PATCH /api/admin/bookmarks/:bookmarkId/unpublish` or
`PATCH /api/admin/notes/:noteId/unpublish`. Unpublishing SHALL make the entry
private and leave all its other content, its owner and its references
unchanged, and SHALL respond with HTTP 200 with the entry's type and id
only. The owner SHALL be able to make the entry public again. An unknown id,
or an entry that is already private, SHALL respond with HTTP 404 without
changing it and without an audit entry.

#### Scenario: Unpublish a spam note

- **WHEN** an administrator unpublishes a public note
- **THEN** the note is private and no longer appears in public lists or
  public search
- **AND** the owner still has the note with unchanged content

#### Scenario: Owner publishes again

- **WHEN** the owner of an unpublished bookmark makes it public again
- **THEN** the bookmark is public again

#### Scenario: Unpublish an unknown entry

- **WHEN** an administrator unpublishes a bookmark id that does not exist
- **THEN** the API responds with HTTP 404

### Requirement: Delete an entry as administrator

An administrator SHALL be able to delete any public bookmark or note, through
`DELETE /api/admin/bookmarks/:bookmarkId` or `DELETE /api/admin/notes/:noteId`,
which respond with HTTP 204 on success, and with HTTP 404 without deleting
anything for an unknown id or a private entry. An
admin delete SHALL remove the same references as the owner's own delete: it
SHALL revoke the entry's share links, and remove the entry from every user's
favorites, pinned entries and history, and for bookmarks also from likes and
read-later lists.

#### Scenario: Delete a public bookmark

- **WHEN** an administrator deletes a public bookmark
- **THEN** the API responds with HTTP 204
- **AND** the bookmark no longer appears in any list or search

#### Scenario: References of other users are removed

- **WHEN** an administrator deletes a bookmark that another user has in
  their read-later list and history
- **THEN** that user's read-later list and history no longer contain it

#### Scenario: Delete an unknown note

- **WHEN** an administrator deletes a note id that does not exist
- **THEN** the API responds with HTTP 404

#### Scenario: Delete a private bookmark

- **WHEN** an administrator deletes a bookmark that is private, including
  one the administrator unpublished earlier
- **THEN** the API responds with HTTP 404 and the bookmark is unchanged

### Requirement: Bulk moderation

An administrator SHALL be able to select several public entries in the Public
content area and unpublish or delete them in one action, after a single
confirmation that states the action and the number of entries. The API SHALL
offer `POST /api/admin/moderation/bulk` with an `action` (`unpublish` or
`delete`) and a list of 1 to 100 entries given by `type` and `id`. Each entry
SHALL be processed like the single-entry action, independently of the others,
and the API SHALL respond with HTTP 200 and the ids that succeeded and those
that failed with a reason. A missing or unknown action, an empty list, more
than 100 entries, or an entry with an unknown type SHALL be rejected with
HTTP 400 before any entry is changed.

#### Scenario: Bulk delete selected spam

- **WHEN** an administrator selects 12 public bookmarks, chooses Delete and
  confirms
- **THEN** the 12 bookmarks are deleted
- **AND** they disappear from the list without reloading the page

#### Scenario: Cancel a bulk action

- **WHEN** an administrator chooses a bulk action and cancels the
  confirmation
- **THEN** no entry is changed

#### Scenario: Partial failure

- **WHEN** a bulk delete includes an entry that another administrator has
  already deleted
- **THEN** the other entries are deleted
- **AND** the response and the dashboard report that entry as failed because
  it was not found

#### Scenario: Too many entries

- **WHEN** a bulk request lists 101 entries
- **THEN** the API responds with HTTP 400 and no entry is changed

### Requirement: Audit log of admin actions

The system SHALL record an audit entry for every unpublish, delete and
restore done through the admin API, including deletes started from ordinary
bookmark lists, with the time, the administrator's id and display name, the
action, the entry type and id, the owner id, and the entry's title and, for
bookmarks, URL. Audit entries SHALL be kept permanently and SHALL NOT be
changed by later actions except to mark a delete as restored. The dashboard
SHALL list them through `GET /api/admin/audit-log`, newest first, paginated,
with optional `action` and `type` filters; an unknown filter value SHALL be
rejected with HTTP 400.

#### Scenario: Unpublish is logged

- **WHEN** an administrator unpublishes a note
- **THEN** the audit log shows an unpublish entry with the administrator,
  the note title, its owner and the time

#### Scenario: Delete from an ordinary list is logged

- **WHEN** an administrator deletes another user's bookmark from search
  results
- **THEN** the audit log shows a delete entry for that bookmark

#### Scenario: Filter the audit log

- **WHEN** an administrator filters the audit log by action `delete` and
  type `note`
- **THEN** only note deletes are listed, newest first

### Requirement: Restore a deleted entry

For 90 days after an admin delete, the system SHALL keep a full copy of the
deleted entry, and the audit log SHALL offer Restore on that delete. Restore,
through `POST /api/admin/audit-log/:entryId/restore`, SHALL re-create the
entry with its original id, owner, content, visibility and dates, SHALL mark
the delete as restored, SHALL record a restore audit entry, and SHALL respond
with HTTP 201 and the restored entry. Restore SHALL NOT bring back share
links, favorites, likes, pins, read-later or history references.

- If a public bookmark with the same URL now exists for another user, the
  bookmark SHALL be restored as private and the response SHALL say so.
- The API SHALL respond with HTTP 409 and restore nothing when the owner
  already has a bookmark with the same URL again, when an entry with the
  same id exists, when the owner no longer exists, or when the delete was
  already restored.
- The API SHALL respond with HTTP 404 when the audit entry does not exist,
  is not a delete, or its copy is older than 90 days; the audit log SHALL NOT
  offer Restore in these cases.

#### Scenario: Restore a mistaken delete

- **WHEN** an administrator restores a bookmark deleted 3 days ago
- **THEN** the bookmark exists again with its original id, owner, content,
  visibility, and creation and update dates
- **AND** the audit log shows the delete as restored and a new restore entry

#### Scenario: Restored as private because the URL is public elsewhere

- **WHEN** an administrator restores a public bookmark whose URL another
  user has meanwhile saved as public
- **THEN** the bookmark is restored as private
- **AND** the dashboard tells the administrator it was restored as private

#### Scenario: Owner saved the URL again

- **WHEN** an administrator restores a bookmark whose owner has since saved
  the same URL again
- **THEN** the API responds with HTTP 409 and the owner's newer bookmark is
  unchanged

#### Scenario: Restore twice

- **WHEN** an administrator restores a delete that was already restored
- **THEN** the API responds with HTTP 409

#### Scenario: Copy expired

- **WHEN** an audit entry is for a delete made more than 90 days ago
- **THEN** the audit log shows no Restore action for it
- **AND** a restore request for it responds with HTTP 404

#### Scenario: References stay removed

- **WHEN** a restored bookmark had been in another user's read-later list
  before the delete
- **THEN** it is not in that user's read-later list after the restore
