## 1. HTML generator (codever-ui)

- [ ] 1.1 Add a pure `toNetscapeBookmarksHtml(bookmarks, collections,
      options, exportDate)` utility producing the Netscape header, the
      `Codever export <YYYY-MM-DD>` root and `Collections`, `Tags`, `All`
      folders in that order; verify with Vitest that the structure and
      order match and empty folders (except `All`) are omitted
- [ ] 1.2 Implement link rendering with `HREF`, `ADD_DATE`,
      `LAST_MODIFIED` (epoch seconds) and `TAGS` (all tags), no
      description; verify with Vitest
- [ ] 1.3 Implement collection folders (sorted by name, bookmarks only,
      notes and notes-only collections skipped, bookmark repeated per
      collection); verify with Vitest
- [ ] 1.4 Implement top-N tag selection (count desc, name asc tie-break,
      folders sorted by name, unlimited option); verify with Vitest for
      default 50, a custom N, ties and "all tags"
- [ ] 1.5 Implement escaping of names, URLs, tags and collection names and
      skipping of `javascript:` / `data:` locations, returning the
      skipped count; verify with Vitest using markup characters and
      script URLs

## 2. Export dialog (codever-ui)

- [ ] 2.1 Create the bookmarks export dialog with format choice (Codever
      JSON | Browser HTML), tag folder cap (default 50, "all tags") and
      the explanatory text from the spec; verify with a component spec
- [ ] 2.2 Wire `UserBookmarksComponent` export to load all bookmarks and
      all collection pages without localStorage caching, show a busy
      state, build the chosen file and filename
      (`codever-bookmarks_<ISO>.html` or the existing JSON name), report
      skipped bookmarks and handle the no-bookmarks case; verify with a
      component spec and that the JSON export is byte-identical to before
- [ ] 2.3 Keep the notes export on the existing backup dialog; verify the
      notes export still downloads JSON manually
- [ ] 2.4 Run `npm run lint`, `npm test` and `npm run build` in
      `apps/codever-ui`; verify all pass

## 3. Importer round-trip (codever-api)

- [ ] 3.1 Refactor `browser-bookmarks-import.service.js` to parse all
      links first and group them by location (tag union, first name
      wins), then persist once per distinct location with awaited saves;
      verify with a new `browser-bookmarks-import.service.test.js` that a
      URL repeated in one file creates one bookmark with merged tags and
      counts are per distinct location
- [ ] 3.2 Add Codever export root detection (`/^codever export/i`, any
      depth) and tag mapping (`TAGS` first, else `Tags/<tag>`, otherwise
      none; outer and structural folders ignored); verify with unit tests
      for direct re-import, Chrome re-export without `TAGS`, collection
      folders and a renamed root
- [ ] 3.3 Verify generic imports are unchanged (folder tags, excluded
      browser roots, `imported-browser`, public-merge rule) with unit
      tests, then run `npm test` in `apps/codever-api`
- [ ] 3.4 Update the upload endpoint description in
      `apps/codever-api/docs/openapi/openapi.yaml` to mention Codever
      export handling; verify `/api/docs` renders it

## 4. Documentation and end-to-end check

- [ ] 4.1 Update the bookmarks how-to page (Export section) to describe
      the browser HTML format, folder layout, tag cap and re-import
      behaviour; verify by viewing `/howto/bookmarks`
- [ ] 4.2 Manually export as browser HTML, import into Chrome or Brave,
      re-export from the browser and import into a test Codever account;
      verify folders appear in the browser and tags come back without
      structural folder tags
