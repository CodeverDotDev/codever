## Why

The dashboard export (`/dashboard/bookmarks`) only produces Codever JSON,
which no browser can import. Users who want to migrate their bookmarks to
Chrome, Brave or Chromium (or keep a browser-readable backup) have no way
to do so, and a file that went through a browser should import back into
Codever without polluting tags.

## What Changes

- Add a "Browser HTML" format to the bookmarks export on the dashboard,
  next to the existing Codever JSON export (which stays the lossless
  backup and is unchanged).
- Generate a Netscape bookmark HTML file (the format Chrome, Brave,
  Chromium, Edge, Firefox and Safari import) containing **all** of the
  user's bookmarks, private and public, under a dated root folder:
  - `Collections/<collection name>/` - bookmarks of each non-empty
    collection (notes are skipped)
  - `Tags/<tag>/` - one folder per tag for the top N tags by bookmark
    count (default 50, adjustable, or all tags); a bookmark appears in
    each of its tag folders
  - `All/` - every exported bookmark exactly once
- Each link carries `ADD_DATE`, `LAST_MODIFIED` and `TAGS` (all tags,
  regardless of the cap). Descriptions are not exported. No
  personal/public folder split.
- Make the browser bookmarks import recognise a Codever export root:
  inside it, tags come from `TAGS` when present, otherwise from the
  folder directly below `Tags/`; structural folders and collection
  folders never become tags; collections are not recreated. Imports
  remain private. Files without a Codever export root import exactly as
  today.

## Capabilities

### New Capabilities

- `browser-bookmarks-export`: exporting a user's bookmarks as a
  browser-importable Netscape bookmark HTML file with collection, tag
  and "all" folders.
- `browser-bookmarks-import`: importing a browser bookmark HTML file,
  including round-trip handling of a Codever export (existing generic
  behaviour is captured as baseline).

### Modified Capabilities

None.

## Impact

- **Apps**: both `codever-ui` and `codever-api`.
- **Routes**: personal (authenticated) routes only. No new endpoint; the
  UI reuses `GET /api/personal/users/:userId/bookmarks` (all bookmarks)
  and the personal collections listing. The existing
  `POST /api/personal/users/:userId/bookmarks/upload` keeps its contract;
  only its import logic changes.
- **codever-ui**: export dialog gains a format choice and tag-folder cap;
  new pure HTML generator utility with Vitest tests; how-to bookmarks
  page updated.
- **codever-api**: `browser-bookmarks-import.service.js` gains Codever
  export detection and tag mapping, with Jest unit tests.
- **Mongoose models**: no schema changes (`Bookmark`, `Collection`
  unchanged).
- **Dependencies**: none added (cheerio already used by the importer).
