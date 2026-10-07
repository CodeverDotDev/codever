## Why

Technical notes and bookmarks often contain small values that users repeatedly reuse, such as function names, commands, identifiers, and URLs. Today those values must be selected manually from the main content, while source information from future IDE integrations has no dedicated copy-oriented presentation. Adding optional copyable label/value pairs will make these values easier to reuse without turning the main content into a structured form.

## What Changes

- Add optional **Copyable fields** to notes and bookmarks, with up to 10 ordered label/value pairs.
- Require both a non-empty label and value for every saved pair; allow duplicate labels.
- Restrict labels to 100 characters and single-line values to 1,000 characters.
- Display copyable fields after content/description and before tags on list cards and details pages, using existing show-more/show-less behavior.
- Provide a copy action that copies the value only.
- Preserve copyable fields when entries are cloned or copied to the current user.
- Make labels and values searchable with lower relevance than primary entry content through weighted MongoDB text indexes.
- Display available IDE-derived file and project information in a separate read-only **Source context** section without duplicating it into editable copyable fields.
- Start with web UI and personal REST create/update/read support; defer extension payload changes and MCP creation support.
- Expand a list entry automatically when the current list contains exactly one entry; retain collapsed-by-default behavior for lists with multiple entries.

## Capabilities

### New Capabilities

- `copyable-entry-fields`: Optional, searchable, individually copyable label/value fields and read-only source context for notes and bookmarks.

### Modified Capabilities

None.

## Impact

- **Affected applications:** `codever-api` and `codever-ui`.
- **API scope:** Personal authenticated note/bookmark create and update routes must accept and validate copyable fields; read and copy/clone flows must preserve them. Public note/bookmark reads and displays expose the fields according to the parent entry's existing visibility.
- **Mongoose models:** Note and bookmark schemas gain an ordered copyable-field collection; existing note source-origin metadata remains structured and separate.
- **Search:** Existing bookmark and note MongoDB weighted text indexes and their migration/fresh-database initialization must include copyable labels and values with a low weight.
- **Frontend:** Note and bookmark models, editors, list cards, detail views, copy actions, clone/copy-to-mine flows, and single-result expansion behavior are affected.
- **Dependencies:** No new runtime dependency is expected. Existing clipboard, Angular form, REST, MongoDB text-search, and localStorage cache behavior must remain compatible.
- **Deferred integrations:** IntelliJ/VS Code automatic population, browser-extension payloads, and MCP note-creation input are explicitly out of scope for this change.

