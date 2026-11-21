## Why

Users can export their bookmarks as Codever JSON from the dashboard, but
there is no way to load that file back: the import dialog, the upload
endpoint and the importer only accept browser HTML. A JSON export is
therefore not a usable backup, and bookmarks cannot be moved to a new
account without losing descriptions, dates and visibility.

## What Changes

- New Codever JSON restore for bookmarks: the user uploads a file
  produced by the dashboard's Codever JSON export and the bookmarks are
  recreated in the logged-in account.
  - Ownership always goes to the logged-in user; `userId` and
    `userDisplayName` in the file are ignored, which allows moving
    bookmarks to another account.
  - Every restored bookmark gets a new id; likes, share links and
    internal fields from the file are not restored.
  - A bookmark whose URL the account already has is skipped; the
    existing bookmark wins and is not changed (no tag merge).
  - Original creation and update dates are kept.
  - Restored bookmarks are private unless the user ticks "Keep public
    visibility from the file" (off by default).
  - The response reports how many bookmarks were created, skipped as
    duplicates and rejected as invalid.
- Import dialog on the bookmarks dashboard: the user chooses between
  Browser HTML and Codever JSON before picking a file; the file picker
  and the notes in the dialog follow that choice.
- Closing the import dialog without importing no longer causes an error
  on the bookmarks dashboard.
- How-to page (Import tab) and OpenAPI documentation describe the
  restore.

Out of scope:

- Restoring notes. Notebook notes are exported without their notebook
  content, and notes have no natural duplicate key like the bookmark
  URL. Both need decisions in a separate change.
- Restoring collections, likes or usage statistics.
- Any change to the browser HTML import rules.

## Capabilities

### New Capabilities

- `codever-json-bookmarks-import`: restoring bookmarks from a Codever
  JSON export into the logged-in account (ownership, field handling,
  duplicates, visibility, dates, response and errors).

### Modified Capabilities

- `browser-bookmarks-import`: the import dialog offers a format choice
  between Browser HTML and Codever JSON, and closing it without
  importing is harmless.

## Impact

- Apps: both `codever-api` and `codever-ui`.
- Routes: personal (authenticated) routes only. New
  `POST /api/personal/users/:userId/bookmarks/import` with a JSON body,
  protected by `keycloak.protect()` and `UserIdValidator`. The existing
  HTML upload endpoint is unchanged.
- Mongoose models: no schema change. `Bookmark` documents are created
  with explicit `createdAt` / `updatedAt`, so automatic timestamps must
  not overwrite them on this path.
- Limits: the request uses the existing 6 MB JSON body limit; no new
  limit or nginx change.
- Dependencies: none new (showdown is already used for
  `descriptionHtml`).
- UI: import dialog, its spec, the bookmarks dashboard component,
  `UserDataService` (new call), how-to page.
- Docs: `apps/codever-api/docs/openapi/openapi.yaml`.
