## Why

Collections are currently only reachable from the My Collections page, so users can't surface their most-used collections in the quick-access pinned list the way they can with bookmarks and notes. This makes collections a second-class citizen and slows down a common workflow.

## What Changes

- Users can pin and unpin a collection from the My Collections page and from the collection detail page.
- Pinned collections appear in the quick-access pinned list **mixed in** with pinned bookmarks and notes, in a single reorderable list.
- Clicking a pinned collection navigates to its collection detail page (`/my-collections/:id`).
- A dialog icon on each pinned collection opens a filterable Angular Material dialog showing the collection's bookmarks and notes.
- Pinned collections also appear in the Ctrl+P quick-access popup, mixed with pinned bookmarks and notes.
- **BREAKING**: the `pinned` user-data field changes from an array of bare resource IDs to an array of typed entries (`{ type, id }`), so bookmark, note, and collection IDs can coexist without ambiguity. A one-time migration classifies existing pinned IDs.

## Capabilities

### New Capabilities

- `pinned-collections`: pinning collections, showing them in quick access alongside bookmarks and notes,
navigating to them, and browsing their contents in a filterable dialog.

### Modified Capabilities

_None. No existing capability's requirements change._

## Impact

- **Apps**: `codever-api` and `codever-ui`.
- **Routes**: personal (authenticated) routes only — `GET /api/personal/users/:userId/pinned` and `PATCH /api/personal/users/:userId/pinned`.
- **Mongoose models**: `User.pinned` changes from `[String]` to typed `PinnedEntry` subdocuments; `Collection` is newly resolved by the pinned lookup.
- **APIs**: the pinned PATCH request body changes from `pinnedBookmarkIds` (string array) to typed entries;
the pinned GET response may now include collection entries.
- **Migration**: new timestamped script under `apps/codever-api/resources/db-migration/mongodb/` classifies existing bare pinned IDs as bookmark or note.
- **Dependencies**: no new dependencies.
