## Why

Codever's Pinned and History quick-access dialogs are bound to `Ctrl+P` and `Ctrl+H`.
Browsers reserve those combinations for Print and History on Windows and Linux,
and because the handlers call `preventDefault()` while logged in, Codever silently overrides two native browser actions
and blocks users from printing a Codever page or opening browser history.

## What Changes

- Remap the Pinned quick-access shortcut from `Ctrl+P` to `Ctrl+Shift+P`.
- Remap the History quick-access shortcut from `Ctrl+H` to `Ctrl+Shift+H`.
- Add macOS parity bindings (`Cmd+Shift+P` / `Cmd+Shift+H`) using the same dual `control`/`meta` listener pattern the search box already uses for `Ctrl/Cmd+K`.
- Suppress the browser's native action whenever a quick-access shortcut matches, including the not-logged-in path,
so the login prompt does not coexist with the browser's Print/History action.
- Update every user-facing shortcut label and the Hot Keys help page to the new combinations,
and correct the stale label that advertises `Ctrl+S` for the search box (the code binds `Ctrl/Cmd+K`).
- **BREAKING** (user-facing shortcut bindings only): `Ctrl+P` and `Ctrl+H` no longer open the Pinned and History dialogs.

## Capabilities

### New Capabilities

- `quick-access-shortcuts`: the keyboard combinations that open the Pinned and History quick-access dialogs, their cross-platform coverage,
their login-gated behavior, and the requirement that they do not override browser-native shortcuts.

### Modified Capabilities

- None. No existing capability's requirements describe these shortcut bindings; `ui-styling` covers only presentation and interaction baseline,
not keyboard shortcuts.

## Impact

- **App**: `codever-ui` only. No changes to `codever-api`.
- **APIs**: none. No public or personal REST route is added, removed, or changed; the change is confined to the Angular client and its help text.
- **Mongoose models**: none.
- **Code**: `apps/codever-ui/src/app/app.component.ts` (the two `window:keydown` host listeners and their handlers).
- **Documentation surfaces**: `public/howto/howto-hotkeys/howto-hotkeys.component.html`, `public/about/about.component.html`, `public/bookmarks/homepage.component.html`, and `left-navigation-menu/quick-access-resources.component.html`.
- **Dependencies**: none added or removed.
- **Accepted tradeoff**: Firefox reserves `Ctrl+Shift+P` (and `Cmd+Shift+P` on macOS) for New Private Window.
The shortcut handler suppresses it when the Codever page has focus, consistent with the intent to own the combination;
no alternative binding is used.
