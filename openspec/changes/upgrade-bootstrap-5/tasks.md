## 1. Baseline capture

- [x] 1.1 Create a dedicated branch and record the starting commit; verify with `git log -1 --oneline` on a clean working tree.
- [x] 1.2 Run the baseline command set before any dependency change — `npm run build` and `npm run build:aot` — and retain the output; record that `npm run lint` and `npm test` are unavailable (no `lint` target in `angular.json`; the `test` target references the missing `karma.conf.js` and `src/test.ts`). Verified: build and build:aot exit 0; the two unavailable commands recorded as pre-existing gaps.
- [x] 1.3 Record baseline production bundle sizes from the build output; verify they are written down for later comparison (recorded in `design.md`: `styles-*.css` 321,311 B; JS total 3,008,000 B; `main-*.js` 165,033 B; source `bootstrap.min.css` 4.6.2 = 162,264 B).
- [x] 1.4 Capture baseline screenshots of representative routes (navbar, sidebar, quick-access, a public howto page, a personal dashboard, a form, an error modal, a note preview) at desktop, tablet, and mobile widths; verify the images are stored for side-by-side comparison.
- [x] 1.5 Re-run the Bootstrap 4 usage audit across `apps/codever-ui/src/**/*.html` and `**/*.scss` and confirm the inventory matches design D5 (including the zero-hit list); verify any newly discovered class is added to the plan before migration starts.

## 2. Dependencies and build wiring

- [x] 2.1 Set `bootstrap` to `~5.3.8` in `apps/codever-ui/package.json`; verify `npm ls bootstrap` resolves to 5.3.8.
- [x] 2.2 Confirm `izitoast` and `ngx-highlightjs` do not require a global jQuery (inspect their package dependencies/source), then remove `jquery` from `apps/codever-ui/package.json`; verify `npm ls jquery` reports no direct dependency and the app still boots.
- [x] 2.3 Regenerate `apps/codever-ui/package-lock.json` with npm (no hand edits); verify `npm ci` installs cleanly from the committed manifests.
- [x] 2.4 Update `apps/codever-ui/angular.json` to keep a single Bootstrap stylesheet entry resolving to the 5.3.8 bundle, and add `node_modules/bootstrap/dist/js/bootstrap.bundle.min.js` to the build `scripts` array; verify the build output contains exactly one Bootstrap stylesheet and one emitted scripts bundle.
- [x] 2.5 Delete the three CDN `<script>` tags (jQuery, Popper, Bootstrap) from `apps/codever-ui/src/index.html`; verify `grep -r "code.jquery.com\|cdn.jsdelivr.net\|stackpath.bootstrapcdn.com" apps/codever-ui/src` returns nothing.
- [x] 2.6 Serve the app and load the network log for several routes; verify no request to an external host for Bootstrap styles, jQuery, Popper, or Bootstrap scripts, and that exactly one Bootstrap stylesheet is fetched from the app origin.

## 3. Styles, overrides, and local shims

- [x] 3.1 Remove the dead `$icon-font-path` assignment from `apps/codever-ui/src/scss/_variables.scss` while keeping `$fa-font-path`; verify the build reports no Sass warning about a missing `bootstrap-sass` path.
- [x] 3.2 Add local `.jumbotron` and `.jumbotron-fluid` styles to the override stylesheet; verify the about, terms, privacy, register, version, and howto page headers render with their previous padding, background, and radius.
- [x] 3.3 Switch the navbar in `apps/codever-ui/src/app/shared/navigation/navigation.component.html` from `navbar-dark` to `data-bs-theme="dark"` and rewrite the two `.navbar-dark` override selectors to match; verify nav links keep their white-on-dark color, hover color, and weight.
- [x] 3.4 Compile the styles before any template work — `npm run build` — so Sass failures are isolated; verify the build succeeds before proceeding to group 4.

## 4. Template markup migration

- [x] 4.1 Migrate directional spacing and float utilities (`mr-*`, `ml-*` including `ml-auto`, `pr-*`, `pl-*`, `float-right`, `float-left`, `float-xs-left`, and class-form `border-right`) to `me-*`, `ms-*`, `pe-*`, `ps-*`, `float-end`, `float-start`, and `border-end`; verify no Bootstrap 4 directional utility remains and that spacing/alignment matches the baseline screenshots.
- [x] 4.2 Replace `form-group` with margin/grid utilities; verify no `form-group` remains and that form spacing and validation layout match the baseline.
- [x] 4.3 Convert `custom-file`/`custom-file-label` to a `.form-control` file input with `.form-label` in the user-profile and import-bookmarks templates; verify both upload flows still select and submit a file.
- [x] 4.4 Remove `input-group-prepend`/`input-group-append` wrappers, making `.input-group-text` a direct child; verify input groups render with correct borders and corner radii.
- [x] 4.5 Migrate `badge-pill` to `rounded-pill` and `badge-{success,secondary,...}` to `bg-{...}` while keeping `.badge`; verify badges keep their semantic color, legible contrast, and pill shape.
- [x] 4.6 Replace `close` with `btn-close` (dropping the `&times;` text and adding an accessible label); verify the close control in `apps/codever-ui/src/app/core/error/error.component.html` renders and dismisses the modal.
- [x] 4.7 Rename `data-toggle`/`data-target`/`data-dismiss` to `data-bs-toggle`/`data-bs-target`/`data-bs-dismiss` across the nine affected templates; verify every dropdown opens and closes, and that the navbar collapse toggle shows and hides the navigation at a narrow viewport.
- [x] 4.8 Migrate `sr-only` to `visually-hidden`; verify affected text is not visible on screen and remains available to assistive technology.
- [x] 4.9 Migrate `font-weight-*` to `fw-*`; verify no `font-weight-` class remains and that text weights match the baseline.
- [x] 4.10 Migrate `dropdown-menu-right` to `dropdown-menu-end`; verify those menus align to the end of their trigger.
- [x] 4.11 Replace `btn-block` with a `d-grid` wrapper or `w-100`; verify the button still spans the full width of its container.
- [x] 4.12 Migrate `text-muted` to `text-body-secondary`; verify previously muted text keeps a legible secondary contrast.
- [x] 4.13 Migrate `rounded-lg` to `rounded-3` in the two `border-danger` alert boxes; verify the box corners keep an equivalent large radius.
- [x] 4.14 Re-run the class/attribute audit; verify no Bootstrap 4-only class, plugin attribute, or `data-toggle` variant remains anywhere under `apps/codever-ui/src`.

## 5. Validation

- [x] 5.1 Run `npm run build` and `npm run build:aot` from `apps/codever-ui`; verify both succeed in development and production mode from a clean install.
- [x] 5.2 Run `npx eslint` on the TypeScript and HTML files touched by the change and verify no new ESLint errors are introduced (baseline recorded at 772 pre-existing errors); record the result.
- [x] 5.3 Record that the Karma/Jasmine suite is unavailable in this repo (missing `karma.conf.js` and `src/test.ts`); verify interactive Bootstrap behavior instead through the browser-observable checks in groups 4 and 5.
- [x] 5.4 Run `npm run cy:run` with the Docker-backed environment available; verify the Cypress suite passes, or record explicitly that the environment was unavailable.
- [x] 5.5 Compare migrated screenshots against the baseline at 680px, 768px, 1000px, 1200px, 1349px, and 1600px across the representative routes, including the Angular Material dialog and notebook/markdown surfaces; verify every difference is either fixed or recorded as intentional.
- [x] 5.6 Check keyboard navigation, focus visibility, screen-reader-only content, color contrast, and touch target sizes; verify focus remains visible on controls that had it and that contrast did not regress.
- [x] 5.7 Verify service-worker behavior after deployment of the new hashed bundles; confirm the new CSS and JS activate on reload and that no stale Bootstrap CSS is served to an open tab.
- [x] 5.8 Measure production CSS and JavaScript transfer sizes on the same build and compression settings as the baseline; verify the recorded comparison reports the CSS growth and the Bootstrap-related JavaScript reduction together.

## 6. Documentation and release

- [x] 6.1 Update `apps/codever-ui/README.md` and any repo notes describing Bootstrap, jQuery, or the CDN script setup; verify no documentation still describes Bootstrap 4 or the removed CDN tags.
- [x] 6.2 Record the selected Bootstrap version and every intentional visual difference, including whether jQuery was removed and whether Bootstrap JavaScript was added to the bundle; verify the record is committed alongside the change.
- [x] 6.3 Group the work into focused commits following the Angular Commit Guidelines (dependency/build wiring, markup, documentation) so each phase is separately revertible; verify the history is separable with `git log --oneline`.
- [x] 6.4 From a clean checkout, run `npm ci` in `apps/codever-ui` and then the build; verify the app builds from the committed manifests and lockfile alone.
- [x] 6.5 Rehearse rollback by reverting the migration commits and reinstalling from the previous lockfile; verify the previous Bootstrap 4 setup is restored, then restore the upgrade.
