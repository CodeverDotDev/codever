## 1. Remap the quick-access shortcut bindings

- [ ] 1.1 In `apps/codever-ui/src/app/app.component.ts`, change the Pinned shortcut listener from `Ctrl+P` to `Ctrl+Shift+P` and verify that pressing `Ctrl+Shift+P` while signed in opens the Pinned dialog.
- [ ] 1.2 In the same component, change the History shortcut listener from `Ctrl+H` to `Ctrl+Shift+H` and verify that pressing `Ctrl+Shift+H` while signed in opens the History dialog.
- [ ] 1.3 Add macOS `Meta+Shift` listeners for both shortcuts, mirroring the existing `control`/`meta` pairing used by the search-box shortcut, and verify `Cmd+Shift+P` / `Cmd+Shift+H` open the dialogs on macOS.
- [ ] 1.4 Make the browser-default suppression run whenever a quick-access shortcut matches, including the signed-out path, and verify a signed-out user sees only the sign-in prompt with no accompanying browser Print, History, or New Private Window action.
- [ ] 1.5 Verify the old combinations no longer open Codever dialogs: pressing `Ctrl+P` (or `Cmd+P`) reaches the browser's Print action, and `Ctrl+H` (or `Cmd+H`) reaches the browser's own History action.

## 2. Update shortcut labels and help text

- [ ] 2.1 Update `public/howto/howto-hotkeys/howto-hotkeys.component.html` to `Ctrl/Cmd+Shift+H` for History and `Ctrl/Cmd+Shift+P` for Pinned, and correct the search-box entry from `Ctrl + S` to `Ctrl/Cmd+K`; verify the rendered Hot Keys page shows the corrected labels.
- [ ] 2.2 Update the History and Pinned shortcut mentions in `public/about/about.component.html`; verify the rendered about page shows the new combinations.
- [ ] 2.3 Update the History and Pinned tab tooltips and both alert texts in `public/bookmarks/homepage.component.html`; verify the rendered Home tabs and alerts show the new combinations.
- [ ] 2.4 Update the History and Pinned titles and inline labels in `left-navigation-menu/quick-access-resources.component.html`; verify the rendered quick-access panel shows the new combinations.

## 3. Automated and manual verification

- [ ] 3.1 Add a focused Karma/Jasmine spec for the Pinned and History shortcut handlers covering signed-in, signed-out, new-combination, and old-combination cases, register a dedicated karma target and tsconfig in `apps/codever-ui/angular.json` mirroring the existing `test-copyable` target, and verify `npx ng run codever-ui:test-shortcuts` passes.
- [ ] 3.2 Manually verify across Chrome/Edge and Firefox on Windows/Linux and macOS that the new combinations open the dialogs, the old combinations reach the browser, and Firefox's New Private Window does not open while the app is focused.
- [ ] 3.3 Run the UI lint and production build (`npm run lint`, `npm run build` from `apps/codever-ui`) and verify both succeed without new errors.
