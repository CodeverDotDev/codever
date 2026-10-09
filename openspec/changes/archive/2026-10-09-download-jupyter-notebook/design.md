## Context

See `proposal.md` — Why for motivation. Current state that shapes the approach:

- A notebook note stores both `content` (text extracted from its cells, used for search) and `notebookContent` (the original `.ipynb` JSON, stored verbatim, up to 5,000,000 characters). `notebookContent` is selected by default in queries.
- Note details already receives the complete note, including `notebookContent`, from both the personal note response and the public/shareable note response.
- The note details header action row already hides the markdown copy action for notebook notes, leaving a free slot for a notebook-specific action.
- `GET /api/personal/users/:userId/notes/export` resolves to `PersonalNotesService.getAllMyNotes(userId)`, whose only consumer is the UI "Export my notes" action.
- The application already performs client-side downloads with a `Blob` object URL and a download-anchored link in the note/bookmark backup dialog.
- `getPersonalNoteById` and the notes export are plain `HttpClient` calls; they are not routed through `HttpClientLocalStorageService`, unlike the note tags lookup.

## Goals / Non-Goals

**Goals:**

- Let a user retrieve a notebook note as the original `.ipynb` file, losslessly.
- Stop the personal notes export from carrying raw notebook payloads while keeping notebook notes represented and identifiable.

**Non-Goals:**

- Rendered or converted exports of a notebook (HTML, PDF, Markdown).
- Bulk download of all notebooks, or a zip archive.
- Any change to notebook upload, rendering, validation, size limits, or the `Note` schema.
- Any change to the bookmarks export.

## Decisions

**D1 — The download is produced client-side from data already loaded, with no new endpoint.**
The original notebook JSON is already present on the note details response and was stored verbatim at upload time, so writing it back out is a lossless round trip and needs no server involvement. Alternative considered: a dedicated endpoint returning the file with a `Content-Disposition` header. Rejected because it adds a route and an authorization surface for a payload the client already holds, and introduces a second place where notebook content is emitted.

**D2 — The export omits only the raw notebook JSON; notebook notes stay in the export.**
The export is a backup and inventory. Removing whole notes would make it silently incomplete and discard each notebook's extracted text, tags, and metadata. Omitting the raw payload removes exactly the multi-megabyte values that motivate the change. Alternative considered and rejected: filtering notebook notes out in the UI, which still transfers their raw payloads to the browser before discarding them.

**D3 — The omission is applied in the API service query, not in the UI.**
Keeping the payload off the wire is the point, and the service layer is the right boundary under the existing Router → Service → Model layering; the route itself is unchanged. The affected endpoint is consumed only by this UI and is not described in the OpenAPI document, so no API documentation change is required. Deliberately not added now: an explicit opt-in parameter for a full-fidelity notebook backup. If such a need appears, it is a separate change rather than a behavior toggled today.

**D4 — The download action appears only in note details, never in list or summary renders.**
This matches the requested behavior, avoids putting a file-producing action inside a compact card, and keeps the action away from list payloads, which are the most affected by notebook size.

**D5 — Audience and authorization mirror existing note detail visibility, adding nothing.**
Owners reach their own notebook details; any viewer who can already open a public notebook reaches the same page. Because the notebook is already fully rendered to that audience, the original source reveals nothing additional. The action reuses the position and gating of the existing markdown copy action, and no route, scope, or validator changes. There is no authentication impact: no new protected route is introduced, and the export route keeps its existing protection and user-id validation.

**D6 — No caching change.**
The affected reads bypass `HttpClientLocalStorageService`, so there is no cached note or export entry to invalidate and no stale-cache behavior to reconcile. No new caching is introduced for either read.

## Risks / Trade-offs

- The export is no longer a full-fidelity notebook backup → the notes download dialog states that notebooks are included without their raw `.ipynb` content, and the per-note download is the path to the original file.
- A note title may contain characters that are unsafe in a filename → sanitize the title before using it as the filename, and fall back to a stable default name when the sanitized result is empty.
- A notebook note may lack stored source (legacy or malformed data) → present no download action rather than producing an empty or invalid file.
- Changing the export response shape could surprise an unlisted consumer → verified that only the Codever UI calls this endpoint; the browser extension and the MCP server do not.

## Migration Plan

No data migration and no schema change; stored notebook content is untouched. Deployment order does not matter, since the download relies only on data already returned to note details and the export change is server-side. Rollback is reverting the UI action and the service projection.

## Open Questions

None.
