## Context

See proposal.md for motivation and specs/ for the behaviour contract.

Current state that shapes the approach:

- The dashboard's Codever JSON export is `JSON.stringify` of
  `GET .../users/:userId/bookmarks` (all the user's bookmarks, newest
  first, without `descriptionHtml` and without `select: false` fields
  such as `shareableId`, `lastAccessedAt`, `ownerVisitCount`).
- The HTML import is a multer multipart upload in `user.router.js`
  (`.../bookmarks/upload`) with an HTML-only file filter, handled by
  `browser-bookmarks-import.service.js`.
- Bookmark creation goes through `BookmarkInputValidator`
  (`validateBookmarkInput`, which requires name, location and at least
  one tag and rejects blocked tags) and
  `verifyPublicBookmarkExistenceOnCreation`, which throws
  `PublicBookmarkExistentError` (409) when another public bookmark with
  the same location exists.
- `bookmark-request.mapper.toBookmark` falls back to `req.body.userId`
  and keeps `likeCount` from the body; it is not suitable for untrusted
  file content.
- The `Bookmark` schema uses `timestamps: true` (Mongoose 7.8).
- `app.js` parses JSON bodies up to 6 MB; a larger body raises a
  body-parser error with `status: 413`, which the final error handler
  already returns as HTTP 413.

## Goals / Non-Goals

**Goals:**

- One request restores a whole export file, with per-bookmark outcomes
  counted rather than failing the whole request.
- File content is treated as untrusted input: an allowlist of fields,
  never ownership or ids from the file.
- Leave the HTML import path untouched.
- Shape the service so a later notes restore can follow the same
  pattern.

**Non-Goals:**

- Streaming or background processing of very large files.
- Transactions: bookmarks already created stay created if the request
  fails part-way (see risks).
- Restoring collections, likes, visit counts or last-access dates.

## Decisions

### 1. Separate JSON endpoint in the bookmarks router

`POST /api/personal/users/:userId/bookmarks/import` in
`personal-bookmarks.router.js`, with `keycloak.protect()` then
`UserIdValidator.validateUserId(request)`, calling a new
`codever-json-bookmarks-import.service.js` in `routes/users/bookmarks/`.
Router → Service → Model; no controller layer.

The UI reads and parses the file and sends
`{ bookmarks, keepPublic, userDisplayName }` as JSON.

Alternatives considered:

- Reuse the multipart `.../bookmarks/upload` with a `format` field:
  needs the multer file filter to accept JSON, mixes two parsers in one
  route and touches the HTML path.
- Multipart upload of the `.json` file: multer has no size limit
  configured there; the JSON body limit (6 MB) already exists and is
  enforced by nginx too.

`/import` does not clash with existing routes: the router's other POST
paths are `/`, `/ai-refine` and `/:bookmarkId/owner-visits/inc`.

### 2. Allowlist mapping, not the request mapper

A small `toRestoredBookmark(raw, userId, userDisplayName, keepPublic)`
inside the service builds the document from the allowlisted fields in
the spec, forces `type: 'bookmark'`, `userId` from the path,
`userDisplayName` from the request, `likeCount: 0`, and generates
`descriptionHtml` with showdown, like the mapper does. Non-string values
for string fields are ignored rather than cast.

Validation reuses `BookmarkInputValidator.validateBookmarkInput(userId,
bookmark)`, which also normalises tags and copyable fields, and
`validateNoShareLinkFields` is not needed because share-link fields are
not in the allowlist. A `ValidationError` for one bookmark increments
`inErrorSize` and the loop continues.

Alternative: strip a denylist (`_id`, `likeCount`, …) and pass the rest
through `toBookmark`. Rejected: any future schema field would be
restorable from a file by default.

### 3. Duplicate detection with one query

Before the loop, load the user's existing locations with one query
(`Bookmark.find({ userId }, { location: 1 }).lean()`) into a `Set`.
Each restored or skipped location is added to the set, which also
handles duplicates within the file (first wins; the export is newest
first, so the newest copy is kept).

Locations are compared exactly as stored, the same as the HTML import's
`findOne({ userId, location })`; no URL normalisation.

Alternative: `findOne` per bookmark as in the HTML import. Rejected:
one round trip per bookmark for files with thousands of entries.

### 4. Public bookmarks

With `keepPublic` true and `raw.public === true`, call
`verifyPublicBookmarkExistenceOnCreation`; on
`PublicBookmarkExistentError` set `public: false`, increment
`madePrivateSize` and continue. This covers moving to a new account
while the old account still holds the public bookmark.

Alternative: count it as invalid. Rejected: the user would lose a
bookmark only because of its visibility.

### 5. Keeping the dates

Compute `createdAt` / `updatedAt` per the spec (fallback to the restore
time for missing, unparseable or future dates; `updatedAt` not before
`createdAt`), set them on the document and save with
`bookmark.save({ timestamps: false })` so Mongoose does not overwrite
them. Mongoose 7 supports the per-save `timestamps` option.

Alternative: `insertMany` with `timestamps: false`. Rejected for now:
per-item validation and public checks happen one by one anyway, and
`save` keeps the error handling per bookmark simple.

### 6. Response

`{ created, duplicatesSize, inErrorSize, madePrivateSize }`. `created`
holds the saved documents so the dashboard can update its history and
"last created" lists exactly as after an HTML import.

### 7. UI

- `ImportBookmarksDialogComponent` gets a format radio (`html` default,
  `json`), the `accept` attribute bound to the format
  (`.html,text/html` / `.json,application/json`), the `keepPublic`
  checkbox shown only for JSON, and format-specific notes.
- For JSON the dialog reads the file as text, `JSON.parse`s it, checks
  for an array and shows an inline error otherwise, without a request.
- New `UserDataService.restoreBookmarks(userId, bookmarks, keepPublic,
  userDisplayName)` posting to the new endpoint. It is a POST, so
  `HttpClientLocalStorageService` caching does not apply; no cache keys
  change.
- The result toast and dialog close keep the existing shape; for JSON
  the message adds the made-private count when non-zero.
- `user-bookmarks.component.ts` `importBookmarks()` guards
  `afterClosed` against an empty result before touching
  `result.created`. Restored bookmarks keep old dates, so the existing
  sort by `createdAt` naturally places them among older history.

### Auth impact

The new route uses the standard personal-route guard pair. The file
cannot influence ownership: the only user id used is the validated path
parameter.

## Risks / Trade-offs

- [Request fails part-way, e.g. MongoDB unavailable] → bookmarks
  already saved stay; the error maps to 503 as today. Restoring the same
  file again is safe because existing locations are skipped.
- [Large files are slow: one save per bookmark] → acceptable for the
  6 MB limit (a few thousand bookmarks); the dialog already warns that
  imports can take several seconds.
- [Files over 6 MB are rejected] → the dialog shows the generic error;
  the how-to page mentions the limit so users can split the file.
- [Exact location match misses near-duplicates, e.g. trailing slash] →
  same behaviour as the HTML import; out of scope.
- [A crafted file sets odd field values] → allowlist plus the normal
  bookmark validation; ownership, likes and ids never come from the
  file.

## Migration Plan

No data migration. Deploy API and UI together; the UI only calls the
new endpoint. Rollback: revert both; nothing persisted depends on the
new code.
