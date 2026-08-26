# Copy Button for Inline `code` in Notes & Bookmark Descriptions

## Goal

Let users copy the content of **inline code** — text rendered inside a single
`<code>` element from single-backtick markdown (`` `like this` ``) — with one
click.

When the mouse hovers over an inline code fragment, a small copy button appears
in the top-right corner of that fragment. Clicking it copies the code text to
the clipboard.

This must apply to:

- **Notes** content (markdown-rendered).
- **Bookmark descriptions** (markdown-rendered).

And it must **not** interfere with **multi-line fenced code blocks**
(triple-backtick ```` ``` ````), which render as `<pre><code>` and already have
their own copy button.

## Non-goals

- Changing the existing multi-line code-block copy button
  (`CopyCodeButtonDirective` / `appCopyCodeButton`) or the fullscreen code
  button (`appFullscreenCodeButton`).
- Copying snippets in the `my-snippets` module (already handled there).
- Adding a copy affordance to arbitrary non-code text.
- Server-side or data-model changes. This is a pure UI/presentation feature.

## Current implementation (reference)

Understanding how the existing pieces fit together, so the new feature slots in
cleanly and stays consistent.

### Markdown rendering

| Content | How it is rendered | Where |
|---|---|---|
| Notes | `md2html` pipe at display time → `[innerHtml]` | `apps/codever-ui/src/app/shared/pipe/markdown2html.pipe.ts`; used in `apps/codever-ui/src/app/shared/note-details/note-card-body/note-content.component.html` (lines 31, 44) |
| Bookmark description | Pre-rendered to `descriptionHtml` at save time via `markdownService.toHtml(...)`, stored on the bookmark, displayed with `[innerHtml]` | Generated in `apps/codever-ui/src/app/my-bookmarks/save-bookmark-form/save-bookmark-form.component.ts` (lines ~448, ~785); displayed in `apps/codever-ui/src/app/shared/bookmark-text/bookmark-text.component.html` (lines 7, 22) |

Both markdown paths use `marked` + `DOMPurify`. `marked` renders:

- Inline `` `code` `` → `<code>...</code>` (the **target** of this feature).
- Fenced ```` ```code``` ```` → `<pre><code class="hljs ...">...</code></pre>`
  (must be **excluded** — see `markdown2html.pipe.ts` custom
  `renderer.code`).

### Existing copy button for fenced blocks

`apps/codever-ui/src/app/shared/directive/copy-code-button.directive.ts`
(`appCopyCodeButton`):

- Implements `AfterViewChecked`; on each check it runs
  `this.el.nativeElement.querySelectorAll('pre')`.
- Guards re-processing with a `data-copy-btn-added="true"` attribute.
- Sets `pre { position: relative }`, appends a `<button class="copy-code-btn">`.
- Copies via `navigator.clipboard.writeText(...)`, then briefly swaps the icon
  to a checkmark.
- Injects its CSS once via a static `injectStyles()`; button is hidden by
  default and shown on `pre:hover`.

This directive is a good template to mirror for consistency (same clipboard
call, same “added” guard pattern, same hover-to-reveal UX, same injected-style
approach).

### Where directives are attached today

- **Notes**: the container `#noteContentDiv` in
  `note-content.component.html` already carries
  `appMarkedImageWidth appCopyCodeButton appFullscreenCodeButton`. The new
  directive would be added to this same element.
- **Bookmarks**: the container `#bookmarkText` in
  `bookmark-text.component.html` currently carries only `appOpenInNewTab`. The
  new directive would be added here (this container currently has **no** code
  copy directive at all).

## Recommended approach

Create a **new, dedicated directive** — proposed name `appCopyInlineCode`
(`CopyInlineCodeButtonDirective`) — rather than extending
`CopyCodeButtonDirective`. Keeping them separate preserves the single
responsibility of the fenced-block directive and avoids any risk of regressing
the existing, working behavior.

### Selector strategy (the critical part)

The directive must target **only inline** `<code>` and never fenced-block
`<code>`. The distinguishing factor is the parent:

- Inline code: `<code>` whose parent is **not** `<pre>`.
- Fenced code: `<pre><code>`.

Recommended query inside the host element:

```text
code:not(pre code)
```

`querySelectorAll('code:not(pre code)')` returns inline code elements while
excluding any `<code>` nested under a `<pre>`. This cleanly separates the two
cases with no overlap, satisfying the requirement that the fenced-block copy
button remains the only affordance for multi-line blocks.

As a defensive secondary check, the directive can also skip a matched element if
`element.closest('pre')` is non-null.

### Attaching the button / UX

Two viable UX patterns — recommend evaluating both, starting with option A:

**Option A — inject a per-element button (mirrors existing directive).**
For each inline `<code>`:

- Skip if already processed (`data-inline-copy-added="true"`).
- Wrap or position a small button relative to the code element.
- Show on hover, hide otherwise; on click, copy `code.textContent` via
  `navigator.clipboard.writeText`, flash a checkmark for ~1.5s.

Caveat: `<code>` is an inline element, so `position: relative` on it plus an
absolutely-positioned child can render awkwardly when the inline code wraps
across lines. Mitigations: render the code as `inline-block`, or place the
button just after the element rather than absolutely inside it.

**Option B — single shared floating button per container (recommended to
evaluate for performance).**
Inject **one** reusable button into the container. On `mouseover`/`mouseout`
(event delegation) detect when the pointer is over an inline `<code>`, position
the shared button at that element's top-right, and wire its click to copy the
currently-hovered element's text. This scales to any number of inline code
fragments with a fixed DOM cost and a single listener.

Given notes/descriptions can contain many inline code fragments, **Option B is
the safer default for performance**; Option A is simpler but multiplies DOM
nodes and listeners.

### Clipboard mechanism

Reuse `navigator.clipboard.writeText(...)` for consistency with the existing
directives. Consider a graceful no-op/fallback where the Clipboard API is
unavailable (older/non-secure contexts), consistent with how the app already
behaves.

### Styling

Follow the existing `copy-code-btn` conventions (Font Awesome copy icon
`far fa-copy`, checkmark `fas fa-check` on success, hidden-until-hover). Use a
distinct class (e.g. `copy-inline-code-btn`) and inject styles once, matching
the static `injectStyles()` pattern already used.

### Where to apply

1. Add `appCopyInlineCode` to `#noteContentDiv` in
   `note-content.component.html` (alongside the existing code directives).
2. Add `appCopyInlineCode` to `#bookmarkText` in
   `bookmark-text.component.html`.
3. Register the directive in the module(s) that declare these shared
   components (the shared module where `CopyCodeButtonDirective` is already
   declared).

Consider also: public views of notes/bookmarks, dashboards, and search results
— any place that renders note content or `descriptionHtml`. Audit all usages so
the affordance is consistent (or intentionally limited to a defined set of
views).

## Edge cases to handle

- Inline code that **wraps** across multiple lines (button positioning).
- **Very short** inline code (e.g. `` `x` ``) where the button is wider than the
  text — decide whether to still show it, or overlay to the right.
- Inline code **inside a link** or inside a task-list item.
- Inline code containing **HTML entities** (e.g. `&amp;`, `&lt;`) — copy the
  decoded `textContent`, not the raw HTML, so the clipboard gets the literal
  characters the user sees.
- Nested/edge markdown where a `<code>` legitimately appears inside a table
  cell, blockquote, or heading.
- Content re-rendered after edit / “show more” toggles — the “added” guard must
  survive Angular re-renders without double-injecting.
- Notebook (`contentType: 'notebook'`) content is rendered by
  `app-notebook-renderer`, not the `md2html` pipe — confirm whether inline code
  there should also get the button (likely out of scope for v1).

## Risks & performance considerations

The user explicitly asked for these — key concerns and mitigations:

### Performance

- **`AfterViewChecked` cost.** The existing `CopyCodeButtonDirective` runs a
  DOM query on **every** change-detection cycle. Copying that pattern for
  inline code multiplies the work: notes/descriptions typically contain **far
  more** inline `<code>` fragments than fenced blocks, and this runs across
  every rendered card in a list. This is the single biggest performance risk.
  - **Mitigations:** prefer processing **once** after render (e.g.
    `AfterViewInit` + a `MutationObserver` scoped to the host, instead of
    `AfterViewChecked`); or debounce; or use the shared-button + event
    delegation approach (Option B) so there is **no** per-fragment DOM work at
    all — just CSS/hover and a single positioning calculation on hover.
  - Keep the `data-*`-added guard cheap and always short-circuit already-
    processed nodes.
- **DOM node growth (Option A).** Injecting a button per inline fragment can
  add many nodes to long, code-heavy notes, increasing memory and layout cost.
  Option B avoids this entirely.
- **Event-listener growth (Option A).** One `click` listener per fragment vs a
  single delegated listener in Option B. Prefer delegation.
- **Reflow/layout.** Setting `position: relative` and inline-block on many
  inline elements can trigger layout recalculation; validate scroll/typing
  performance on large notes.

### Correctness / UX risks

- **Accidental targeting of fenced blocks.** If the selector is wrong, the new
  button could appear on `<pre><code>` and collide with the existing button.
  The `code:not(pre code)` selector plus a `closest('pre')` guard mitigates
  this; add a regression test.
- **Double buttons / re-injection** on re-render if the guard is missed.
- **Layout shift on wrap.** An absolutely-positioned button inside wrapping
  inline code can overlap text or jump lines; Option B’s floating button
  positioned on hover avoids persistent layout changes.
- **Sanitization interaction.** Both paths run through `DOMPurify`. Because the
  button is injected **after** sanitization (via a directive on already-
  rendered DOM), it does not need `DOMPurify` allow-listing — but do **not**
  try to inject the button through the markdown HTML string, or it would be
  stripped/again need allow-listing. Keep injection in the directive.
- **Clipboard API availability.** `navigator.clipboard` requires a secure
  context (HTTPS/localhost). Provide a graceful fallback or hide the button
  when unavailable.
- **Accessibility.** Hover-only reveal is not keyboard/touch friendly. Consider
  focus/`:focus-within` reveal, an `aria-label`/`title`, and touch behavior
  (hover doesn’t exist on touch — decide whether to always show on small
  screens or on tap).
- **Consistency across views.** If applied only to some views, users may be
  confused why inline copy works in a note detail but not in search results.
  Decide the intended surface area up front.

### Maintenance risk

- Two similar directives (`appCopyCodeButton` and `appCopyInlineCode`) share
  styling and clipboard logic. Consider extracting a shared clipboard/flash
  helper to avoid drift, without merging their DOM-targeting responsibilities.

## Suggested implementation steps (for a later PR)

1. Create `CopyInlineCodeButtonDirective` (`appCopyInlineCode`) in
   `apps/codever-ui/src/app/shared/directive/`, mirroring the existing copy
   directive but targeting `code:not(pre code)` and using the chosen UX option
   (recommend Option B).
2. Prefer `AfterViewInit` + scoped `MutationObserver` over `AfterViewChecked`
   for performance.
3. Declare the directive in the shared module.
4. Add `appCopyInlineCode` to `#noteContentDiv` and `#bookmarkText`, then audit
   other note/bookmark render surfaces.
5. Add tests: selector excludes `<pre><code>`; button copies decoded
   `textContent`; no double-injection on re-render; graceful behavior without
   Clipboard API.
6. Verify no regression to the existing fenced-block copy / fullscreen buttons.

## Testing

- Unit test the directive’s selector and copy behavior
  (`ng test` / Karma-Jasmine).
- Manual/E2E (Cypress) check on a note and a bookmark description containing
  **both** inline code and a fenced block, confirming each shows the correct,
  non-overlapping button.
- Performance sanity check on a long, code-heavy note (scroll/typing latency).

