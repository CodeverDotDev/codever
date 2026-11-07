## Why

Unsaved bookmark and Markdown-note content currently lives only in the editor,
so navigation, reloads, closing the tab, or browser failure can lose both new
content and edits. New entries benefit most from in-browser recovery because
nothing exists on the server yet. Edits of existing entries can be protected
more simply by warning before the user leaves with unsaved changes, avoiding
the per-entry storage, server-baseline comparison, and conflict review that
edit drafts would require. Drafts are kept in the browser's local storage, so
a draft the user forgot about still survives closing the tab or browser, and
several unfinished entries can be kept and chosen from. Drafts are always on:
they hold only the user's own unpublished input, are bounded in number and
age, and are removed on logout. Neither mechanism may publish content or
change API contracts.

## What Changes

- Autosave blank-start bookmark and Markdown-note create forms to
  `localStorage` after a one-second idle interval, with best-effort flushing
  before navigation, reload, and tab close. Drafts survive reloads, in-app
  navigation, and closing the tab or browser.
- Give each create visit its own draft, so tabs and visits never overwrite
  each other. Keep at most 10 drafts per user and resource type (oldest
  trimmed) and expire drafts after 7 days. Edits of saved entries are never
  stored as drafts.
- List stored drafts of the matching type on blank-start create forms, newest
  first with title and save time, each with explicit Restore and Delete
  instead of silent restoration. Replacing changed input asks first.
- Let Cancel on a changed new entry discard its draft after confirmation;
  unchanged or restored-unchanged forms leave without a dialog.
- Explain in the editor that drafts are kept in this browser for 7 days,
  removed on logout, and not published or synced.
- Preserve incomplete fields, tags, ordered copyable fields, and relevant
  save options without weakening normal resource-save validation.
- Remove the user's drafts on logout, prevent pending autosaves resurrecting
  them, and keep drafts when the app clears its cached data.
- Leave extension/bookmarklet-prefilled creates, clones, copy-to-mine,
  notebook authoring, and edits outside draft management. Those flows must not
  restore, overwrite, or remove stored create drafts.
- Add an unsaved-changes warning for authoring forms whose current changes are
  not protected by a stored draft: edits, prefilled captures, clones,
  copy-to-mine, notebook authoring, and blank-start creates whose draft could
  not be stored. In-app navigation asks "Stay" or "Leave without saving".
  Reload, tab close, and popup close first store pending create drafts and
  use the browser's native leave confirmation only for remaining unprotected
  changes.
- Measure changes against the form state after initial loading or prefill, so
  untouched edits, clones, and captures leave without a warning. Successful
  saves and explicit logout do not trigger the warning.
- Surface draft storage failures and unreadable drafts explicitly.

The starting point is `documentation/requirements/migrate-to-docker/`
`save-as-draft/PLAN.md`. This proposal narrows drafts to blank-start creates
in browser-local storage and adds an unsaved-changes warning. Earlier
revisions of this change stored per-entry edit drafts with conflict review,
then consent-dependent persistent drafts, then a single tab-scoped draft per
type; the first two were deferred to reduce complexity and the last did not
protect drafts forgotten before closing the tab. The original plan is
retained unchanged.

## Capabilities

### New Capabilities

- `new-entry-drafts`: Browser-local recovery of new bookmarks and Markdown
  notes, including eligibility, a multi-draft list with restore/delete,
  retention limits, lifecycle cleanup, and logout.
- `unsaved-changes-warning`: Confirmation before leaving any bookmark or note
  authoring form with changes not saved or protected by a stored new-entry
  draft, with bypasses for successful saves and explicit logout.

### Modified Capabilities

None. Existing tagging, copyable-field, visibility, notebook, and local-storage
settings requirements remain unchanged; incomplete drafts do not count as
saved resources.

## Impact

- Affected app: **codever-ui** only. Shared note/bookmark editors, their
  create/update/clone wrappers, the unified new-entry screen, a new
  local-storage draft helper, the authentication lifecycle, app start-up
  pruning, and personal authoring route configuration are involved.
- Routes: existing personal authenticated authoring screens only, which gain a
  leave confirmation when changes are unprotected. Public browsing and existing
  public/personal API contracts are unchanged.
- APIs and Mongoose models: no changes to **codever-api**, schemas, indexes,
  authorization, or resource publication. Backend drafts are deferred.
- Local storage: drafts use their own `codever-draft:v2:` key namespace,
  independent of the personal-data opt-in, and are preserved by the existing
  cache-version invalidation. GET caching is unchanged.
- Dependencies: use existing Angular router, Angular Material dialog, RxJS,
  and Vitest facilities; no new package or infrastructure is planned.
- Boundaries: no edit drafts, cross-device sync, live cross-tab list updates
  (possible follow-up), draft history, separate draft dashboard, saving from
  the leave dialog, or customized native browser prompt text. Changes typed
  within the last second before a crash, and edits on a confirmed tab close,
  are still lost; this is recovery assistance, not durable backup.
