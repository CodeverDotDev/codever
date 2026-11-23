# resource-sharing Specification

## Purpose

Let resource owners repeatedly copy a controlled sharing link, discover what
they have shared, and stop future anonymous access without deleting content
or changing its ordinary public visibility.

## Requirements

### Requirement: Explicit owner-controlled link creation and repeat copying

Owners SHALL be able to explicitly create one active, reusable sharing link
per bookmark or note. Links SHALL grant read-only access to current content,
not a snapshot. Opening sharing controls, checking status, copying a link,
and ordinary resource creation/editing SHALL NOT enable or replace sharing.
Links SHALL have no automatic expiration in this version.

The owner API base SHALL be
`/api/personal/users/:userId/share-links`.
For `resourceType` equal to `bookmark` or `note`:

- `GET /:resourceType/:resourceId` SHALL return HTTP 200 and either
  `{active: false}` or the active status defined below.
- `POST /:resourceType/:resourceId` with an empty body SHALL return HTTP 201
  for a newly created link, or HTTP 200 with the existing active link.

Active status SHALL contain `active: true`, `shareLinkId`, `resourceType`,
`resourceId`, `createdAt`, and `token`. The token SHALL allow the owner to
copy the same frontend URL on later visits.

#### Scenario: Opening controls for an unshared resource
- **WHEN** an owner opens the sharing dialog for their unshared resource
- **THEN** status is inactive and the UI offers Create link
- **AND** no anonymous access is enabled until explicit creation succeeds

#### Scenario: Repeated copying
- **WHEN** an owner creates a link, closes the dialog, and later reopens it
- **THEN** the same URL is available to copy
- **AND** previously distributed copies still work

#### Scenario: Repeated or concurrent creation
- **WHEN** multiple create requests target the same owned resource without
  an intervening revocation
- **THEN** successful responses identify the same active link and token
- **AND** no second active link is created for that resource

#### Scenario: Content changes without link replacement
- **WHEN** an owner edits a shared resource's content or public visibility
- **THEN** its active sharing URL remains unchanged
- **AND** subsequent successful retrievals show the current content

### Requirement: Sharing management is restricted to the authenticated owner

Owner endpoints SHALL require valid authentication and a matching path user.
Resource/link access SHALL be scoped to that owner. Missing authentication
SHALL fail with HTTP 401; a mismatched user SHALL fail with
`UseridValidationError`/HTTP 401. Missing or foreign resources/links SHALL
fail with `NotFoundError`/HTTP 404 without disclosing their details.

Malformed resource/link identifiers, unsupported resource types, nonempty
creation bodies, and invalid owner API inputs SHALL fail with
`ValidationError`/HTTP 400 without changing sharing state.

#### Scenario: Another user attempts management
- **WHEN** an authenticated user requests status, creation, or revocation
  for another user's resource/link under their own user path
- **THEN** the response is HTTP 404 with no token or resource content
- **AND** the other user's sharing state is unchanged

#### Scenario: Missing or mismatched authentication
- **WHEN** a management request lacks authentication or uses another user's
  path instead of the authenticated user's path
- **THEN** the response is HTTP 401 and performs no management action

#### Scenario: Invalid management inputs
- **WHEN** a request selects an unsupported type, malformed ID, or supplies
  fields in the create-link body
- **THEN** the response is `ValidationError`/HTTP 400
- **AND** no link is created or changed

### Requirement: Revocation stops future access without deleting resources

`DELETE /:shareLinkId` under the owner API base SHALL return HTTP 204 after
revoking that owned link. Repeating it for the same owned revoked link SHALL
also return HTTP 204. Subsequent anonymous authorization checks SHALL deny
that URL. The resource and its ordinary visibility SHALL remain unchanged.

Sharing again SHALL require an explicit create action and produce a new
link ID and URL. Revoked URLs SHALL never be reactivated. A revoke request
targeting an earlier link SHALL NOT revoke a later link for the resource.

#### Scenario: Stop sharing from either owner surface
- **WHEN** the owner confirms Stop sharing in the dialog or dashboard
- **THEN** successful revocation removes the item from the active-sharing
  list and makes the dialog inactive on refresh
- **AND** later requests using the old URL receive HTTP 404

#### Scenario: Re-enable sharing
- **WHEN** the owner explicitly creates a link after revocation
- **THEN** a new URL works and the previous URL continues to return HTTP 404
- **AND** reopening the dialog alone would not have enabled sharing

#### Scenario: Delayed revoke targets an old sharing cycle
- **WHEN** a delayed or repeated revoke addresses a previous link after
  the owner has created a new one
- **THEN** the old link stays revoked and the new link remains active

#### Scenario: Revocation cannot recall copies
- **WHEN** a recipient already downloaded content or a request passed its
  authorization check before revocation completed
- **THEN** revocation does not promise to erase or recall that content
- **AND** the owner UI explains that it stops future access through the link

### Requirement: Anonymous access is limited to the associated resource

The anonymous APIs SHALL be
`GET /api/public/bookmarks/shared/:token` and
`GET /api/public/notes/shared/:token`.
An active token for an existing resource still belonging to the sharing
owner SHALL return HTTP 200 with the shared payload, without sign-in.
Tokens SHALL NOT authorize editing or any other owner-only operation.

Malformed, unknown, revoked, legacy, wrong-resource-type, and deleted-resource
tokens SHALL all return a sanitized `NotFoundError`/HTTP 404 that does not
echo credentials or disclose why access is unavailable. The corresponding
frontend page SHALL display "This link is unavailable".

#### Scenario: Recipient opens a private resource
- **WHEN** a signed-out recipient follows an active bookmark or note link
- **THEN** the associated resource is displayed read-only without sign-in
- **AND** the resource is not made publicly discoverable by sharing it

#### Scenario: Invalid or wrong-type link
- **WHEN** a malformed, unknown, revoked, or bookmark token sent to the note
  endpoint is requested
- **THEN** the API returns HTTP 404 with no resource content or raw token
- **AND** the UI presents the unavailable-link message

#### Scenario: Resource deletion
- **WHEN** a shared resource is deleted individually or through a bulk action
- **THEN** later shared requests return HTTP 404
- **AND** the resource is absent from the owner's active-sharing list

#### Scenario: Bearer token does not grant mutation
- **WHEN** a recipient has a valid sharing token but no owner authorization
- **THEN** owner mutation endpoints remain inaccessible
- **AND** the shared view exposes no original-resource mutation controls

### Requirement: Shared content has a fixed disclosure boundary

Shared responses SHALL contain only the following fields when present.

| Resource | Allowed fields |
|---|---|
| Bookmark | `_id`, `type`, `name`, `location`, `description`, `descriptionHtml`, `tags`, `copyableFields`, `publishedOn`, `sourceCodeURL`, `language`, `youtubeVideoId`, `stackoverflowQuestionId`, `createdAt`, `updatedAt` |
| Note | `_id`, `type`, `title`, `content`, `contentType`, `reference`, `tags`, `copyableFields`, `createdAt`, `updatedAt`; `notebookContent` only for notebook notes |

Responses SHALL NOT include owner identifiers, owner display names, structured
origin, initiator, visibility flags, credentials, sharing metadata, counters,
or other unlisted fields. Notebook source, including stored outputs and
internal notebook metadata, SHALL remain available to authorized shared
viewers for rendering and the existing original-notebook download.

Before creating a link, the UI SHALL explain that anyone with it can read
and copy current content, including copyable fields and notebook source when
applicable. Shared rendering SHALL not execute active scripts from content.

#### Scenario: Response does not disclose owner metadata
- **WHEN** a shared resource has owner information, origin metadata, a legacy
  credential, and additional internal fields
- **THEN** the anonymous response excludes every non-allowlisted field
- **AND** the shared UI works without synthesizing owner identity

#### Scenario: Shared notebook preserves download behavior
- **WHEN** a recipient opens an active link to a notebook with stored source
- **THEN** the notebook renders and the original `.ipynb` download is offered
- **AND** a Markdown note response does not include notebook source

#### Scenario: Shared copyable fields remain usable
- **WHEN** a shared resource contains ordered copyable fields
- **THEN** the fields render in that order and their values can be copied
- **AND** structured private origin metadata is not displayed

#### Scenario: Anonymous rendering does not infer ownership
- **WHEN** an anonymous viewer opens a payload with no owner identifier
- **THEN** no edit, delete, pin, favorite, or sharing-management controls
  appear and no owner-history update is submitted

### Requirement: Shared by me lists active resources for the owner

The authenticated dashboard SHALL offer a "Shared by me" tab at
`/dashboard?tab=shared` covering bookmarks and notes. It SHALL show title,
resource type, sharing date, and Copy link, Open resource, and Stop sharing.
Open resource SHALL navigate to the owner's authenticated resource details.

`GET /api/personal/users/:userId/share-links?page=&limit=` SHALL return
HTTP 200 with `{items, page, limit, total}`. Each item SHALL contain only
`shareLinkId`, `resourceType`, `resourceId`, `title`, `public`, and `createdAt`.
Items SHALL include only that owner's active links to existing owned
resources, ordered by sharing date descending with a stable ID tie-breaker.
Titles and visibility SHALL reflect the current resource.

Page SHALL default to 1 and limit to 55. Supplied values SHALL be positive
integers with limit no greater than 55; invalid values SHALL return
`ValidationError`/HTTP 400. An empty or out-of-range page SHALL return an
empty items array with accurate total, not a not-found error.

#### Scenario: Combined active list
- **WHEN** an owner has active links for bookmarks and notes, plus revoked
  links and deleted resources
- **THEN** the dashboard lists only their existing actively shared resources
- **AND** it does not list another owner's resources or expose tokens in
  the listing response

#### Scenario: Copy from dashboard
- **WHEN** an owner selects Copy link for an active row
- **THEN** the current owned link is retrieved and copied without rotation
- **AND** a link revoked elsewhere is not silently recreated

#### Scenario: Empty state and pagination
- **WHEN** an owner has no active shares or revokes the final row on a page
- **THEN** the dashboard refreshes its list/count and presents an appropriate
  empty state or moves to the preceding available page

#### Scenario: Invalid pagination
- **WHEN** page or limit is nonnumeric, fractional, nonpositive, or limit
  exceeds 55
- **THEN** the list API returns `ValidationError`/HTTP 400

### Requirement: Public visibility remains independent of sharing links

Creating or revoking a sharing link SHALL NOT change the resource's public
flag, ordinary public URL, or search visibility. Public-link controls SHALL
distinguish ordinary public URLs from owner-managed revocable links. The UI
SHALL explain that stopping sharing does not make a public resource private.

#### Scenario: Revoke a public resource's special link
- **WHEN** an owner revokes a sharing link for a public resource
- **THEN** that sharing URL returns HTTP 404
- **AND** the ordinary public URL remains accessible

#### Scenario: Private resource stays private in discovery
- **WHEN** an owner creates a sharing link for a private resource
- **THEN** public lists/search do not gain that resource
- **AND** ordinary private-resource authorization remains unchanged

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

### Requirement: Existing sharing links are retired without resource migration

After cutover, old resource-level sharing credentials SHALL NOT authorize
access and SHALL NOT be automatically converted into new links. The old
create-on-GET endpoints SHALL no longer create or return credentials and
SHALL return HTTP 404. Resources and ordinary public URLs SHALL remain
unchanged. Owners SHALL explicitly create new sharing links as needed.

#### Scenario: Stored legacy token remains in a resource
- **WHEN** a recipient requests an old sharing URL after cutover, even if its
  credential remains in stored resource data
- **THEN** the API returns HTTP 404 and no content
- **AND** the resource does not appear in Shared by me without new creation

#### Scenario: Old client calls legacy creation endpoint
- **WHEN** a client requests an old personal `shareable/:resourceId` route
- **THEN** it receives HTTP 404 and no link is created or re-enabled

### Requirement: Failed management actions remain visible as failures

The UI SHALL distinguish loading, inactive, active, unavailable, and request
failure states. Failed status/list requests SHALL NOT be displayed as an
empty sharing state. Failed creation, copying, or revocation SHALL NOT be
reported as successful. Persistence failures SHALL return a sanitized error,
not a usable-looking unpersisted token; exhausted creation conflicts SHALL
return HTTP 409.

#### Scenario: Revocation fails
- **WHEN** the revoke request fails
- **THEN** the UI reports the failure and does not claim sharing stopped
- **AND** it keeps or reloads the row rather than treating it as revoked

#### Scenario: Content retrieval fails for operational reasons
- **WHEN** the API reports a server/network failure instead of not-found
- **THEN** the shared view shows a retryable error rather than falsely
  declaring the link unavailable

#### Scenario: Clipboard or creation fails
- **WHEN** the clipboard write fails or creation cannot persist a link
- **THEN** the UI displays the error without a Copied or creation-success
  indication and without automatically retrying a new sharing cycle

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
