## Why

The landing page bundles Feed, History, Pinned, and Read Later as tabs
addressed by `?tab=`, in a fixed order that always opens on Feed. Users who
mostly live in Pinned or History cannot make it their home, and the tabs are
not first-class pages with their own URLs.

## What Changes

- Feed, History, Pinned, and Read Later become individual pages at `/feed`,
  `/history`, `/pinned`, and `/read-later`, each keeping its `?page=`
  pagination and its existing content, empty-state, and logged-out messages.
- The four pages share a tab navigation bar; the active page is highlighted.
- Authenticated users can reorder the tabs by dragging them via a handle.
  The order is saved to the user's data and applies across devices.
- `/` redirects to the first tab in the user's order; anonymous users and
  users without a saved order are redirected to `/feed`.
- **BREAKING** (URL shape): `/?tab=<name>` is no longer the canonical
  address. Legacy `/?tab=feed|history|pinned|read-later` and the old
  `/readlater` path redirect to the new pages. Internal links (About page,
  login redirect, post-save navigation) point to the new pages.
- The public module's existing root routes remain the canonical paths;
  existing `/public/...` URLs redirect to their equivalent root-level paths.
- The stale `/favorites` and `/watched-tags` redirects, which target tabs
  that no longer exist, are removed.
- Out of scope: hiding or adding tabs, keyboard reordering, and a "reset
  order" action.

Affected apps: **codever-ui** and **codever-api**. The new pages are public
routes (logged-out users see the existing login prompts); saving the order
is a personal, authenticated API route.

## Capabilities

### New Capabilities

- `home-tabs`: Landing tabs as individually addressable pages, the
  personal tab order (drag-to-reorder, persistence, validation), the `/`
  redirect to the first tab, and legacy URL redirects.

### Modified Capabilities

None.

## Impact

- **API**: new `PATCH /api/personal/users/:userId/home-tabs` (protected by
  Keycloak and the user-ID validator); `GET` user data returns `homeTabs`.
  OpenAPI spec updated.
- **Mongoose models**: `User` schema gains optional `homeTabs: [String]`.
  Existing documents need no migration; a missing value means the default
  order.
- **UI**: homepage tab group replaced by a routed shell with
  `mat-tab-nav-bar` and four page components; route table in
  `public.module.ts` changes; `UserData` model and `UserDataStore` gain the
  new field and update method; About page links, login `redirectUri`, and
  `save-bookmark-form` navigation updated; Cypress homepage test updated.
- **Dependencies**: none new; uses the already-installed `@angular/cdk`
  drag-drop.
