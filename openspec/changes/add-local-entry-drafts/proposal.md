## Why

Unsaved bookmark and Markdown-note content currently lives only in the editor,
so navigation, reloads, or browser failure can lose both new content and edits.
Browser-local recovery should protect that work without publishing it, changing
API contracts, or bypassing the user's personal-data storage preference.

## What Changes

- Autosave eligible forms locally after a one-second idle interval, with
  best-effort flushing before navigation and reload.
- Keep one blank-start create draft per user and resource type, plus one edit
  draft per user, resource type, and entry ID. Multiple entries may have unsaved
  edits concurrently; saving one must not clear another or a create draft.
- Require the existing personal-data local-storage opt-in. Explain draft
  retention and browser-only storage in settings and the editor.
- Offer explicit restore/discard instead of silently restoring. Load fresh
  server content before offering an edit draft; preserve conflicting drafts for
  review/copying rather than applying them over newer content.
- Preserve incomplete fields, tags, ordered copyable fields, and relevant
  save options without weakening normal resource-save validation.
- Preserve drafts across application cache-version changes. Clear them on
  logout or consent withdrawal, and prevent pending autosaves resurrecting them.
- Leave extension/bookmarklet-prefilled creates, clones, copies, notebook
  authoring, and edits of another user's resources outside draft management.
  Those flows must not restore, overwrite, or clear existing drafts.
- Surface storage failures and detected same-slot tab conflicts explicitly.

The starting point is `documentation/requirements/migrate-to-docker/`
`save-as-draft/PLAN.md`. This proposal deliberately expands it to include edit
drafts, preserves drafts across cache invalidation, and narrows create support
to blank-start flows. The original plan is retained unchanged.

## Capabilities

### New Capabilities

- `local-entry-drafts`: Opt-in browser-local recovery of new entries and
  per-entry edits, including lifecycle cleanup and safe restoration.

### Modified Capabilities

None. Existing tagging, copyable-field, visibility, and notebook requirements
remain unchanged; incomplete drafts do not count as saved resources.

## Impact

- Affected app: **codever-ui** only. Shared note/bookmark editors, their
  create/update wrappers, local storage helpers, cache-version handling,
  authentication lifecycle, and local-storage settings are involved.
- Routes: existing personal authenticated authoring screens only. Public
  browsing and existing public/personal API contracts are unchanged.
- APIs and Mongoose models: no changes to **codever-api**, schemas, indexes,
  authorization, or resource publication. Existing detail GETs support edit
  comparison; backend drafts and atomic server concurrency are deferred.
- Dependencies: use existing Angular, RxJS, storage, UI, and Karma/Jasmine
  facilities; no new package or infrastructure is planned.
- Boundaries: no cross-device sync, draft history, draft dashboard, automatic
  conflict merging, explicit manual-save button, or navigation guard in this
  change. Browser storage clearing and abrupt process termination can still
  lose work; this is recovery assistance, not durable backup.
