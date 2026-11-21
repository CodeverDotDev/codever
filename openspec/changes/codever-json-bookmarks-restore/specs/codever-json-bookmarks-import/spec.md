## Purpose

Lets users restore bookmarks from a Codever JSON export into their
account, as a backup restore or to move bookmarks to another account,
without overwriting bookmarks they already have.

## ADDED Requirements

### Requirement: Restore access

The Codever JSON restore SHALL be available only to the authenticated
owner through `POST /api/personal/users/:userId/bookmarks/import`.

#### Scenario: Unauthenticated request

- **WHEN** the restore endpoint is called without a valid token
- **THEN** the request is rejected with HTTP 401

#### Scenario: Token for another user

- **WHEN** the token's user differs from `:userId`
- **THEN** the request is rejected with HTTP 401
  (`UseridValidationError`)

### Requirement: Restore request

The request body SHALL be JSON with `bookmarks`, the array exactly as
found in a Codever JSON export file, an optional boolean `keepPublic`
(default `false`) and an optional `userDisplayName`. A body whose
`bookmarks` is missing or not an array SHALL be rejected with HTTP 400
(`ValidationError`) and nothing SHALL be created. A body larger than the
API's JSON body limit (6 MB) SHALL be rejected with HTTP 413. An empty
array SHALL succeed with all counts at zero.

#### Scenario: Not a Codever export

- **WHEN** the body is `{ "bookmarks": { "name": "x" } }`
- **THEN** the request is rejected with HTTP 400 and no bookmark is
  created

#### Scenario: Empty export

- **WHEN** the body is `{ "bookmarks": [] }`
- **THEN** the response is HTTP 200 with 0 created, 0 duplicates and
  0 invalid

### Requirement: Restored bookmarks belong to the logged-in user

Every restored bookmark SHALL be owned by `:userId` and SHALL carry the
request's `userDisplayName`. The `userId` and `userDisplayName` values in
the file SHALL be ignored, so a file exported from any account can be
restored into the logged-in account. Each restored bookmark SHALL get a
new id; the file's `_id` SHALL NOT be reused.

#### Scenario: Moving to a new account

- **WHEN** user B restores a file exported by user A, and user A still
  has all those bookmarks
- **THEN** the bookmarks are created for user B with new ids
- **AND** user A's bookmarks are unchanged

#### Scenario: File claims another owner

- **WHEN** a bookmark in the file has `userId` of another user
- **THEN** it is created owned by `:userId`, not by that other user

### Requirement: Restored fields

The system SHALL restore only these fields from each bookmark in the
file: `name`, `location`, `description`, `tags`, `copyableFields`,
`sourceCodeURL`, `publishedOn`, `language`, `youtubeVideoId`,
`stackoverflowQuestionId`, `public` (see visibility), `createdAt` and
`updatedAt` (see dates). All other fields, including `likeCount`,
`shareableId` and `descriptionHtml`, SHALL be ignored. The like count
SHALL start at 0 and the rendered description SHALL be generated from
`description`. Tags and copyable fields SHALL be normalised and
validated as when a bookmark is created in Codever.

#### Scenario: Popular bookmark restored

- **WHEN** a bookmark in the file has `likeCount: 42`
- **THEN** the restored bookmark has a like count of 0

#### Scenario: Description restored

- **WHEN** a bookmark in the file has `description: "**fast** parser"`
  and no `descriptionHtml`
- **THEN** the restored bookmark shows the description rendered from
  that Markdown

### Requirement: Existing bookmarks take precedence

A bookmark in the file whose `location` equals the location of a
bookmark the user already has SHALL be skipped, and the existing
bookmark SHALL NOT be changed (no tag merge, no field update). Within
the file, only the first bookmark with a given location SHALL be
restored; later ones SHALL be skipped. Skipped bookmarks SHALL be
counted as duplicates.

#### Scenario: URL already saved

- **WHEN** the user has a bookmark for `https://example.com` tagged
  `css`, and the file has the same URL tagged `design`
- **THEN** no bookmark is created for that URL
- **AND** the existing bookmark keeps only the tag `css`
- **AND** the response counts 1 duplicate

#### Scenario: Restoring the same file twice

- **WHEN** the user restores a file and then restores it again
- **THEN** the second restore creates 0 bookmarks and counts every
  bookmark as a duplicate

### Requirement: Visibility on restore

When `keepPublic` is false or absent, every restored bookmark SHALL be
private. When `keepPublic` is true, a bookmark marked public in the file
SHALL be restored as public, unless another public bookmark with the
same location already exists in Codever; in that case it SHALL be
restored as private and counted as made private. Bookmarks marked
private in the file SHALL always be restored as private.

#### Scenario: Default restore

- **WHEN** a bookmark is public in the file and `keepPublic` is absent
- **THEN** it is restored as private

#### Scenario: Keep public visibility

- **WHEN** a bookmark is public in the file, `keepPublic` is true and no
  public bookmark with its location exists
- **THEN** it is restored as public

#### Scenario: Old account still has the public bookmark

- **WHEN** `keepPublic` is true and another user already has a public
  bookmark with the same location
- **THEN** the bookmark is restored as private
- **AND** the response counts it as made private

### Requirement: Original dates are kept

The restored bookmark's creation and last-update dates SHALL be the
file's `createdAt` and `updatedAt`. A date that is missing, cannot be
parsed or lies in the future SHALL be replaced by the time of the
restore. An `updatedAt` earlier than the resulting creation date SHALL
be replaced by that creation date.

#### Scenario: Old bookmark keeps its age

- **WHEN** a bookmark in the file has `createdAt` 2021-03-04T10:00:00Z
  and `updatedAt` 2022-01-01T00:00:00Z
- **THEN** the restored bookmark has those creation and update dates
- **AND** it is listed among older bookmarks, not as newly created

#### Scenario: Invalid date

- **WHEN** a bookmark in the file has `createdAt: "yesterday"`
- **THEN** its creation date is the time of the restore

### Requirement: Invalid bookmarks do not stop the restore

A bookmark that fails validation (for example missing `name` or
`location`, no tags, or a blocked tag) SHALL be skipped and counted as
invalid; the other bookmarks SHALL still be restored.

#### Scenario: One broken entry

- **WHEN** the file has three bookmarks and one has no `location`
- **THEN** two bookmarks are created and the response counts 1 invalid

### Requirement: Restore response

A successful restore SHALL respond with HTTP 200 and a JSON body with
`created` (the created bookmarks), `duplicatesSize`, `inErrorSize` and
`madePrivateSize`.

#### Scenario: Mixed result

- **WHEN** a file has 5 bookmarks: 3 new, 1 already saved and 1 without
  a name
- **THEN** the response has 3 bookmarks in `created`,
  `duplicatesSize` 1, `inErrorSize` 1 and `madePrivateSize` 0
