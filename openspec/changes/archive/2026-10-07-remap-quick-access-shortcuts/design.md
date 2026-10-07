## Context

See `proposal.md` — Why. Current state that shapes the approach:

- `apps/codever-ui/src/app/app.component.ts` binds the quick-access dialogs with `@HostListener('window:keydown.control.p')` and `@HostListener('window:keydown.control.h')`, and calls `event.preventDefault()` only in the signed-in branch.
- `searchbar.component.ts` already pairs `window:keydown.control.k` with `window:keydown.meta.k`, so dual Control/Meta binding is the house pattern rather than a new invention.
- Four templates hardcode the shortcut labels: the Hot Keys page, the about page, the Home bookmark tabs, and the quick-access panel.
- The UI is an Angular 21 standalone app. The default `test` target is broken (`src/test.ts` missing), but targeted Karma targets (`test-onpush`, `test-copyable`) exist, each pairing a dedicated `tsconfig.*-spec.json` with `karma.onpush.conf.cjs`.

## Goals / Non-Goals

**Goals:**

- Move the Pinned and History shortcuts to combinations browsers do not reserve for native actions on Windows, Linux, and macOS.
- Give macOS users a native-feeling `Cmd+Shift` binding.
- Ensure the app's own combinations do not also trigger a browser action, including when the user is signed out.
- Keep every visible shortcut label truthful.

**Non-Goals:**

- User-configurable shortcuts.
- Avoiding Firefox's `Ctrl/Cmd+Shift+P` = New Private Window binding (explicitly accepted).
- Changing the search-box binding; only its incorrect label is corrected.
- Any API, Mongoose model, authentication, or localStorage-cache change.

## Decisions

### 1. Use `Ctrl+Shift+P` / `Ctrl+Shift+H` (not a leader key or Alt scheme)

The chosen combinations preserve the P/H mnemonics and are free on Chrome, Edge, and Safari on both Windows/Linux and macOS. Only Firefox binds `Ctrl/Cmd+Shift+P` (New Private Window), and that collision was accepted.
Alternatives considered: `Alt+Shift+P/H` (Option+Shift emits dead-key characters on macOS and is less discoverable); a leader sequence such as `g p` (larger redesign, extra state for marginal benefit).

### 2. Bind both `control.shift.*` and `meta.shift.*`

Mirrors the existing `control.k` / `meta.k` pairing. This needs no runtime platform detection: Meta never fires on Windows, and `Ctrl+Shift` continuing to work on macOS is harmless.
Alternative considered: branching on `navigator.platform`/`userAgent` — rejected as new machinery for no benefit, since Angular's key matcher already requires an exact modifier set.

### 3. `event.preventDefault()` unconditionally at handler entry

Ensures the browser default is suppressed on both the signed-in and signed-out paths; previously a signed-out user got the login prompt *and* the browser's Print/History action.
Alternative considered: keep `preventDefault()` only in the signed-in branch — rejected because it leaves that double-action bug in place.

### 4. Verify with a real-event Karma spec plus a dedicated `test-shortcuts` target

The spec dispatches real `keydown` events on `window`, which exercises Angular's key-event matching — the part that actually decides whether the old vs new combination fires.
Implementation notes for the test: `TestBed.overrideComponent(AppComponent, { set: { template: '' } })` keeps the heavy child feature components from being instantiated, and a `#favicon` element is injected because `ngOnInit` reads it in non-production builds.
Alternatives considered: calling the handlers directly (rejected — would not cover the binding); reusing the default `test` target (rejected — `src/test.ts` is missing); a browser/E2E check (needs Keycloak and real browsers).

### 5. Label format `Ctrl/Cmd+Shift+X`

Uses the compact form already established by the search box placeholder `Search (Ctrl/Cmd+K)`, applied consistently across all four surfaces.

## Risks / Trade-offs

- [Firefox reserves `Ctrl/Cmd+Shift+P` for New Private Window] → Accepted by the user; the handler suppresses it while the Codever page is focused, and the binding is documented.
- [Existing users lose `Ctrl+P` / `Ctrl+H`] → Intentional, marked **BREAKING** in the proposal; all labels updated to the new combinations.
- [Angular requires an exact modifier set, so `Ctrl+Alt+Shift+P` will not fire] → Acceptable and consistent with the previous binding's behavior.
- [`npm run lint` cannot run — the project has no `lint` target] → Pre-existing condition, not introduced here; the production build plus the targeted Karma run are the verification instead.
- [The reduced `test-shortcuts` target renders an empty template, so it does not assert dialog markup] → Acceptable: the spec covers the shortcut matching and handler branches, which is what this change alters.

## Migration Plan

- Client-only change; ships with the next UI build. No server, data, or cache migration.
- No auth or cache impact: the shortcuts do not touch `keycloak.protect` / `UserIdValidator` or `HttpClientLocalStorageService`.
- Rollback: revert the commit, which restores the previous `Ctrl+P` / `Ctrl+H` bindings and labels.

## Open Questions

None.
