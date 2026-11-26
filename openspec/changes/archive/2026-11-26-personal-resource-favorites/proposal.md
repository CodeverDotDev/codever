## Why

Users need a private way to mark bookmarks and notes they value without
changing community Like counts or search relevance. Deleted resources should
not leave stale favorite references in user profiles.

## What Changes

- Add a private, account-level favorite state for bookmarks and notes.
- Let signed-in users favorite resources they own or can otherwise access,
  including public resources created by other users. Do not expose private
  resources to other users.
- Show a neutral outlined star when inactive and a filled amber star when
  active on bookmark and note cards, search results, and detail views.
- Prompt guests to sign in when they activate the favorite control.
- Keep favorites independent from public bookmark Likes and do not change
  search ordering or relevance.
- Do not add a Favorites tab, page, or search filter in this change.
- Remove favorite references for all users whenever a bookmark or note is
  deleted, including deletion through administrative or bulk paths.

## Capabilities

### New Capabilities

- `personal-resource-favorites`: Private user favorites for bookmarks and notes,
  including toggle behavior and cleanup when resources are deleted.

### Modified Capabilities

None.

## Impact

- **Affected apps:** `codever-api` and `codever-ui`.
- **Routes and authentication:** Favorites use authenticated personal user
  state. Existing authorization rules must prevent changes to another user's
  profile. No public favorite route or public reaction is added.
- **APIs and Mongoose models:** User favorite state currently stores bookmark
  IDs only. The API and `User` model must support bookmark and note references
  and remove those references on every applicable deletion path.
- **UI:** Shared bookmark and note cards, search results, and detail views show
  and toggle the personal favorite state. Guests are prompted to sign in.
- **Search:** Result ranking and ordering remain unchanged.
- **Dependencies:** No new dependencies are expected.
