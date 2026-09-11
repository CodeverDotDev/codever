# Add Favicons to Bookmarks

## Goal

Display a small favicon next to bookmark titles while keeping bookmark creation fast, avoiding unnecessary requests to target websites, and preventing private or internal URLs from being exposed.

The implementation should support:

- Automatic favicon discovery for public bookmarks.
- An explicit user-controlled option for private bookmarks.
- Manual favicon upload for private or internal links.
- A safe fallback when no favicon is available.
- Consistent rendering in bookmark lists and other bookmark views.

## Recommended approach

Persist a reference to a favicon rather than fetching the target website's favicon every time a bookmark is displayed.

Do not store favicon binaries directly in MongoDB. Store them in the configured object storage, such as S3, and store only metadata and a storage reference on the bookmark.

Do not rely solely on a remote favicon URL. Remote icons can disappear, be slow, track users, or expose private hostnames to clients.

## Scope

### In scope

- Favicon metadata on the bookmark model.
- Favicon discovery from HTML metadata and the site's conventional `/favicon.ico` path.
- Asynchronous favicon processing for public bookmarks.
- Private favicon upload.
- Optional authenticated fetch for private URLs, protected by SSRF controls.
- Favicon rendering beside bookmark titles.
- Generic fallback icon and image-load failure handling.
- Tests for discovery, validation, access control, and UI fallback behavior.

### Out of scope for the first version

- Crawling an entire website for icons.
- Fetching arbitrary internal URLs from an unrestricted backend endpoint.
- User-customizable favicon colors or icon editing.
- Automatic SVG sanitization unless SVG support is explicitly enabled.

## Data model

Add an optional `favicon` object to the bookmark model. A proposed shape is:

```text
favicon.storageKey   Object-storage key or content-addressed identifier
favicon.url          Original discovered URL, optional and diagnostic only
favicon.mimeType     Validated image MIME type
favicon.source       scraped | uploaded | default
favicon.status       pending | ready | failed
favicon.fetchedAt    Date of the last successful fetch
favicon.etag         Optional upstream ETag
favicon.hash         Content hash used for deduplication
```

The public API should expose a usable favicon URL or an application URL, not storage credentials. For private bookmarks, the returned URL must be access-controlled or generated as a short-lived signed URL.

The bookmark should continue to work when the `favicon` field is missing. Existing bookmarks must render the generic bookmark icon until they are processed or updated.

## Public bookmark flow

1. The user creates or updates a public bookmark.
2. The bookmark is saved without waiting for favicon retrieval.
3. A background task queues favicon discovery.
4. The worker fetches the target page, looking for:
   - `link[rel="icon"]`
   - `link[rel="shortcut icon"]`
   - `link[rel="apple-touch-icon"]` as a lower-priority fallback
   - `/favicon.ico` at the final validated origin
5. The worker validates the response and stores the image in object storage.
6. The worker updates the bookmark's favicon metadata.
7. The UI displays the stored favicon on subsequent responses.

Favicon processing must be best-effort. A failed fetch must not fail bookmark creation or update.

## Private and internal bookmark flow

The backend must not automatically fetch arbitrary private or internal URLs. That could allow SSRF, internal service probing, metadata-service access, or leakage of private hostnames.

Recommended first-version behavior:

1. Offer a manual favicon upload control for private bookmarks.
2. Allow PNG, JPEG, and ICO initially.
3. Store uploaded private icons in private object storage.
4. Return them only to the bookmark owner or an authorized administrator.
5. Use a generic fallback icon when no private favicon has been uploaded.

A later option may allow an authenticated user to request a favicon fetch. That endpoint must require explicit confirmation and enforce all SSRF protections described below. For internal domains, an administrator-configured allowlist is preferable to general private-network access.

A browser extension could also capture a favicon from the user's own network and upload it, which is useful for internal links without making the Codever backend access the internal network.

## Backend changes

Relevant areas include:

- `apps/codever-api/src/model/bookmark.js`
- `apps/codever-api/src/routes/webpage-info/webpage-info.service.js`
- `apps/codever-api/src/routes/webpage-info/webpage-info.router.js`
- Bookmark create/update services and routers.
- Existing AWS/S3 upload configuration and utilities, if available.

Recommended backend components:

### Favicon discovery service

Create a focused service that:

- Resolves an icon URL from page HTML.
- Handles relative URLs safely.
- Falls back to the final origin's `/favicon.ico`.
- Normalizes URLs for caching.
- Returns metadata without coupling discovery to bookmark persistence.

### Favicon storage service

Create a storage abstraction that:

- Uploads validated image bytes.
- Computes a content hash.
- Deduplicates identical icons.
- Generates public application URLs for public icons.
- Generates authorized or signed URLs for private icons.
- Deletes or garbage-collects unreferenced objects.

### Processing trigger

Use an asynchronous mechanism where practical. If a queue is not yet available, a non-blocking post-save task can be a transitional implementation, but it should have:

- A timeout.
- Retry limits.
- Failure logging.
- Idempotent updates.
- No impact on the bookmark response.

### API operations

The exact route names should follow the existing router conventions. The feature likely needs:

- A public/internal operation to refresh a public bookmark favicon.
- An authenticated owner operation to upload or replace a private favicon.
- An authenticated owner operation to remove a custom favicon.
- Optional authenticated fetch-from-URL operation, only after SSRF protections are implemented.

All operations must verify bookmark ownership or administrator authorization.

## SSRF and image validation requirements

Any backend fetch must:

- Accept only `http` and `https` schemes.
- Reject credentials in URLs.
- Enforce connection and total-request timeouts.
- Limit redirect count.
- Revalidate every redirect destination.
- Resolve DNS and reject loopback, link-local, multicast, reserved, private, and cloud metadata IP ranges.
- Prevent DNS-rebinding bypasses by validating the resolved address used for the connection.
- Limit response size before buffering or storing it.
- Validate the actual content type and image signature, not only the file extension.
- Reject HTML, scripts, executable content, and unsupported formats.
- Limit image dimensions and decompression work to prevent image bombs.
- Avoid returning upstream error bodies to users.

Initially allow only PNG, JPEG, and ICO uploads. If SVG is added later, sanitize it before storage and serving, or serve it with download-safe headers rather than as executable image content.

## Frontend changes

Relevant areas include:

- `apps/codever-ui/src/app/core/model/bookmark.ts`
- `apps/codever-ui/src/app/shared/bookmark-list-element/bookmark-list-element.component.html`
- `apps/codever-ui/src/app/shared/bookmark-list-element/bookmark-list-element.component.scss`
- `apps/codever-ui/src/app/my-bookmarks/save-bookmark-form/save-bookmark-form.component.html`
- `apps/codever-ui/src/app/my-bookmarks/save-bookmark-form/save-bookmark-form.component.ts`

### Bookmark display

Render the favicon before the bookmark title:

- Use a fixed 16–20px box to prevent layout shifts.
- Include meaningful `alt` text, such as `Favicon for {bookmark.name}`.
- Use a generic bookmark icon when the favicon is missing.
- Use an image error handler to replace broken images with the fallback.
- Do not directly load the remote target website's favicon in the list.

The same display behavior should eventually be reused by search results, history, pinned/read-later lists, collections, public bookmark pages, and bookmark details.

### Save/update form

For public bookmarks:

- Show favicon processing as best-effort status if useful.
- Optionally provide a manual refresh action after the bookmark has been saved.

For private bookmarks:

- Provide an upload control.
- Clearly explain that automatic backend fetching is disabled for private/internal URLs.
- Show a preview before upload.
- Allow replacing and removing the uploaded icon.
- Enforce file size and type restrictions in the UI as well as on the backend.

When the bookmark location changes, mark the existing scraped favicon as stale or clear it according to the selected product behavior. A manually uploaded private favicon should not be silently replaced by a later scrape.

## Caching and lifecycle

- Cache icons by normalized origin and content hash where possible.
- Avoid fetching the same public origin repeatedly for every bookmark.
- Store `fetchedAt` and refresh stale icons using a configurable TTL.
- Keep favicon refresh separate from bookmark reads.
- Retain an old working icon if a refresh fails.
- Remove object-storage references when a bookmark is deleted, or use periodic garbage collection if deduplication is implemented.
- Consider a separate favicon cache collection for shared public icons if many bookmarks use the same origin.

## Security and privacy

- Public favicon objects may be served through a public application endpoint or CDN.
- Private favicon objects must not have guessable public URLs.
- Private favicon responses must check bookmark ownership or authorization.
- Do not expose the original private/internal favicon URL in public bookmark responses.
- Do not allow public bookmark data to reference a private storage object.
- Record source and access policy explicitly so a public/private state transition can update favicon visibility safely.

## Testing plan

### Backend unit tests

- Extract icons from absolute and relative HTML URLs.
- Handle missing icon metadata with `/favicon.ico` fallback.
- Handle redirects and malformed URLs.
- Reject unsupported schemes and invalid content.
- Reject private, loopback, link-local, reserved, and metadata IP addresses.
- Enforce response-size and timeout limits.
- Deduplicate identical favicon content.
- Preserve an existing icon when refresh fails.
- Enforce owner/admin access to private favicon operations.

### Backend integration tests

- Public bookmark creation queues favicon processing.
- Favicon failure does not fail bookmark creation.
- Public bookmark responses contain the expected public favicon reference.
- Private favicon upload is visible to the owner and unavailable to unauthorized users.
- Public responses do not expose private favicon storage keys or source URLs.
- Bookmark deletion handles favicon cleanup correctly.

### Frontend tests

- Bookmark list renders a favicon when available.
- Missing favicon renders the generic icon.
- Broken image URLs trigger the fallback.
- The title remains accessible and correctly linked.
- Private bookmark form accepts supported uploads and rejects unsupported files.
- Favicon replacement/removal updates the displayed state.

## Acceptance criteria

- Public bookmarks eventually show a stored favicon when the target provides a valid icon.
- Bookmark save and update requests do not wait for favicon retrieval.
- A missing or failed favicon never prevents a bookmark from being displayed.
- Private and internal URLs are never fetched automatically by an unrestricted backend request.
- Users can upload a favicon for private bookmarks.
- Private favicon data is visible only to authorized users.
- Favicon fetching cannot access private network or cloud metadata endpoints.
- Existing bookmarks and API consumers remain compatible when no favicon metadata exists.
- Favicons are shown consistently next to bookmark titles with a stable fallback.

## Suggested implementation phases

### Phase 1: Display and model

- Add optional favicon metadata to API and UI models.
- Add the shared favicon display component or directive.
- Render the fallback and stored favicon in bookmark list elements.

### Phase 2: Public automatic discovery

- Implement icon discovery and validation.
- Add object-storage integration.
- Trigger asynchronous processing after public bookmark create/update.
- Add caching and retry behavior.

### Phase 3: Private manual upload

- Add authenticated upload, replace, and remove operations.
- Add private storage access control.
- Add upload UI and tests.

### Phase 4: Optional advanced integrations

- Add browser-extension capture for internal URLs.
- Consider explicit allowlisted backend fetching for selected private domains.
- Add stale-icon refresh and shared favicon cache optimization.

