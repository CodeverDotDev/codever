## 1. Handoff and login return

- [x] 1.1 Add the root `SharedCopyHandoff` service in `core/` with `put`
  and a one-time `take(type, id)` that returns the content only for a
  matching type and id and then clears it; verify with a Vitest spec
  (match, mismatch, second take returns nothing)
- [x] 1.2 Add the root `SharedLoginReturn` service with `isSharedPage`,
  `remember` and `takeOnce` (sessionStorage, 30-minute limit, entry removed
  on every read); verify with a Vitest spec for shared and other URLs, a
  valid entry, a second read, an expired and a malformed entry
- [x] 1.3 Make `KeycloakServiceWrapper.login` use
  `${APP_HOME_URL}/shared/continue` as return address and remember the
  token on shared pages, and keep the current address elsewhere; let
  `LoginRequiredDialogComponent` pass the copy request; verify with Vitest
  specs that the Keycloak options contain no token on a shared page and are
  unchanged on another page
- [x] 1.4 Add the public `/shared/continue` route with a guard that calls
  `takeOnce` and redirects with `replaceUrl` to the shared page (with the
  copy request in navigation state) or to `/`; verify with a Vitest spec
  for the note, bookmark, copy and no-entry cases

## 2. Shared pages

- [x] 2.1 Show "Copy to mine" on the shared note page to every visitor, with
  no other action: logged in, store the note in the handoff and navigate to
  `/my-notes/:id/copy-to-mine`; logged out, open the login dialog with the
  copy request; open the copy flow once after a return with the copy
  request and clear it; verify with a Vitest spec for logged-in, logged-out,
  the return case, the navigation URL without the token and the absence of
  edit/delete/share/pin/collection actions
- [x] 2.2 Do the same on the shared bookmark page with
  `/my-bookmarks/:id/copy-to-mine`; verify with a Vitest spec for
  logged-in, logged-out, the return case and the navigation URL without the
  token

## 3. Copy pages

- [x] 3.1 Load the note copy page from `history.state`, then the handoff,
  then the public note by id, and show the "not available, open the sharing
  link again" message instead of the form when that fails; verify with a
  Vitest spec for each source and the failure message
- [x] 3.2 Do the same for the bookmark copy page; verify with a Vitest spec
  for each source and the failure message
- [x] 3.3 Check that a copied shared note and bookmark keep copyable fields
  in order, save as private for the logged-in user and drop the original
  `_id`; verify with Vitest specs of the note editor and bookmark form in
  copy mode using shared payloads (no `userId`, no `public`)

- [x] 3.4 Keep the original note title when copying to mine (the note
  editor adds "CLONE - " only for a plain clone, also for copies from public
  notes); verify with a Vitest spec for a copy and for a plain clone

## 4. Checks

- [x] 4.1 Run the UI lint, the full Vitest suite and the build; verify they
  pass without new errors
- [x] 4.2 With both apps running, as another logged-in user open sharing
  links to a private note and a private bookmark of `mock` and copy both;
  confirm the copies are private and owned by that user and that no request
  of the copy flow carries the token (browser network tab); verify by
  observation
- [x] 4.3 Logged out, open a sharing link, choose "Copy to mine", then log in
  (and once register a new user); confirm the Keycloak request has
  `/shared/continue` as `redirect_uri` without the token, that the shared
  page comes back with the copy form open, and that session storage no
  longer holds the entry; verify by observation
