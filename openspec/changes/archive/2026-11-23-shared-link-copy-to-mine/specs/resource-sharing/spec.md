## ADDED Requirements

### Requirement: Recipients can copy shared content to their own

The shared note page and the shared bookmark page SHALL show a
"Copy to mine" action to every visitor. For a logged-in user it SHALL open
the copy form prefilled with the shared content: for notes the title
(unchanged, without the "CLONE - " prefix that cloning adds), content,
content type, reference, tags, copyable fields and, for notebook notes,
the notebook source; for bookmarks the name, location, description, tags,
copyable fields, published date, source code URL, language, YouTube
video id and Stack Overflow question id.

Saving the form SHALL create a new private entry owned by the logged-in user
through the existing personal create API. The new entry SHALL NOT reference
the original entry, its owner or its sharing link, and the original entry
and its sharing link SHALL stay unchanged. The action SHALL be shown whether
or not the shared entry is public, and also to the entry's owner, because the
shared content does not identify the owner. An owner copying their own
bookmark SHALL get the same notice as for any bookmark whose URL they have
already saved.

The sharing token SHALL NOT appear in the copy page URL, in any request the
copy flow sends, or in browser storage, apart from the login round trip of
"Token-free login from a shared page". If the copy page is opened without
the shared content available (for example after a reload or from a bookmark
of the copy page), it SHALL load the entry only if it is public; otherwise it
SHALL tell the user that the content is no longer available there and that
they can open the sharing link again, and SHALL NOT show an empty form.

For a logged-out visitor the action SHALL open the "Login required" dialog,
inviting them to log in or register to copy the entry. After logging in or
registering from that dialog, the visitor SHALL return to the same shared
page with the copy form opened, as described in "Token-free login from a
shared page".

#### Scenario: Logged-in user copies a shared private note

- **WHEN** a logged-in user opens an active sharing link to another user's
  private note and chooses "Copy to mine"
- **THEN** the copy form opens prefilled with the note's content and
  its original title
- **AND** saving it creates a private note owned by the logged-in user
- **AND** the original note and its sharing link are unchanged

#### Scenario: Logged-in user copies a shared bookmark

- **WHEN** a logged-in user opens an active sharing link to a bookmark and
  chooses "Copy to mine"
- **THEN** the bookmark copy form opens prefilled with the bookmark
- **AND** saving it creates a private bookmark owned by the logged-in user

#### Scenario: Logged-out visitor is invited to log in or register

- **WHEN** a visitor who is not logged in chooses "Copy to mine" on a shared
  page
- **THEN** the "Login required" dialog offers to log in or register
- **AND** after logging in or registering the visitor is back on the shared
  page with the copy form opened

#### Scenario: Logged-out visitor cancels

- **WHEN** a logged-out visitor cancels the "Login required" dialog
- **THEN** the shared page stays open, read-only and unchanged

#### Scenario: Token stays on the shared page

- **WHEN** a logged-in user goes from a shared page to the copy form and
  saves the copy
- **THEN** neither the copy page URL nor any request of the copy flow
  contains the sharing token

#### Scenario: Copy page reloaded for a private shared entry

- **WHEN** the copy page of a private entry is reloaded after leaving the
  shared page
- **THEN** a message explains that the content is not available and that
  the sharing link can be opened again
- **AND** no empty copy form is shown

#### Scenario: Shared page offers no other actions

- **WHEN** a logged-in user views a shared note or bookmark
- **THEN** no edit, delete, share, pin or add-to-collection action is shown
  for the original entry

### Requirement: Token-free login from a shared page

When a visitor starts a login or registration from a shared page, through
the "Copy to mine" dialog or the navigation "Login" button, the return
address sent to Keycloak SHALL be the token-free `/shared/continue` page. The
sharing token, the resource type and whether the copy form was requested
SHALL be kept in the browser tab's session storage for this round trip only.

`/shared/continue` SHALL read and delete that entry and replace its own
address with the shared page, opening the copy form if it was requested and
the user is logged in. The token SHALL then be validated by the shared API as
on any visit. An entry older than 30 minutes, a malformed entry, or no entry
SHALL lead to the home page, and an expired or malformed entry SHALL be
deleted. The browser history SHALL NOT keep `/shared/continue` as an entry to
go back to.

Logging in from any other page SHALL keep the current return address.

#### Scenario: Login request carries no token

- **WHEN** a logged-out visitor starts a login from a shared page
- **THEN** the request to Keycloak contains `/shared/continue` as the return
  address and no sharing token

#### Scenario: Return after login

- **WHEN** the visitor comes back to `/shared/continue` within 30 minutes
- **THEN** the shared page of the same entry is shown
- **AND** the copy form opens if the visitor started from "Copy to mine"
- **AND** the stored entry is deleted from session storage

#### Scenario: Return without a usable entry

- **WHEN** `/shared/continue` is opened with no stored entry, a malformed one
  or one older than 30 minutes
- **THEN** the home page is shown
- **AND** any stored entry is deleted

#### Scenario: Link revoked during login

- **WHEN** the sharing link is revoked while the visitor is logging in
- **THEN** the return shows "This link is unavailable" and no copy form

#### Scenario: Login from another page

- **WHEN** a visitor logs in from a page that is not a shared page
- **THEN** the return address is that page, as before

## MODIFIED Requirements

### Requirement: Credentials are server-controlled and kept out of caches

Sharing credentials SHALL be generated from at least 256 bits of
cryptographic randomness and SHALL be disclosed only through dedicated
authenticated owner creation/status responses and the URL the owner copies.
Ordinary resource responses, exports, anonymous payloads, and shared listings
SHALL NOT expose credentials. Normal REST create/update requests containing
reserved sharing fields SHALL fail with `ValidationError`/HTTP 400 without
changing content or sharing state. Importing or cloning SHALL not carry
sharing credentials to the new resource.

Sharing API successes and errors SHALL use `Cache-Control: no-store`.
Shared page documents and anonymous sharing responses SHALL use
`Referrer-Policy: no-referrer`; this protection SHALL also hold on client-side
navigation. Tokens and shared payloads SHALL NOT be persisted in browser
application caches or served from offline data caches after revocation. The
only exception is the token kept in the browser tab's session storage during
a login round trip started from a shared page, as defined in "Token-free
login from a shared page"; it SHALL be deleted on return and SHALL NOT be
used to serve content without a new shared API request.
Application/proxy logs and automated telemetry SHALL NOT record raw bearer
tokens in request URLs, referrers, responses, or errors.

#### Scenario: Caller attempts to set a credential through an ordinary edit
- **WHEN** a normal REST resource create/update includes `shareableId` or
  another reserved sharing field
- **THEN** it fails with HTTP 400 and does not modify the credential or content

#### Scenario: Sharing responses bypass persistent caches
- **WHEN** sharing status, content, or an error is returned
- **THEN** the response carries no-store and the UI does not persist it
- **AND** a subsequent revoked-link request cannot display cached content
  as a successful retrieval, including with an installed service worker

#### Scenario: Token appears in request URL or referrer
- **WHEN** an API/page request or its Referer contains a sharing URL
- **THEN** application and proxy logs omit or redact its bearer credential
- **AND** automated telemetry does not transmit the credential

#### Scenario: Outbound navigation from a shared page
- **WHEN** a recipient follows an external link or loads external content
  from the shared page
- **THEN** the browser does not send the shared page URL as a referrer

#### Scenario: Token kept only for the login round trip
- **WHEN** a visitor starts a login from a shared page and returns
- **THEN** the token was kept only in that tab's session storage
- **AND** it is deleted when `/shared/continue` is processed
