# quick-access-shortcuts Specification

## Purpose

Let users open the Pinned and History quick-access dialogs from the keyboard with combinations that do not override the browser's own shortcuts, on Windows/Linux and macOS alike.

## Requirements

### Requirement: Pinned quick-access shortcut

The web UI SHALL open the Pinned quick-access dialog when the user presses `Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS while the Codever app has focus and the user is signed in.

#### Scenario: Open Pinned from the keyboard
- **WHEN** a signed-in user presses `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) while the app has focus
- **THEN** the Pinned quick-access dialog opens

#### Scenario: Pinned shortcut requires sign-in
- **WHEN** a signed-out user presses the Pinned shortcut while the app has focus
- **THEN** the Pinned dialog does not open
- **AND** a sign-in prompt is shown

### Requirement: History quick-access shortcut

The web UI SHALL open the History quick-access dialog when the user presses `Ctrl+Shift+H` on Windows/Linux or `Cmd+Shift+H` on macOS while the Codever app has focus and the user is signed in.

#### Scenario: Open History from the keyboard
- **WHEN** a signed-in user presses `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (macOS) while the app has focus
- **THEN** the History quick-access dialog opens

#### Scenario: History shortcut requires sign-in
- **WHEN** a signed-out user presses the History shortcut while the app has focus
- **THEN** the History dialog does not open
- **AND** a sign-in prompt is shown

### Requirement: Quick-access shortcuts avoid browser-native conflicts

Quick-access shortcuts SHALL NOT reuse the combinations browsers bind to native Print and History, and pressing a quick-access shortcut SHALL suppress any browser action otherwise bound to that combination while the app has focus.

#### Scenario: Native Print is available again
- **WHEN** a user presses `Ctrl+P` (Windows/Linux) or `Cmd+P` (macOS) while the app has focus
- **THEN** the browser's native Print action proceeds
- **AND** no Codever quick-access dialog opens

#### Scenario: Native History is available again
- **WHEN** a user presses `Ctrl+H` (Windows/Linux) or `Cmd+H` (macOS) while the app has focus
- **THEN** the browser's own action for that combination proceeds
- **AND** the Codever History dialog does not open

#### Scenario: Quick-access combination owns its browser binding
- **WHEN** a user presses `Ctrl+Shift+P`, `Ctrl+Shift+H`, `Cmd+Shift+P`, or `Cmd+Shift+H` while the app has focus
- **THEN** the corresponding Codever dialog responds
- **AND** a browser action otherwise bound to that combination, such as Firefox's New Private Window, does not occur

### Requirement: Shortcut labels match the bindings

The UI SHALL label each shortcut with the combination it actually responds to in the help, about, tab, and quick-access surfaces, including the search-box shortcut.

#### Scenario: Hot Keys help page lists current shortcuts
- **WHEN** a user opens the Hot Keys help page
- **THEN** Pinned is shown as `Ctrl/Cmd+Shift+P`, History as `Ctrl/Cmd+Shift+H`, and the search box as `Ctrl/Cmd+K`

#### Scenario: In-app shortcut hints match the bindings
- **WHEN** shortcut hints appear in the about page, the Home bookmark tabs, or the quick-access panel
- **THEN** they show the same combinations the app responds to
