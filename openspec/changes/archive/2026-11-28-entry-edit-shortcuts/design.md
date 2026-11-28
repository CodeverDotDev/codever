## Context

See proposal.md for the motivation. Relevant current state in `codever-ui`:

- `core/shortcut/main-link-shortcut.service.ts` handles the global `k+k`
  sequence from `AppComponent`'s `window:keydown` listener. It ignores
  editable targets (`INPUT`, `TEXTAREA`, `SELECT`, contenteditable),
  Ctrl/Cmd/Alt combinations and auto-repeat. Pages register a
  `BookmarkShortcutContext` while they are shown; the bookmark details pages
  (`my-bookmarks/bookmark-details`, `public/bookmarks/public-bookmark-details`)
  already do so for `k+k`.
- Note details render `shared/note-details` (routed directly for
  `/my-notes/:id/details`, wrapped by `public/notes/public-note-details` for
  `/notes/:id/details`). The same component also renders notes in lists
  (`partOfList`, `inSearchResults`) and in shared-link views
  (`isSharedView`).
- Bookmark details render `shared/bookmark-list-element`, which is also the
  list row component.
- The Edit buttons call `NoteDetailsComponent.editNote(note)` (shown when
  `!isSharedView` and the signed-in user owns the note) and
  `BookmarkListElementComponent.editBookmark(bookmark)` (shown for the owner
  or `ROLE_ADMIN`).
- Both entry forms (`note-editor`, `save-bookmark-form`) submit through
  `(ngSubmit)` and have a Cancel button calling `cancelUpdate()`, which uses
  `confirmCancel` and the editor-protection unsaved-changes guard before
  `Location.back()` (or `window.close()` in the bookmark popup). The content
  and description fields are plain `<textarea>`s with no editor key bindings.

No API, auth or localStorage cache changes: the shortcuts only trigger
existing UI actions, which keep their own checks.

## Goals / Non-Goals

**Goals:**

- One shared key guard for "plain key outside editable controls", reused by
  `k+k` and `e`.
- Each shortcut triggers exactly the existing button action, so behavior,
  permissions and validation cannot drift from the buttons.

**Non-Goals:**

- `e` in lists, search results or dialogs (no single "current" entry).
- `Ctrl/Cmd+S`, or `Escape` in create, clone and copy-to-mine forms.
- Configurable or user-defined shortcuts.

## Decisions

### `e` through a registered details-page context

A small `EditShortcutService` in `core/shortcut` keeps a stack of registered
`EditShortcutContext { canEdit(): boolean; edit(): void }`. `AppComponent`'s
existing `window:keydown` listener passes the event to it after the `k+k`
service. It acts only when:

- the key is a plain `e` / `E` (no Ctrl, Cmd or Alt; Shift is allowed so Caps
  Lock still works), not `event.repeat`, and not `defaultPrevented`;
- the target is not editable (the same check as `k+k`, moved to a shared
  `isEditableTarget` / `hasCommandModifier` helper in `core/shortcut`);
- no Material dialog is open (`MatDialog.openDialogs.length === 0`);
- the most recently registered context reports `canEdit()`.

Then it calls `preventDefault()` and `edit()`.

Registration happens only on details pages:

- `shared/bookmark-list-element` registers only when `isDetailsPage` is set,
  which the two bookmark details pages (`my-bookmarks/bookmark-details`,
  `public/bookmarks/public-bookmark-details`) do. The Edit button's condition
  lives there (owner via the `userData$` input, or `ROLE_ADMIN`), so
  `canEdit()` mirrors it exactly; on the public page no `userData$` is passed,
  so, like the button, `e` works there for admins only. `edit()` calls
  `editBookmark`.
- `shared/note-details` registers only when it is a details page, i.e. not
  `partOfList`, not `inSearchResults` and not `isSharedView`. `canEdit()`
  mirrors the Edit button (`userId === note.userId`); `edit()` calls
  `editNote(note)`.

Contexts unregister in `ngOnDestroy`, so the shortcut disappears with the
page.

Alternatives considered:

- *Listen in each component with `@HostListener('window:keydown.e')`:*
  duplicates the guard four times and is easy to get wrong (list rows would
  all listen at once).
- *Trigger a click on the Edit button via the DOM:* couples the shortcut to
  markup and breaks silently when the button moves.

### `Ctrl/Cmd+Enter` on the form element

Each form gets `(keydown.control.enter)` and `(keydown.meta.enter)` on its
`<form>`, so any focused field inside it triggers the shortcut. The handler
calls `preventDefault()` (no line break in textareas) and submits only when
the Save button is enabled, by calling the same `saveNote` / `saveBookmark`
path as `(ngSubmit)` (through `FormGroupDirective.onSubmit` so `submitted`
state and validation display match a button click).

Ctrl+Enter is preferred over Ctrl/Cmd+S (see the exploration): it is the
common "submit this form" combination (GitHub, Jira, Slack), has no browser
default in a textarea, and matches Codever's Save, which leaves the form.
The tag chip input does not treat Enter with a modifier as a separator, so
the combination does not add a chip.

### `Escape` reuses `cancelUpdate()`

In edit mode only (`isEditMode` for notes, `isUpdate` for bookmarks), a
`window:keydown.escape` listener on the form component calls
`cancelUpdate()`, so it also works when focus is not in a field. It returns
early when `event.defaultPrevented` is set, on auto-repeat, or while a dialog
is open (`MatDialog.openDialogs.length > 0`), so Material closes its panel or
dialog first and the form stays. The checks live in
`core/shortcut/form-shortcuts.util.ts`, shared by both forms.

Because `cancelUpdate()` already runs `confirmCancel` and the unsaved-changes
guard, `Escape` never discards changes silently, and the bookmark popup
closes its window as Cancel does.

### Labels

- Edit buttons: tooltip "Edit note (e)" / "Edit bookmark (e)" where the
  shortcut is active (details pages only; list rows keep their tooltip).
- Save buttons: "(Ctrl/Cmd+Enter)", like the existing "Ctrl/Cmd+Shift+P"
  and "Search (Ctrl/Cmd+K)" hints; both combinations work on every
  platform, so no platform detection is needed.
- Cancel in edit mode: "Cancel (Esc)".
- `public/howto/howto-hotkeys`: a section for the three shortcuts.

## Risks / Trade-offs

- [A stray `e` while focus is on the page, not a field, opens the edit form]
  → only navigation, nothing is changed; Cancel, Back or `Escape` returns.
- [`Escape` while typing in the content field leaves the form] → only in edit
  mode and always through the unsaved-changes protection; documented on the
  Cancel tooltip.
- [Detecting an open autocomplete panel] → Material's autocomplete stops
  propagation and calls `preventDefault()` on Escape while its panel is open,
  so the window-level listener skips it. Its trigger also calls
  `preventDefault()` on every Escape typed in the tags input, so Escape does
  not leave the form while focus is there; acceptable, since Escape works
  from every other field and from the page.
- [macOS `Cmd+Enter` or `Ctrl+Enter` bound by browser extensions] → no
  browser default exists for these in a textarea; extensions may still take
  them, which cannot be prevented.

## Migration Plan

UI-only change, deployed with the next UI release. Rollback is reverting the
UI deploy; there is no data or API impact.
