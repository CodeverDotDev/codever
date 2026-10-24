## Context

See `proposal.md` for motivation and the agreed first-version scope.

Current personal bookmark/note services generate UUIDs in `shareableId`.
Their GET endpoints create credentials as a side effect, and share dialogs
subscribe when opened. Public services look up those fields and return full
documents, explicitly selecting the credential.

Shared pages reuse normal bookmark/note components. Those components derive
actions from `public` and `userId`, so merely removing fields from responses
is insufficient: shared rendering must have an explicit read-only boundary.
Notes now support copyable fields and notebook downloads; the older action
plan predates some of these surfaces.

The dashboard uses named `tab` query parameters. Shared API calls currently
use plain HttpClient rather than the localStorage wrapper. The PWA config
also has an API data group that must be checked independently. Morgan logs
both combined and development formats, and nginx serves the SPA with fallback
and legacy snippet rewrites.

## Goals / Non-Goals

**Goals**

- Use one shared lifecycle implementation for bookmarks and notes, following
  Router -> Service -> Model without introducing controllers.
- Make link state authoritative on every anonymous retrieval, independently
  of resource visibility and UI state.
- Preserve repeat copying, notebook rendering/download, and copyable fields
  without exposing owner metadata or enabling resource mutation.
- Avoid transactions or new infrastructure as prerequisites for this feature.

**Non-Goals**

- No old-token backfill, snapshots, collection sharing, recipient accounts,
  passwords, or grant to edit the original resource.
- No encryption, hash-only credential storage, session exchange, expiration,
  visit history, multiple active links, or separate rotation endpoint.
- No new MCP sharing tools or changes to ordinary public visibility.
- Dedicated rate limiting/WAF tuning is deferred rather than silently treated
  as completed work from the old audit. Existing protections remain intact.

## Decisions

### 1. Dedicated link records with one active generation per resource

Add `src/model/share-link.js` with:

- `resourceType`: `bookmark` or `note`.
- `resourceId`: the referenced resource ObjectId.
- `ownerUserId`: derived from the authenticated owner.
- `token`: immutable, server-generated, plaintext, excluded by default from
  queries and generic serialization.
- `active`: boolean, initially true.
- `createdAt` and `revokedAt`: lifecycle dates; no access counters.

Create a unique token index across all records and a partial unique compound
index on `(resourceType, resourceId)` where `active: true`. Add an owner/list
index on `(ownerUserId, active, createdAt, _id)`. Establish indexes before
enabling writes; schema declarations alone are not a deployment guarantee.

Revocation updates the addressed link record atomically to inactive. A new
sharing cycle inserts a new record and token. Retaining inactive records
keeps token uniqueness and allows a repeated revoke to be harmless. No
revoked-link history UI is required.

Alternative: one mutable token on each resource. Rejected because it repeats
logic, couples normal editing to sharing, and complicates combined listing.
Alternative: overwrite one shared record on re-enable. Separate generations
make a delayed revoke of an old link unable to revoke a newly created link.

### 2. Plaintext random credentials with narrowly scoped disclosure

Generate 32 cryptographically random bytes using Node's `crypto`, encoded as
43 unpadded base64url characters. Tokens are never supplied by clients.
Use the token's unique index rather than a pre-insert existence check.

Return the raw token only in dedicated authenticated owner create/status
responses. Dashboard listings omit it; Copy link fetches current owner status
on demand. The UI constructs the URL from its configured frontend host and
resource type, not request Host headers.

Reject reserved sharing fields in ordinary REST create/update payloads,
including the old `shareableId`, and exclude persisted legacy fields from
ordinary responses/exports. Audit mapper, import, clone, and service-level
paths so they cannot carry credentials into a new resource or change a grant.
Do not broaden this work into unrelated resource-field validation changes.

Hash-only storage cannot redisplay the same URL. Encryption would preserve
that UX but requires key management the user explicitly deferred. Plaintext
storage is an accepted first-version tradeoff, not encryption at rest.

### 3. Explicit owner API, with no writes on GET

Mount a sharing router under `/api/personal/users/:userId/share-links`.
Every endpoint uses `keycloak.protect()` then
`UserIdValidator.validateUserId(request)` and owner-scoped service queries.
Resolve the resource type using a fixed allowlist, never a dynamic model name.

Paths below are relative to that mount:

| Method and path | Successful result |
|---|---|
| `GET /?page=&limit=` | 200, `{items, page, limit, total}` |
| `GET /:resourceType/:resourceId` | 200, `{active: false}` or active status |
| `POST /:resourceType/:resourceId` | Empty body; 201 for new link, 200 for existing active link |
| `DELETE /:shareLinkId` | 204 for owned active or already revoked link |

Active status/create responses contain only `active: true`, `shareLinkId`,
`resourceType`, `resourceId`, `createdAt`, and `token`. An owner GET for an
existing resource with no active link returns `active: false`, without a
credential. Failed lookups of missing or foreign resources/links return
`NotFoundError`/404. Malformed owner IDs, unsupported types, reserved fields,
and invalid pagination return `ValidationError`/400. Authentication failures
use 401; a mismatched path user uses `UseridValidationError`/401.

Use `PaginationQueryParamsHelper.getPageAndLimit(request)` after validating
supplied page/limit values as positive integers. Default page is 1 and default
limit is the existing maximum of 55; reject limits above that maximum.
List only active links joined to existing resources still owned by that user.
Filter before pagination/counting; order by `createdAt` descending then `_id`
descending. Each item has `shareLinkId`, `resourceType`, `resourceId`, current
`title` (bookmark name), `public`, and `createdAt`. No content or token.

Creating an already active link returns that same link; it never rotates it.
Concurrent inserts converge through the partial unique index. Distinguish a
resource-index conflict (read the active winner) from a token-index conflict
(generate another token). Bound retries to three attempts, then report a
sanitized conflict/409 rather than returning an unpersisted credential.
Other database failures retain the application's explicit error handling.

Concurrent lifecycle operations are ordered by their database writes. A
create admitted before revoke can return a subsequently revoked link; it
must not silently retry by enabling sharing again. GET/copy never enables
sharing. Only a new explicit POST can create a new active generation.

DELETE targets `shareLinkId`, not just resourceId. This prevents stale UI
actions from revoking a later generation. Unknown/foreign link IDs return
404; repeating DELETE on an owned revoked record returns 204.

### 4. Anonymous resolution checks the link and current resource

Keep the existing public URL shapes:

- UI: `/bookmarks/shared/:token` and `/notes/shared/:token`.
- API: `/api/public/bookmarks/shared/:token` and
  `/api/public/notes/shared/:token`.

Match only the new model's active token, requested resource type, and a
resource whose ID and owner still match the grant. Do not fall back to
`shareableId`, an ordinary resource ID, or `public: true`. A valid token
grants read access regardless of the resource's public flag.

Invalid format, unknown, revoked, legacy, wrong-type, or dangling tokens all
produce the same sanitized `NotFoundError`/404 without echoing the token.
The UI renders "This link is unavailable"; infrastructure errors remain a
separate retryable error state, not a misleading unavailable-link result.

Responses show current content, not a snapshot. Edits and visibility changes
do not rotate the link. Deletion prevents subsequent access through the
required resource lookup, even if metadata cleanup fails. Wire single and
bulk deletion paths to revoke matching active records; list/read checks also
exclude orphans, so cleanup is not the authorization boundary.

Do not add a user-controlled operation to restore a revoked generation.
Revocation does not recall content from an already open page or terminate a
response whose authorization check already passed.

### 5. Allowlisted shared payloads and read-only rendering

Use dedicated response mappers and TypeScript shared-resource types rather
than returning full models or casting reduced payloads to owner models.

| Payload | Allowed fields |
|---|---|
| Bookmark | `_id`, `type`, `name`, `location`, `description`, `descriptionHtml`, `tags`, `copyableFields`, `publishedOn`, `sourceCodeURL`, `language`, `youtubeVideoId`, `stackoverflowQuestionId`, `createdAt`, `updatedAt` |
| Note | `_id`, `type`, `title`, `content`, `contentType`, `reference`, `tags`, `copyableFields`, `createdAt`, `updatedAt`; `notebookContent` only for notebook notes |

Do not expose `userId`, `userDisplayName`, `origin`, `initiator`, `public`,
credentials, share-record metadata, counters, or unrelated future fields.
Copyable fields and reference/location are intended content and remain
visible. Notebook source is included for the existing rendering/download
contract; this includes stored outputs and notebook-internal metadata.
The creation dialog warns that all this content is shared and that the link
is transferable.

Reuse rendering primitives where possible, but provide an explicit shared
read-only context or dedicated wrapper. Do not infer ownership from missing
fields: an anonymous user and an omitted `userId` can both be undefined.
Hide edit, delete, pin, favorite, owner profile, private-history recording,
and share-management actions. Keep content copying, notebook downloads, and
safe content navigation. Shared access is not a DRM or no-download promise.

Preserve existing sanitization for Markdown, notebook HTML, and copyable
values. Do not introduce bypasses to render the reduced payloads.

### 6. Dashboard and dialogs share the same lifecycle

Add a lazy dashboard tab named `shared` at `/dashboard?tab=shared`, labelled
"Shared by me". Preserve existing tab names and legacy redirects. Use a
colocated component template/style and a typed sharing API service in core.

Show title, resource type, sharing date, and Copy link, Open resource, and
Stop sharing. Open resource uses authenticated owner detail routes. A public
badge clarifies that revoking this link cannot revoke ordinary public access.

Both bookmark and note dialogs first fetch status. Inactive resources show
Create link; active resources show the current URL, Copy link, and Stop
sharing. Public-resource sharing keeps its ordinary URL distinct from the
owner's optional revocable link. Non-owners never call management endpoints.

Stop sharing asks for confirmation that anyone using this link will lose
future access. Show success/remove the dashboard row only after a successful
DELETE, and refresh the page/count, including stepping back from an empty
last page. A failure keeps the controls/data available with an explicit
error. Reopening/reloading fetches fresh state; no cross-tab push is needed.
Disable duplicate in-flight actions and never label failed clipboard writes
as copied.

### 7. Credentials and content do not enter persistent caches or logs

Apply `Cache-Control: no-store` to all sharing API responses, including
errors and owner listings/status. Shared-content responses and shared page
documents receive `Referrer-Policy: no-referrer`. Ensure nginx SPA fallback,
redirects, and error handling retain the relevant headers.

Use plain HttpClient for sharing calls, never HttpClientLocalStorageService.
Exclude shared reads and owner sharing endpoints from PWA data caching and
verify behavior with a controlling service worker, not just development
mode. The static shell may be cached; credentials and content must not be.
Set document-level no-referrer protection before shared content loads,
including client-side navigation. An API response header alone does not
protect outbound browser requests from the page.

Redact bearer segments in both request URL and Referer fields for Morgan's
file/console output and nginx access logs, including legacy snippet-sharing
URLs. Error messages and structured logs must not contain raw tokens or
credential-bearing response bodies. Prevent page URLs with tokens from
reaching analytics/error telemetry. Keep unrelated routes' diagnostics.
Inspect proxy error logging for raw request targets as well; if it cannot
redact those targets, suppress raw per-request logging for the affected
locations and retain token-free operational diagnostics.

Preserve HTTPS. Browser history and deliberate copying still contain the
URL by design. External resources embedded in user content can contact
third parties; no-referrer prevents sending the page's bearer URL, not all
network contact or identifiers already written into the content.

## Risks / Trade-offs

- [Database readers can obtain active bearer tokens] -> Explicitly accept
  plaintext storage for this version, restrict DB/backups, exclude tokens
  from generic responses, and retain revocation. Revisit encryption later.
- [Recipients retain copies after revoke] -> Explain this in the UI. Enforce
  denial on subsequent requests; do not claim remote deletion.
- [Notebook source/copyable fields can contain sensitive information] ->
  Disclose their inclusion before sharing; omit structured owner origin.
- [Large notebooks can be repeatedly fetched] -> Preserve existing resource
  limits and avoid payloads in listings. No new arbitrary truncation or
  partial-success response; dedicated abuse controls remain future work.
- [Concurrent deletion leaves an orphan link record] -> Resolution/listing
  verifies resource existence and ownership; cleanup is defense in depth.
- [Old API instances can still resolve legacy tokens] -> Coordinate cutover
  and drain them; do not rely on removing schema fields alone.
- [Cached responses bypass revocation] -> Test HTTP, localStorage, service
  worker, and proxy behavior, including error responses.

## Migration Plan

1. Deploy and verify new collection indexes before enabling link creation.
2. Stage matching API, UI, and proxy changes together; announce that old
   sharing URLs must be recreated explicitly. Back up resources normally.
3. Cut over without mixed old/new resolvers. Remove legacy creation handlers
   and replace public lookup code with new-model-only resolution.
4. Leave old resource data intact. Explicitly exclude legacy fields from all
   output paths, even lean/aggregate paths. No copy, backfill, fallback, or
   automatic replacement of old tokens is performed.
5. Verify an old bookmark link and an old note link fail, ordinary public
   URLs work, and new create/copy/revoke/recreate works through the proxy.
6. Verify an installed PWA cannot serve shared content after revocation;
   update/remove applicable cached API entries as part of client cutover.
7. On rollback, keep sharing disabled at the API/proxy boundary, including
   legacy endpoints, until a compatible resolver is restored. Do not deploy
   the old resolver unguarded: it would reactivate old credentials.

Removing inert legacy fields from stored documents and pruning inactive link
records can be separate maintenance work. Neither is a release prerequisite.
