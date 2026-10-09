## Why

Jupyter notebook notes are currently a one-way street: you can upload an `.ipynb` and render it, but there is no way to get the original file back out of Codever. Separately, the personal notes export ships the raw `.ipynb` JSON of every notebook note (each up to 5,000,000 characters), so a modest export can balloon into tens of megabytes dominated by opaque blobs that are useless inside a JSON dump.

## What Changes

- **codever-ui** — Note details gains a "Download notebook" action for notes with `contentType === 'notebook'`, saving the original `.ipynb` from the note's stored `notebookContent`. No API change: the raw notebook JSON is already delivered to note details.
- **codever-ui** — The note backup dialog states that Jupyter notebook notes are included without their raw `.ipynb` content, so an export file is not mistaken for a complete notebook backup.
- **codever-api** — `GET /api/personal/users/:userId/notes/export` stops returning the `notebookContent` field. Notebook notes are **still included**, retaining `contentType: 'notebook'` and their extracted searchable `content`, but without the raw notebook JSON.

## Capabilities

### New Capabilities

- `jupyter-notebook-notes`: retrieving the original `.ipynb` of a single notebook note from note details, and how notebook notes are represented in the personal notes export.

### Modified Capabilities

- None. The existing capabilities (`copyable-entry-fields`, `entry-tagging-policy`, `legacy-dashboard-route-redirects`, `mcp-note-creation`, `quick-access-shortcuts`, `ui-styling`) do not describe notebook note behavior, so no existing requirement changes.

## Impact

- **Affected apps**: both `codever-api` and `codever-ui`.
- **Routes**: personal authenticated `GET /api/personal/users/:userId/notes/export` changes its response shape (field omission only; no new or removed route, still `keycloak.protect()` + `UserIdValidator`). The download action adds no route — it reads data already present on the personal note details response and on public notes served by `/api/public/notes`.
- **Mongoose models**: no schema change. `getAllMyNotes` gains a projection that omits `notebookContent`; the `Note` schema is untouched, so stored notebook content is unaffected.
- **Dependencies**: none added. The download uses the browser's `Blob` and `<a download>` mechanisms already used by the existing backup dialog.
- **Compatibility**: `/notes/export` is consumed only by the Codever UI and is not described in `apps/codever-api/docs/openapi/openapi.yaml`; the browser extension and MCP server do not use it.
