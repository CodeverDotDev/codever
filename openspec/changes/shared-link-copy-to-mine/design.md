## Context

See proposal.md for the motivation. Relevant current state in codever-ui:

- `/notes/shared/:token` renders `ShareableNoteDetailsComponent`, which
  reuses `NoteDetailsComponent` with `isSharedView = true`. In that mode the
  component does not load the user id and hides every action, including
  "Copy to mine" (which is also limited to public notes of other users).
- `/bookmarks/shared/:token` renders `ShareableBookmarkDetailsComponent`, a
  read-only card without actions.
- The copy pages `CopyToMineNoteComponent` and
  `CopyToMineBookmarkComponent` read the entry from `history.state` and fall
  back to `GET /api/public/{notes,bookmarks}/:id`, which returns 404 for a
  private entry. A failed load leaves an empty or stuck form.
- The copy forms already save a private copy for the logged-in user through
  the personal create APIs, drop `_id`, keep copyable fields and, for
  bookmarks, warn when the user already saved the URL.
- The shared payloads carry no owner fields (resource-sharing spec), and the
  sharing token must stay out of logs, referrers and browser caches.
- `KeycloakServiceWrapper.login()`, used by the navigation "Login" button and
  the `LoginRequiredDialogComponent`, sends the current router URL as
  `redirectUri`. On a shared page that is `/notes/shared/<token>`, so the
  token reaches Keycloak and any proxy log in front of it today.

No API, model or auth change: the copy uses the existing personal create
routes, which already run `keycloak.protect()` and
`UserIdValidator.validateUserId`.

## Goals / Non-Goals

**Goals:**

- One "Copy to mine" entry point per shared page, reusing the existing copy
  forms.
- The shared content reaches the copy form without the token leaving the
  shared page.

**Non-Goals:**

- Owner detection on shared pages (would need owner data in the shared
  payload, which the disclosure boundary forbids).
- Keeping the shared content (not only the token) across the login.
- Copying through a new API endpoint.

## Decisions

### Hand the shared content over in memory

A small root service, `SharedCopyHandoff`, keeps one pending entry:
`{ type: 'note' | 'bookmark', id, content }`. The shared page stores the
loaded payload there and navigates to `/my-notes/:id/copy-to-mine` or
`/my-bookmarks/:id/copy-to-mine`. The copy page takes the entry once, only
if type and id match, and clears it.

Alternatives considered:

- `history.state`, as the other copy flows use: the browser keeps it in the
  session history across reloads and back navigation, so shared content
  would stay available after the link is revoked. The sharing spec does not
  allow keeping shared payloads in the browser.
- Passing the token as a query parameter and reloading by token on the copy
  page: puts the token into a second URL, the browser history and the
  referrer of every request made from the copy page.

### Copy page load order and failure state

Both copy pages load in this order: `history.state` (existing in-app flows
from public lists), then the handoff, then the public entry by id. If the
public request fails, the page shows a message that the content is not
available here and that the sharing link can be opened again, with a link to
"My notes" or "My bookmarks", instead of an empty form. This also fixes the
stuck form for unknown public ids.

### Show the action to every visitor

`NoteDetailsComponent` gets a separate input for the shared case that shows
only "Copy to mine" and emits a `copyRequested` event; the shared page
handles it. The user id stays unloaded in shared mode, so no other action
can appear. `ShareableBookmarkDetailsComponent` gets the button directly.

Both shared pages handle the click the same way:

- logged in: put the payload in the handoff and navigate to the copy page;
- logged out: open `LoginRequiredDialogComponent` with a copy message and
  `copyAfterLogin: true`, so its login starts the token-free login below.

The owner also sees the button; for bookmarks the existing "already saved"
check of the copy form handles it, for notes it creates a duplicate, as
cloning does.

### Token-free login from shared pages

A root `SharedLoginReturn` service:

- `isSharedPage(url)`: matches `/notes/shared/:token` and
  `/bookmarks/shared/:token` (the same pattern as
  `updateSharedReferrerPolicy`).
- `remember(url, copy)`: writes `{ type, token, copy, savedAt }` to
  `sessionStorage` under one key.
- `takeOnce(now)`: reads and removes the key; returns nothing for a missing,
  malformed or older-than-30-minutes entry.

`KeycloakServiceWrapper.login(options?)` checks the current router URL. On a
shared page it calls `remember` and uses
`${APP_HOME_URL}/shared/continue` as `redirectUri`; elsewhere it keeps the
current behaviour. The navigation button and the dialog both go through it,
so the navbar leak is fixed in one place.

`/shared/continue` is a public route whose guard calls `takeOnce` and
redirects with `replaceUrl: true` to the shared page, or to `/` without an
entry. A guard instead of a component means the route never renders and
never stays in the browser history. When `copy` is set it passes
`{ copy: true }` as navigation state (no token or payload in it); the
shared page opens the copy flow once the entry is loaded and the user is
logged in, then clears that state with `replaceUrl` so a reload does not
reopen the form.

Alternatives considered:

- Token in `redirectUri`: the current behaviour; leaks the token to
  Keycloak and proxies.
- Encrypting or hashing the token in the return address: the app would
  still need a key or a server lookup; more work for no benefit over tab
  storage.
- `localStorage`: shared across tabs and kept after closing the browser;
  `sessionStorage` is per tab and gone with it.
- Keeping the whole payload across the login: shared content would sit in
  browser storage; reloading it by token after return also respects a
  revocation made in the meantime.

Keycloak registration follows the same return address, because the
register link on the Keycloak login page keeps the `redirect_uri`.

### UI caching

The handoff is memory-only. No new GET call is added; the public-by-id
fallback is unchanged and the shared GET stays uncached. The only browser
storage is the login-return entry in `sessionStorage`, removed on return.

## Risks / Trade-offs

- [Content lost on reload of a private copy page] → the page explains it and
  the user can reopen the sharing link; nothing is saved half-way.
- [Owner sees "Copy to mine" on their own shared note] → creates a private
  duplicate, the same as cloning; acceptable without owner data.
- [Login abandoned: the token stays in the tab's session storage] → it is
  gone when the tab closes, ignored and deleted after 30 minutes, and only
  holds a token the visitor already had in that tab's address bar and
  history.
- [Production Keycloak rejects `/shared/continue`] → the `bookmarks` client
  must allow that return address; the local realm accepts any address.
  Check the production client before release.
- [Handoff left over if the user never opens the copy page] → it is only
  read for the matching type and id and is overwritten by the next copy; it
  is gone on page reload.
