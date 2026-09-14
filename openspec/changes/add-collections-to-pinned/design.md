## Context

Pinned bookmarks and notes are stored as a flat `pinned: [String]` array on `UserData` (`model/user.js`),
resolved by `getPinnedResources` (`user-data.service.js`) which queries both `Bookmark` and `Note` by `_id`.
The quick-access sidebar (`quick-access-resources.component`) and the Ctrl+P popup (`hot-keys-dialog.component`) both render that resolved list.
Collections live in a separate `Collection` model with `items: [{ resourceId, resourceType }]`
and are already resolvable with populated items via `PersonalCollectionsService.getCollectionById`.
The pinned PATCH endpoint accepts `pinnedBookmarkIds: string[]` and bookmark/note deletion clean up `pinned` via `$pull`.

## Goals / Non-Goals

**Goals:**

- A single, ordered, mixed pinned list containing bookmarks, notes, and collections.
- Ambiguity-free resolution of each pinned id (bare ids can no longer be disambiguated once collections join).
- A one-time migration that preserves existing pinned bookmarks and notes.
- A filterable collection-contents dialog opened from a pinned collection entry.

**Non-Goals:**

- Changing the `readLater`, `history`, `likes`, or `favorites` fields — they remain bare id arrays.
- Making collections `public` or pinning public collections (collections are private today).
- Adding a "pin" toggle to the bookmark/note editor forms; collection pinning happens only on the collections list and collection detail views.
- Cross-user or public collection contents in the dialog.

## Decisions

### 1. Typed pinned entries: `pinned: [{ type, id }]`

Change `UserData.pinned` from `[String]` to a `PinnedEntry` subdocument (`type: 'bookmark' | 'note' | 'collection'`, `id: ObjectId`).

- **Why**: the user wants collections *mixed* with bookmarks and notes in one ordered list.
Bare ids are ambiguous once collections join (an ObjectId cannot say which model it belongs to).
- **Alternatives considered**:
  - *Separate `pinnedCollections` field + merge at render*: zero migration, but mixed ordering would need a third ordering field and the app would maintain three fields where one suffices. Rejected for complexity.
  - *Resolve bare ids across three models*: no schema change, but same-id-across-models is ambiguous. Rejected as fragile.

### 2. Hard cutover, no dual-shape window

The pinned PATCH body and `getPinnedResources` switch to typed entries in a single release, with the migration run as part of the deploy.

- **Why**: user accepted a hard cutover; avoids maintaining parallel parse logic.
- **Migration** classifies every existing bare id as bookmark or note and drops orphans (ids pointing at already-deleted resources).

### 3. Collections returned "light" from the pinned endpoint

`getPinnedResources` returns collections as `{ _id, type: 'collection', name, color, userId }` — no populated items.

- **Why**: pinned resources are fetched for the sidebar and popup, where only name/id are needed; full contents are fetched lazily when the contents dialog opens, keeping the sidebar payload small.
- **Contents dialog** calls `PersonalCollectionsService.getCollectionById` (already returns populated items) or a collection-specific endpoint, reusing the unified name/title/tag filter behavior from `collection-detail`.

### 4. Reuse existing rendering patterns

- Sidebar `QuickAccessResourcesComponent` gains an `isCollection()` discriminator and renders a folder badge with a dialog icon;
navigation uses `router.navigate(['/my-collections', id])`.
- The Ctrl+P popup (`HotKeysDialogComponent`) renders collection entries as a link to `/my-collections/:id`, reusing the same filter pipe.
- Pin/unpin uses the existing `UserDataStore` pinned mutation methods, switched to typed entries.
- The contents dialog is a new `shared/dialog/collection-contents-dialog` component in the shared module (already provides `MatDialogModule`).

### 5. Migration via existing scripted convention

A timestamped script in `apps/codever-api/resources/db-migration/mongodb/` (matching the existing `1716...` search-migration scripts)
classifies each existing pinned id.

- **Batch, not per-user**: gather all pinned ids across all users once, then run two bulk queries
  (`Bookmark.find({ _id: { $in: allIds } })` and `Note.find({ _id: { $in: allIds } })`) to build an
  `id → type` map, then rewrite each user's array from that map. This keeps the whole migration to a
  couple of queries regardless of user count, instead of N×2 per-user lookups.

## Risks / Trade-offs

- **[Breaking API contract]** Old clients sending `pinnedBookmarkIds: string[]` will fail after cutover → Mitigation: deploy API and UI together;
this is a single-deployment personal project, no external clients use this endpoint.
- **[Migration misclassification]** A bare id could theoretically exist in both `Bookmark` and `Note` → Mitigation: check Bookmark first, then Note;
collisions are practically non-existent (Mongo ObjectIds), and typed storage going forward eliminates the ambiguity permanently.
- **[Orphan pinned ids]** Pinned ids pointing at deleted resources are dropped by the migration → Mitigation: acceptable; they are already unreachable entries.
- **[Delete-cleanup coverage]** Bookmark/note deletion must `$pull` typed entries, and collection deletion must also remove the collection from `pinned` → Mitigation: add `$pull: { pinned: { id, type } }` in each delete path.
- **[LocalStorage caching]** The pinned GET response may be cached via `HttpClientLocalStorageService` in some flows;
the changed response shape could serve stale cached data → Mitigation: bump/invalidate the pinned cache key as part of the UI change.

## Migration Plan

1. Run the typed-entry migration script against Mongo (classify existing `pinned` ids → bookmark/note, drop orphans).
2. Deploy the API (schema + endpoints) and UI (typed model + rendering) together.
3. Verify pinned lists render bookmarks, notes, and collections in order, and that bookmark/note/collection deletion cleans up `pinned`.

Rollback: the migration script is not trivially reversible (type info is added, not lost),
so rollback means redeploying the previous API/UI which still read `[String]` — the typed entries would need a reverse migration to bare ids.
Since the user accepted a hard cutover, rollback is via redeploy + reverse script if ever needed.

## Open Questions

_None — all decisions that would change the specs or task breakdown are resolved._
