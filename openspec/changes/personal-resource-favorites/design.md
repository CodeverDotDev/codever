## Context

See `proposal.md` for motivation and `specs/personal-resource-favorites/spec.md`
for the observable contract.

The deprecated bookmark favorites state is stored as string IDs in
`User.favorites`. `UserDataStore` already persists personal state, while the
shared bookmark list and note details components render the relevant resources.
Bookmark and note deletion currently clean different subsets of user references.

## Goals / Non-Goals

**Goals:**

- Preserve existing bookmark favorite IDs and add typed support for notes.
- Validate favorite mutations against the signed-in user's accessible
  resources.
- Clear favorite references across user profiles when resources are deleted.
- Keep the behavior personal and independent from search ranking and public
  Likes.

**Non-Goals:**

- A Favorites tab, page, collection, or search filter.
- Changes to public Like behavior or search ordering.
- A migration that discards or rewrites existing bookmark favorite IDs.

## Decisions

### Keep bookmark and note favorite IDs in separate arrays

Retain `User.favorites` for bookmark IDs and add `User.favoriteNotes` for note
IDs. Mirror these fields in the UI `UserData` model and initialize both for new
profiles. Treat a missing `favoriteNotes` field on an existing profile as an
empty list.

Separate arrays preserve existing bookmark data and distinguish IDs from
different MongoDB collections. A single untyped list would make a resource ID
ambiguous; replacing the existing array with typed objects would require a
data migration.

### Use a protected personal mutation endpoint

Add `PATCH /personal/users/:userId/favorites`, protected by Keycloak and
`UserIdValidator`. Its body identifies `resourceType` (`bookmark` or `note`),
`resourceId`, and the desired boolean `favorite` state. Return the resource
type, ID, and resulting state. Reject invalid input with `ValidationError`
(400);
return `NotFoundError` (404) for a missing resource or another user's private
resource; retain `UseridValidationError` (401) for a user-ID mismatch.

The service checks that the resource is public or owned by the caller, then
uses `$addToSet` or `$pull` on only the caller's corresponding array. This
avoids full-profile writes for each toggle and does not grant access to a
resource. Keep the deprecated GET favorites endpoint unchanged; no UI list
consumes it in this change.

### Render the state in shared resource components

Add the toggle beside the existing per-resource actions in the shared bookmark
list element and note details component. Use the user's loaded profile state to
render an outlined neutral star or filled amber star. On success, update the
local user state from the API response. For guests, retain the visible control
and use the existing login-required dialog pattern without sending a request.

The current user profile GET is not cached in local storage, so no cache
invalidation is needed. Do not change `PersonalSearchService` or search score
merging.

### Clean references in every resource deletion path

Before bulk deletion, collect the affected resource IDs. After deleting, use a
shared user-data cleanup operation with `$pull` to remove bookmark IDs from
`favorites` and note IDs from `favoriteNotes` across all user documents.
Integrate it with personal bookmark deletion by ID, location, or tag;
administrative bookmark deletion by ID, location, or owner; and personal note
deletion. Account removal must also clear references to the account owner's
bookmarks from other users' profiles.

Use the same cleanup for single-resource and bulk paths rather than iterating
through profiles in the UI. Propagate database errors; do not return successful
deletion or favorite responses when the required update fails.

### Keep favorites informational

Favorite state is private to the user and does not change public Like counts.
It is displayed wherever the resource already appears, but does not affect
search ordering. Defer a Favorites-only view or filter to a separate change.

## Risks / Trade-offs

- **[Risk]** Existing profiles may omit `favoriteNotes`.
  **Mitigation:** Treat missing values as empty and initialize the field on
  subsequent profile updates; no migration is needed.
- **[Risk]** Bulk deletion may affect many favorite references.
  **Mitigation:** Collect IDs before deletion and use one `$pull` update per
  resource type across user documents; cover every delete path with API tests.
- **[Risk]** A favorite update and deletion can race.
  **Mitigation:** Use atomic array updates, validate resource availability
  before adding, and ensure deletion cleanup runs after the resource is removed.
- **[Risk]** A resource can be deleted while cleanup is running.
  **Mitigation:** Surface cleanup failures and verify that every supported
  deletion path invokes the same cleanup operation.

## Migration Plan

No data migration is required. Preserve existing bookmark IDs in `favorites`,
add `favoriteNotes` as an empty array for new profiles, and accept it as absent
on existing profiles. Rollback can remove the new UI and `favoriteNotes` field;
existing bookmark favorite IDs remain intact.
