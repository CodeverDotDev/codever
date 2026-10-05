# Copyable fields and source context

Notes and bookmarks may contain an optional ordered `copyableFields` array. Each row has a required `label` and `value`:

- Up to 10 rows are allowed.
- Labels are limited to 100 characters; values to 1,000 characters.
- Both values must be single-line, non-empty text. Surrounding whitespace is trimmed and internal whitespace is preserved.
- Duplicate labels are allowed, and row order is preserved.
- The copy action copies the value only.

Copyable fields inherit the visibility of their parent note or bookmark. They are not encrypted or treated as secret fields. Older clients may omit the property; an omitted property is preserved on update, while an explicit empty array clears it.

## Source context

Notes can also contain structured `origin` metadata supplied by integrations. The web UI displays a separate read-only **Source context** section containing the file basename and project when available. It does not display the full file path or workspace, and those values are not converted into editable copyable fields. Origin metadata is preserved when a note is cloned or copied to the current user's collection.

The first release changes only web UI and personal REST persistence. IntelliJ, VS Code, browser-extension, and MCP input contracts are unchanged; existing origin data is displayed when present.

## Search indexes

Copyable labels and values are included in the existing MongoDB text indexes with weight `1`. Existing primary-field weights remain unchanged, while tags are reduced from `21` to `10`:

- Bookmarks: `name: 13`, `location: 8`, `description: 5`, `tags: 10`, `sourceCodeURL: 3`.
- Notes: `title: 13`, `reference: 3`, `content: 5`, `tags: 10`.

The index migration is `resources/db-migration/mongodb/1791158400000_copyable-fields-text-indexes.js`. Run it with `mongosh` against the intended database. To roll back to the previous weights and remove copyable-field index paths, set `COPYABLE_FIELDS_ROLLBACK=true` before loading the script, for example:

```bash
mongosh "$MONGODB_URI" --eval "COPYABLE_FIELDS_ROLLBACK=true" resources/db-migration/mongodb/1791158400000_copyable-fields-text-indexes.js
```

The script preserves the recognized historical bookmark index name, aborts before changing anything when an unexpected text index is present, and leaves unrelated indexes untouched. MongoDB may aggregate multiple matching tag terms, so these weights do not guarantee that a multi-term title match outranks a result matching the same terms across multiple tags.

