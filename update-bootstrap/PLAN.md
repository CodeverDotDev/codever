# Bootstrap 4 to Bootstrap 5 Migration Plan

## Goal

Migrate `apps/codever-ui` from Bootstrap `^4.4.1` to Bootstrap 5 while preserving the existing Codever layout, responsive behavior, Angular Material integration, and browser-facing behavior.

The recommended target is the latest Bootstrap 5 minor version compatible with the project's current Sass toolchain. Pin or record the selected version during implementation rather than upgrading to an unreviewed future major/minor release.

## Current baseline

- Angular UI: Angular 16.
- Bootstrap dependency: `apps/codever-ui/package.json`, currently `^4.4.1`.
- Bootstrap Sass is imported in two places:
  - `apps/codever-ui/src/scss/_bootstrap-override.scss`
  - `apps/codever-ui/angular.json` under the global `styles` list.
- Global styles import `src/scss/bootstrap-override` from `apps/codever-ui/src/styles.scss`.
- `apps/codever-ui/src/scss/_variables.scss` contains the Bootstrap 4-era `$icon-font-path` setting.
- The UI uses Bootstrap utility and component classes directly in Angular templates; it does not use `ng-bootstrap`.
- `jquery` is listed as a dependency, but no Bootstrap JavaScript is currently listed in `angular.json` and no obvious source import was found. Confirm whether any non-Bootstrap code needs jQuery before removing it.

## Scope and non-goals

### In scope

- Bootstrap package and lockfile metadata.
- Sass import and variable configuration.
- Bootstrap 4-to-5 class and markup changes in Angular templates and component styles.
- Any Bootstrap JavaScript behavior actually used by the application.
- Visual, responsive, accessibility, production-build, and end-to-end validation.

### Not in scope

- Replacing Angular Material components.
- A general redesign of Codever styles.
- Updating unrelated third-party libraries.
- Removing jQuery unless repository-wide verification proves it is unused.

## Migration phases

### 1. Establish a baseline

1. Create a clean branch and record the current commit.
2. From `apps/codever-ui`, run and retain the results of:
   - `npm run build`
   - `npm run build:aot`
   - `npm run lint`
   - `npm test -- --watch=false --browsers=ChromeHeadless`
   - `npm run cy:run` when the Docker-backed environment is available.
3. Capture production bundle sizes and screenshots of representative pages at desktop, tablet, and mobile widths.
4. Search all UI source, test, Cypress, and documentation files—not only `src/app`—for Bootstrap class names, `data-toggle`/`data-target` attributes, Bootstrap plugin calls, `jquery`, and `bootstrap` imports.

### 2. Update dependency and build configuration

1. Change `bootstrap` in `apps/codever-ui/package.json` to the selected Bootstrap 5 version.
2. Regenerate the appropriate lockfile from the UI package's supported package-manager workflow; do not hand-edit dependency resolution entries.
3. Remove the duplicate Bootstrap stylesheet entry from `apps/codever-ui/angular.json` after confirming that the Sass import in `styles.scss` remains the single source of Bootstrap CSS.
4. Keep Bootstrap JavaScript out of the bundle unless the audit finds code that depends on Bootstrap plugins. If plugins are needed, use Bootstrap 5's bundled JavaScript strategy and update their markup/API usage; do not reintroduce jQuery solely for Bootstrap.
5. Verify whether `jquery` is needed by another dependency or application code. Remove it only after that check and after confirming the lockfile/build remain clean.

### 3. Adapt Sass and custom overrides

1. Replace or remove the obsolete `$icon-font-path` assignment in `apps/codever-ui/src/scss/_variables.scss`; Bootstrap 5 no longer ships the Bootstrap Glyphicons font.
2. Preserve the Font Awesome path only if Font Awesome remains in use.
3. Review `apps/codever-ui/src/scss/_bootstrap-override.scss`:
   - Change `@extend .float-right` to the Bootstrap 5 equivalent or a local `float: right` rule.
   - Recheck `.jumbotron`, because Bootstrap 5 removed the jumbotron component styling. Keep it as an explicit local component style if it is still required.
   - Recheck `.badge`, navbar, card, button, alert, container, and shadow overrides against Bootstrap 5 selectors and CSS variables.
   - Make the commented dropdown-hover customization either Bootstrap-5-compatible or remove it if unused.
4. Confirm Sass import order and variable override behavior. If variables must customize Bootstrap defaults, load them before Bootstrap's Sass source rather than relying on post-import overrides.
5. Compile the styles after this phase before changing templates, so Sass failures are isolated from markup failures.

### 4. Update template classes and markup

Audit every Angular HTML template and update only where needed. Start with the known usage in `apps/codever-ui/src/app/app.component.html` and `apps/codever-ui/src/app/left-navigation-menu/quick-access-resources.component.html`, then apply the same audit to all feature modules.

High-priority Bootstrap 4 changes to check:

| Bootstrap 4 | Bootstrap 5 | Notes |
|---|---|---|
| `ml-*` / `mr-*` | `ms-*` / `me-*` | Logical start/end spacing; verify RTL-neutral visual intent. |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` | Logical padding equivalents. |
| `float-right` / `float-left` | `float-end` / `float-start` | Also update Sass `@extend` usage. |
| `badge-pill` | `rounded-pill` | Keep the badge class itself. |
| `badge-success` | `bg-success` | Recheck text contrast and any custom badge styling. |
| `badge-secondary` | `bg-secondary` | Recheck text contrast. |
| `font-weight-*` | `fw-*` | Search all templates and styles. |
| `text-left` / `text-right` | `text-start` / `text-end` | Verify intended direction behavior. |
| `sr-only` / `sr-only-focusable` | `visually-hidden` / `visually-hidden-focusable` | Confirm screen-reader behavior. |
| `custom-*` form controls | Bootstrap 5 form-control/form-select patterns | Bootstrap 5 removed several `custom-*` classes. |
| `no-gutters` | `g-0` | Confirm row/column spacing. |

Also inspect component markup for removed or changed components and options, including jumbotron, input groups, form layout, navbar toggling, dropdowns, modals, tooltips, and popovers. Do not mechanically replace names without checking the resulting DOM and behavior.

### 5. Handle JavaScript behavior, if present

1. Identify whether the application uses Bootstrap dropdowns, collapse, modal, tooltip, or popover behavior through `data-*` attributes or direct plugin calls.
2. Bootstrap 5 uses `data-bs-*` attributes instead of Bootstrap 4's `data-*` names, for example `data-bs-toggle` and `data-bs-target`.
3. Update plugin initialization and lifecycle handling if Angular components create/destroy those elements dynamically.
4. Prefer Angular Material or Angular-native state handling for interactions already controlled by Angular. Avoid adding global imperative Bootstrap initialization unnecessarily.
5. Add or update tests for every interactive Bootstrap component found during the audit.

### 6. Validate visual and functional compatibility

Run after the code migration:

- `npm run build`
- `npm run build:aot`
- `npm run lint`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- `npm run cy:run` with the required services available.

Manually compare the baseline and migrated versions for:

- Main navbar, sidebar, quick-access menu, and responsive collapse behavior.
- Cards, buttons, alerts, badges, links, forms, validation states, and search controls.
- Public and personal bookmark, snippet, and note pages.
- Notebook/markdown rendering and dialogs that combine Bootstrap styles with Angular Material.
- Desktop breakpoints around 680px, 768px, 1000px, 1200px, 1349px, and 1600px because custom styles use nearby thresholds.
- Keyboard navigation, focus visibility, screen-reader-only content, color contrast, and touch targets.
- Production service-worker loading and cache invalidation after the CSS bundle changes.

Use browser devtools to confirm there are no missing styles, unresolved Sass imports, JavaScript errors, or unexpected horizontal overflow.

### 7. Measure performance and document the result

1. Compare production CSS and JavaScript transfer sizes before and after migration, using the same build and compression settings.
2. Compare Lighthouse or equivalent lab metrics on the same representative route and device profile.
3. Separate Bootstrap's effect from unrelated changes: record whether jQuery was removed and whether Bootstrap JavaScript was included.
4. Document any intentional visual differences and the selected Bootstrap 5 version.
5. Update the UI README/developer documentation if it describes Bootstrap 4, Sass setup, or package commands.

### 8. Release and rollback

1. Keep dependency, Sass, class-name, and JavaScript changes in reviewable commits.
2. Use a feature branch or feature flag if the application needs parallel visual verification.
3. Before release, verify a clean install from the committed manifests and lockfile.
4. Roll back by reverting the migration commits and reinstalling dependencies from the previous lockfile if production regressions cannot be resolved quickly.

## Expected implementation file groups

### First pass

- `apps/codever-ui/package.json`
- The UI lockfile used by this repository
- `apps/codever-ui/angular.json`
- `apps/codever-ui/src/scss/_variables.scss`
- `apps/codever-ui/src/scss/_bootstrap-override.scss`
- `apps/codever-ui/src/styles.scss` only if import cleanup is required

### Template/style audit

- All `apps/codever-ui/src/**/*.html` files
- All `apps/codever-ui/src/**/*.scss` files
- Relevant Angular tests and Cypress specs containing Bootstrap markup or selectors

### Documentation/configuration audit

- `apps/codever-ui/README.md`
- Root documentation or scripts that mention Bootstrap, jQuery, Sass, or UI build setup

## Definition of done

- The UI builds successfully in development and production modes from a clean install.
- Lint, unit tests, and available Cypress tests pass.
- No Bootstrap 4-only class, Sass variable, plugin attribute, or plugin API remains unless intentionally documented.
- Bootstrap CSS is loaded exactly once.
- Responsive, interactive, accessibility, and Angular Material integration checks show no unintended regressions.
- Production bundle measurements and any Bootstrap/jQuery dependency changes are recorded.
- The migration can be reverted using version-controlled dependency metadata and focused commits.

