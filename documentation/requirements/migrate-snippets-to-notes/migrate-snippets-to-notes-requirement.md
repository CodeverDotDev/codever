# Code Snippets → Notes Migration

## Goal

Migrate all code snippets to notes and eventually remove the snippets feature entirely,
while maintaining backward compatibility with existing bookmarklet, VS Code and IntelliJ extensions.

---

## Context

Since Codever's launch, users can save **code snippets** (stored in the `snippets` MongoDB collection).
We are migrating them to the **notes** collection, where each snippet becomes a markdown note with
fenced code blocks. The DB migration script is already implemented and tested:
- [migrate-snippets-to-notes.js](migrate-snippets-to-notes.js) — migrates all users
- [migrate-snippets-to-notes-single-user.js](migrate-snippets-to-notes-single-user.js) — migrates one user
- [how-to-test-locally.md](how-to-test-locally.md) — instructions for testing locally in Docker

The migration preserves the original `_id` so that public snippet URLs can be redirected to notes.

---

## Public note URLs (prerequisite — done before Phase 1)

Notes now have clean top-level public URLs, mirroring the snippet pattern:

| Note type | URL |
|-----------|-----|
| My (private) note | `https://www.codever.dev/my-notes/:id/details` |
| Public note (canonical) | `https://www.codever.dev/notes/:id/details` |
| Shared note (via shareableId) | `https://www.codever.dev/notes/shared/:shareableId` |
| Old URL (redirects automatically) | `https://www.codever.dev/public/notes/:id` → `/notes/:id/details` |

### Implementation

- **New `PublicNotesModule`** lazy-loaded at `/notes` in `app.routing.ts`
  - Declares `PublicNoteDetailsComponent` and `ShareableNoteDetailsComponent`
  - (Moved out of `PublicResourcesModule`)
- **`NoteNotFoundComponent`** added at `/404-note?noteId=:id`
  - Shows: *Note with the id ":id" was not found — the submitter might have deleted it*
- **`PublicNotesService.getPublicNoteById()`** redirects to `/404-note` on HTTP error
- **`public-routing.module.ts`** → old `/public/notes/:id` and `/public/notes/shared/:shareableId` now redirect to the canonical `/notes/:id` and `/notes/shared/:shareableId`

---



### Phase 1 — Single-user feature toggle (test in production)

**Target user:** `"userId": "33d22b0e-9474-46b3-9da4-b1fb5d273abc"`

1. **Run the DB migration script** for this user (already done ✅)

2. **Frontend feature toggle** (no backend changes yet)
   - Create a `MigrationToggleService` (or similar) with a hardcoded `userId` check
   - When toggle is ON for the user:
     - Hide snippet-related UI (sidebar links, dashboard snippets section, searchbar domain option)
     - Show notes UI in its place
     - Redirect `/my-snippets/**` routes → `/my-notes/**` (see routing section below)
     - Redirect search domain `sd=my-snippets` → `sd=my-notes`

3. **Verify** everything works for that user — search, create from extensions, view public links

### Phase 2 — Full migration (all users)

1. Run the DB migration script for all users
2. Remove the feature toggle
3. Apply the redirects permanently (see below)
4. Remove all snippets-related code (frontend modules, backend routes, model)
5. Drop the `snippets` collection from MongoDB
6. Clean up: `db.notes.updateMany({}, {$unset: {migratedFromSnippetId: ""}})`

---

## Backward Compatibility — IDE Extensions

Bookmarklet, Older VS Code and IntelliJ extensions call these URLs:

| Action | Old URL | New URL |
|--------|---------|---------|
| Save snippet | `/my-snippets/new?code=...&title=...&tags=...&comment=...&location=...&file=...&project=...&workspace=...&initiator=...` | `/my-notes/new?content=...&title=...&tags=...&comment=...&location=...&file=...&project=...&workspace=...&initiator=...` |
| Search snippets | `/search?q=...&sd=my-snippets` | `/search?q=...&sd=my-notes` |

### Frontend routing redirects needed

In `app.routing.ts`, change the `my-snippets` lazy-load to a redirect:

```typescript
{
  path: 'my-snippets',
  redirectTo: 'my-notes',
  pathMatch: 'prefix',   // catches /my-snippets/new, /my-snippets/:id/details, etc.
},
```

### Query parameter mapping gap ⚠️

The extensions send these params to `/my-snippets/new`:

| Param | Purpose |
|-------|---------|
| `code` | The selected code text |
| `title` | Snippet title |
| `tags` | Language tag(s), comma-separated |
| `comment` | IntelliJ: project/file metadata; VS Code: unused |
| `location` / `sourceUrl` | File path or URL |
| `file` | Filename |
| `project` | Project name |
| `workspace` | Workspace name |
| `ext` | Extension identifier (e.g. `vscode`) |
| `initiator` | Extension identifier (e.g. `vscode`, `intellij-plugin`) |

The current `CreatePersonalNoteComponent` only reads: `title`, `content`, `initiator`, `reference`.

**Action required:** Extend `CreatePersonalNoteComponent` to also read:
- `code` → map to `content` (wrap in a markdown code fence using `tags` as the language)
- `tags` → pass to the note editor as initial tags (add `code-snippet` automatically)
- `comment` → prepend to `content` (before the code fence)
- `location` → map to `origin.location` and/or `reference`
- `file` → map to `origin.file`
- `project` → map to `origin.project`
- `workspace` → map to `origin.workspace`
- `ext` → store or ignore (informational)

The note editor component (`NoteEditorComponent`) also needs to accept these new inputs.

### Search domain redirect

When `sd=my-snippets` arrives via query param, the `SearchResultsPageComponent` should treat it
as `sd=my-notes`. This can be a simple mapping in `ngOnInit()`:

```typescript
if (this.searchDomain === SearchDomain.MY_SNIPPETS) {
  this.searchDomain = SearchDomain.MY_NOTES;
}
if (this.searchDomain === SearchDomain.PUBLIC_SNIPPETS) {
  this.searchDomain = SearchDomain.PUBLIC_NOTES;
}
```

---

## Public snippet URLs (Phase 1 → Phase 2)

Public snippets are referenced on the web at `/public/snippets/:id/details`.
Since the migration preserves `_id`, we need a redirect once snippets are gone:

```typescript
// In app.routing.ts (Phase 2)
{ path: 'snippets/:id/details', redirectTo: 'notes/:id/details' }
{ path: 'snippets/:id', redirectTo: 'notes/:id' }
```

Also handle the `404-snippet` route — redirect to `/404-note`.

---

## Backend API (Phase 2)

Once all users are migrated:

1. **Redirect or remove** snippet API routes (`/api/users/:userId/snippets/**`)
   - Option A: Return 301 redirects pointing to the notes endpoints
   - Option B: Remove entirely (extensions only use frontend URLs, not the API directly)

2. **Remove** snippet search service (`snippets-search.service.js`)

3. **Remove** snippet model (`src/model/snippet.js`)

---

## Files affected (summary)

### Frontend (`apps/codever-ui/src/app/`)

| File/Folder | Action |
|-------------|--------|
| `app.routing.ts` | Add redirect `my-snippets` → `my-notes`, `snippets/:id/details` → notes |
| `my-notes/create-note/create-personal-note.component.ts` | Accept snippet-compatible query params (`code`, `tags`, `comment`, `location`, `file`, `project`, `workspace`) |
| `my-notes/save-note-form/note-editor.component.ts` | Accept new inputs for pre-filling from extension params |
| `search-results/search-results-page.component.ts` | Map `my-snippets`/`public-snippets` → `my-notes`/`public-notes` |
| `core/model/search-domain.enum.ts` | Keep for now (Phase 2: remove snippet entries) |
| `core/model/search-domains-map.ts` | Keep for now (Phase 2: remove snippet entries) |
| `my-snippets/` (entire module) | Phase 1: keep but unreachable; Phase 2: delete |
| `public/snippets/` | Phase 1: redirect; Phase 2: delete |
| `shared/snippet-details/` | Phase 2: delete |
| `core/personal-snippets.service.ts` | Phase 2: delete |
| `core/model/snippet.ts` | Phase 2: delete |
| User dashboard snippets components | Phase 1: hide via toggle; Phase 2: delete |

### Backend (`apps/codever-api/src/`)

| File/Folder | Action (Phase 2) |
|-------------|--------|
| `model/snippet.js` | Delete |
| `routes/users/snippets/` | Delete or redirect |
| `routes/public/snippets/` | Delete or redirect |
| `common/searching/snippets-search.service.js` | Delete |

---

## Acceptance Criteria

### Phase 1
- [ ] Single user sees notes instead of snippets throughout the UI
- [ ] VS Code extension "Save Snippet" command opens the note editor with correct pre-filled data
- [ ] IntelliJ plugin "Save to Codever" opens the note editor with correct pre-filled data
- [ ] Extension "Search Snippets" command searches notes
- [ ] Existing public snippet URLs (with preserved `_id`) resolve to the note detail page
- [ ] Other users are unaffected (still see snippets)

### Phase 2
- [ ] All users see notes only; no snippet UI remains
- [ ] All snippet routes redirect properly
- [ ] `snippets` collection dropped
- [ ] No dead code remains in the codebase
