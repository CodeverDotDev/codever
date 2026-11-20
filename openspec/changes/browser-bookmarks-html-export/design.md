## Context

See proposal.md for motivation. Current state:

- Export: `UserBookmarksComponent.exportMyBookmarks()` (codever-ui) loads
  all bookmarks via `PersonalBookmarksService.getAllMyBookmarks()`
  (`GET /api/personal/users/:userId/bookmarks`, no `orderBy` returns all,
  newest first), serialises them as JSON and hands a blob URL to
  `BackupBookmarksDialogComponent`, which hardcodes a `.json` filename.
- Collections are listed via `PersonalCollectionsService
  .getUserCollections()` (paginated, default limit 20) and carry
  `items[{resourceId, resourceType}]`.
- Import: `POST /:userId/bookmarks/upload` in `user.router.js`
  (`keycloak.protect()` + `validateUserId`) calls
  `browser-bookmarks-import.service.js`, which parses with cheerio, turns
  ancestor `<H3>` folder names into tags and de-duplicates by location
  against the database one link at a time.

There are two realistic round-trip paths that shape the design:

```
Path 1: Codever --html--> Codever           TAGS attribute survives
Path 2: Codever --html--> Chrome/Brave --re-export--> Codever
                                           only folder names survive
```

## Goals / Non-Goals

**Goals:**

- Produce a file every major browser imports, with a predictable layout.
- Make both round-trip paths restore tags without structural-folder
  noise.

**Non-Goals:**

- Ongoing sync with the browser (this is a one-off snapshot).
- Recreating collections or public visibility on import.
- Exporting notes or descriptions (`<DD>`).
- A new API endpoint or server-side export.

## Decisions

### 1. Generate the HTML in codever-ui

A pure function (e.g. `toNetscapeBookmarksHtml(bookmarks, collections,
options, exportDate)` under `core/` or `shared/`) builds the file from
data the UI already loads. The component fetches bookmarks and all
collections (paging `getUserCollections` until a short page, or a large
`limit`), then calls it.

- Why: no API change, trivially unit-testable with Vitest, the JSON
  export already works this way.
- Alternative: `GET .../bookmarks/export?format=html` on the API. Useful
  for MCP/scripts but adds a route, OpenAPI entry and tests for no user
  benefit today. Can be added later by moving the pure function.
- Auth/cache: only existing personal GET endpoints are used, already
  behind `keycloak.protect()` + `validateUserId`. Export fetches MUST NOT
  go through `HttpClientLocalStorageService` caching so the file reflects
  the current state.

### 2. File layout and format

```
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
  <DT><H3 ADD_DATE=.. LAST_MODIFIED=..>Codever export 2026-11-20</H3>
  <DL><p>
    <DT><H3>Collections</H3> <DL><p> <DT><H3>Reading list</H3> ... </DL><p>
    <DT><H3>Tags</H3>        <DL><p> <DT><H3>java</H3> ...         </DL><p>
    <DT><H3>All</H3>         <DL><p> <DT><A HREF=.. ADD_DATE=..
                                     LAST_MODIFIED=.. TAGS="..">name</A>
  </DL><p>
</DL><p>
```

- Single dated root so a browser import lands in one folder and the
  importer has a marker that survives Chrome's re-export (folder names
  are the only thing that does).
- Collections first: the browser-native structure users navigate;
  tags second; `All` last as the complete, duplicate-free list.
- `TAGS` is non-standard but harmless; Firefox and our importer read it,
  Chromium ignores it.
- Filename: `codever-bookmarks_<ISO timestamp>.html`.

### 3. Top-N tag selection

Count exported bookmarks per tag, sort by count desc then name asc, take
N (default 50, dialog input, "all tags" = no limit), then render the
selected folders sorted by name. Deterministic across runs.

- Alternative: minimum bookmarks per tag. Rejected - folder count is
  unpredictable and harder to explain.

### 4. Escaping and URL filtering

Escape `& < > "` in text and attribute values (names, HREF, tags,
collection names). Skip `javascript:` and `data:` locations
(case-insensitive, after trimming) and report the count in the dialog.
Other schemes (http, https, ftp, file, chrome, ...) are exported as is.

### 5. Export dialog

Extend `BackupBookmarksDialogComponent` usage for bookmarks into a small
export dialog with: format (Codever JSON | Browser HTML), and for HTML
the tag folder cap (number, default 50, plus "all tags"). It produces the
blob and filename for the chosen format. The notes export keeps using the
existing dialog unchanged.

### 6. Importer: Codever export mode

In `browser-bookmarks-import.service.js` (Router -> Service -> Model
kept, no controller):

```
for each <A>:
  path = ancestor folder names (outermost first)
  rootIdx = first index where name matches /^codever export/i
  if rootIdx found:
     tags = parse(TAGS) if non-empty
            else path[rootIdx+1]=="Tags" && path[rootIdx+2] ? [that] : []
  else:
     tags = current generic logic
  tags += "imported-browser"
```

Tags taken from `TAGS` or a `Tags/<tag>` folder are kept as written
(they originate from Codever); only the generic path normalises.

### 7. Importer: group by location before persisting

Today each link does `findOne` then `create` or a non-awaited `save()`.
With the export, the same URL appears several times in one file; a
non-awaited save can race the next occurrence's `findOne` and lose tags,
and `duplicatesSize` would count in-file repeats.

Change: parse all links first, group by location (union of tags, first
name wins), then for each distinct location `findOne` → merge and
`await save()`, or `create`. Counts become per distinct location, as
the spec requires. This also fixes the race for generic imports.

## Risks / Trade-offs

- [Root folder renamed by the user] → falls back to generic import;
  documented in the how-to page.
- [Tags outside top N lost on path 2] → `All` keeps every bookmark,
  `TAGS` keeps all tags on path 1; dialog text explains the cap.
- [Duplicates in the browser (tag + collection + All)] → inherent to the
  chosen layout; `All` gives a clean base to reorganise from.
- [Large accounts: many collections fetched in pages] → acceptable for an
  explicit user action; show a spinner while preparing.
- [Re-importing into a browser creates a second copy] → one-off snapshot,
  stated in the dialog / how-to.

## Migration Plan

No data migration. UI and API changes are independent: the new importer
handles old browser files exactly as before, and the export works with
the old importer (with folder-name tag noise) if deployed first. Rollback
is a plain revert of either app.
