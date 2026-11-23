## Why

A logged-in user who opens a note or bookmark through a sharing link has no
way to keep it: the shared pages offer no "Copy to mine", although public
notes and bookmarks do. The sharing dialog already tells owners that anyone
with the link can read and copy the content, so the missing button is a gap,
not a policy.

Today the shared note page reuses the note details view with every action,
including "Copy to mine", hidden for shared views. The shared bookmark page
shows read-only content without any action. The copy pages
(`/my-notes/:id/copy-to-mine`, `/my-bookmarks/:id/copy-to-mine`) can also
only reload public entries, so a private shared entry cannot be copied after
a page reload.

## What Changes

- The shared note page (`/notes/shared/:token`) and the shared bookmark page
  (`/bookmarks/shared/:token`) show a "Copy to mine" button to logged-in
  users.
- The button opens the existing copy form, prefilled with the shared
  content (including copyable fields and notebook source). The copy is
  private, belongs to the logged-in user and has no link to the original or
  its sharing link. The copied note keeps its title; the "CLONE - "
  prefix stays for cloning only, also for copies of public notes.
- The sharing token is never added to the copy page URL or stored in the
  browser; the shared content is handed to the copy page in memory only.
- When the copy page has no content to show (for example after a reload of
  a private shared entry), it says so and points the user back to the
  sharing link, instead of showing an empty form.
- Logged-out visitors also see "Copy to mine", as an invitation to log in or
  register. It opens the existing "Login / Register" dialog. After logging in
  or registering they come back to the shared page and the copy form opens.
- Logging in from a shared page no longer sends the sharing URL, token
  included, to Keycloak as the return address. The token is kept in the
  browser tab's session storage for the login round trip only and is
  deleted on return; Keycloak gets a token-free return address. This also
  fixes the navbar "Login" button on shared pages, which sends the token to
  Keycloak today.
- No other actions (edit, delete, share, pin, add to collection) are added to
  the shared pages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `resource-sharing`: adds a requirement that recipients can copy a shared
  note or bookmark to their own entries (logged-out recipients after logging
  in or registering), without the token leaving the shared page, and a
  requirement for a token-free login from shared pages. "Credentials are
  server-controlled and kept out of caches" allows the token in the tab's
  session storage during that login round trip only.
- `copyable-entry-fields`: "Clone and copy-to-mine preserve fields" also
  covers entries copied from a sharing link.

## Impact

- App: codever-ui only. No change to codever-api.
- Routes: the public shared pages (`/notes/shared/:token`,
  `/bookmarks/shared/:token`) and the authenticated copy pages under
  `/my-notes` and `/my-bookmarks`, plus a new public return route
  `/shared/continue` used after logging in from a shared page.
- Keycloak: the return address of a login from a shared page changes to
  `/shared/continue`. The local `bookmarks` client accepts any return
  address; a production client with a stricter list must allow it.
- APIs: none changed. The copy is saved with the existing personal create
  endpoints (`POST /api/personal/users/:userId/notes` and `/bookmarks`);
  the shared payloads stay as they are, without owner fields.
- Mongoose models: none.
- Dependencies: none.
