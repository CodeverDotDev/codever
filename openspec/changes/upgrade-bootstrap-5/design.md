## Context

See `proposal.md` for motivation. This section records only the current-state facts and constraints that shape the approach.

**How Bootstrap reaches the browser today** (three layers, each changed differently):

```
  CSS   apps/codever-ui/angular.json -> node_modules/bootstrap/dist/css/bootstrap.min.css
                                          (resolves to 4.6.2, 162,264 bytes, bundled by the builder)
        src/styles.scss             -> @use './scss/bootstrap-override' | colors |
                                          left-menu-quick-access | show-more-button | variables
                                          (plain-CSS overrides, no Sass variables, no @use of bootstrap/scss)

  JS    src/index.html            -> CDN: jquery 3.4.1-slim (72,380 B)
                                          + popper 1.16 (21,233 B)
                                          + bootstrap 4.4.1 (62,563 B)
                                          = 156,176 B over 3 external requests
                                          ^^ JS is 4.4.1 while CSS is 4.6.2

  DEPS  package.json              -> "bootstrap": "^4.6.2", "jquery": "^3.5.1"
```

**Constraints that bound the solution**

- Angular 19.2 with `@angular-devkit/build-angular` 19; `angular.json` `styles`/`scripts` arrays are still supported and are the least invasive wiring point.
- Package manager is npm; `apps/codever-ui/package-lock.json` is the single lockfile.
- The app is a PWA. `ngsw-config.json` prefetches `/*.css` and `/*.js`, so builder-emitted hashed bundles are covered and no service-worker config change is expected — but activation timing must be verified.
- Font Awesome 5.7.1 is loaded from a CDN in `index.html` and used in 386 places. It is a separate concern with a separate lifetime, so it stays on the CDN in this change and the spec's "no third-party host" requirement is scoped to Bootstrap styles and Bootstrap/jQuery/Popper scripts.
- `src/index.html` also carries an inline favicon script (lines 12-43). It is plain DOM code with no jQuery usage, so it is unaffected by removing the CDN script tags.
- The only Bootstrap Sass surface is dead or plain CSS: `$icon-font-path` references the uninstalled `bootstrap-sass` package, the only `@extend` in the codebase targets a local class (`.last-search-border`), and nothing reads Bootstrap Sass variables. There is no Bootstrap Sass pipeline to port.

**Corrections to `update-bootstrap/PLAN.md`** (the planning input for this change; it is left unedited, and it is stale on these points)

| Plan asserts | Reality |
|---|---|
| Baseline is Angular 16 | Angular 19.2 |
| Bootstrap `^4.4.1` | `^4.6.2` |
| Bootstrap Sass is imported in two places | No Bootstrap Sass import exists anywhere |
| Remove the duplicate Bootstrap stylesheet from `angular.json` | There is a single entry; removing it removes all Bootstrap CSS |
| `jquery` has no obvious source import | CDN `<script>` in `index.html` plus a direct dependency |
| `@extend .float-right` needs updating | No such `@extend`; the override uses a literal `float: right` |
| `$icon-font-path`/Glyphicons need review | Dead config for an uninstalled package |

**Measured baseline (captured on `feat/upgrade-bootstrap-5` at `fbd1db3e`, before any change)**

- `npm run build` (dev, optimization off): `styles.css` 383.20 kB raw; initial total 8.66 MB; `main.js` 1.32 MB.
- `npm run build:aot` (production): `browser/styles-*.css` = 321,311 B; total JS = 3,008,000 B; `main-*.js` = 165,033 B; `ngsw-worker.js` = 71,374 B.
- Verification gates: `npm run build` and `npm run build:aot` pass. `npm run lint` has no `lint` target in `angular.json`; a direct `npx eslint` reports 772 pre-existing errors (681 fixable). `npm test` fails because `karma.conf.js` and `src/test.ts` are missing. These are pre-existing tooling gaps and are recorded rather than silently treated as passing gates.

**Post-migration production build (after groups 2-4, same build and compression settings)**

- `browser/styles-*.css` = 391,610 B (baseline 321,311 B; +70,299 B). The Bootstrap-only component is 162,264 -> 232,111 B (+69,847 B, +43%), matching the predicted growth; the rest of the delta is the local `.jumbotron`/`.jumbotron-fluid` shim and the navbar override selector rewrite.
- `scripts-*.js` (Bootstrap bundle) = 80,449 B, emitted as a single local file. Bootstrap-related JavaScript went from 156,176 B over three external CDN requests (jQuery 72,380 + Popper 21,233 + Bootstrap 4.4.1 62,563) to 80,449 B over one same-origin request (-48%), with zero external script hosts remaining.
- Total JS = 3,087,795 B (baseline 3,008,000 B; +79,795 B from moving the Bootstrap bundle into the project bundle).
- `ngsw-worker.js` is emitted and the prefetch asset group covers hashed `/*.css` and `/*.js`, so the new bundles are service-worker managed without a config change.

## Goals / Non-Goals

**Goals**

- Deliver Bootstrap 5.3.x styling from exactly one project-built stylesheet, served from the application's own origin.
- Remove jQuery from the runtime and from the dependency tree.
- Migrate every Bootstrap 4-only class name and plugin attribute actually present in `apps/codever-ui/src` (90 templates) to its verified Bootstrap 5.3.8 equivalent.
- Preserve the current Codever look, responsive behavior, accessibility affordances, and Angular Material integration.
- Leave the change revertible through dependency metadata and focused commits, and record bundle-size and validation evidence.

**Non-Goals**

- Self-hosting or migrating Font Awesome (386 usages, still CDN).
- Converting to a Bootstrap Sass source build, Sass-variable theming, or trimming the CSS payload. This is revisited only as the documented mitigation for the CSS size growth, in a later change.
- Redesigning any Codever surface, or replacing Angular Material components with Bootstrap ones.
- Adopting Bootstrap 5 features the app does not already use (offcanvas, accordion, toasts, tabs, carousels, tooltips, popovers).
- Shipping RTL support. Logical-property class names (`ms-*`, `float-end`, ...) are adopted because Bootstrap 5 renamed them, not because RTL is being delivered.
- Any `codever-api` change.
- Keeping `update-bootstrap/PLAN.md` in sync. This design supersedes it.

## Decisions

### D1. Target `~5.3.8`, patch-only range

`package.json` gets `"bootstrap": "~5.3.8"` rather than `^5.3.8`.

**Why:** this is a visual baseline, so an unreviewed minor release should not reach production without someone looking at the rendered UI. `~` still picks up patch fixes. The resolved version is recorded in the lockfile either way.

**Alternatives:** `^5.3.8` matches the convention used by every other dependency in the file but permits a silent minor bump; an exact `5.3.8` is maximally reviewable but also blocks harmless patches. The plan itself asks for a recorded, deliberately chosen version, which `~5.3.8` satisfies without fighting repo convention.

### D2. Keep Bootstrap CSS as a prebuilt bundle from `node_modules`

Bootstrap 5.3.x `bootstrap.min.css` stays a single entry in `angular.json` `styles`, listed before `src/styles.scss`.

**Why:** nothing in the repo consumes Bootstrap Sass. Adopting a Sass source build would add a full Dart Sass compile of all of Bootstrap to every build, introduce import-order and variable-cascade questions that do not exist today, and still leave `_bootstrap-override.scss` as post-import plain CSS. The change keeps its blast radius to class names.

**Alternatives:** (a) `@use 'bootstrap/scss/bootstrap'` from `styles.scss` — rejected as unnecessary risk now; (b) Sass partials importing only containers/grid/utilities/used components — the real fix for payload size, but it changes *what* CSS ships, which is out of scope here (see Risks).

### D3. Bundle Bootstrap's JavaScript locally through the builder

`node_modules/bootstrap/dist/js/bootstrap.bundle.min.js` is added to the `scripts` array in `angular.json`, and the three CDN `<script>` tags are deleted from `src/index.html`.

**Why:** `bootstrap.bundle.min.js` already contains Popper, so it replaces all three tags with one project-served file (80,496 bytes vs 156,176 bytes). It also matches the spec requirement that no Bootstrap script be fetched from an external host, and it makes offline/PWA behavior deterministic.

The bundle is safe with Angular-rendered DOM: Bootstrap 5's dropdown, collapse, and modal plugins all bind their `data-bs-*` handlers through document-level event delegation, so they keep working for elements created later by `*ngIf`/`*ngFor` and for lazily-loaded feature modules. No Angular lifecycle or imperative plugin initialization is needed.

**Alternatives:** (a) Bootstrap 5 bundle from a CDN — one tag instead of three, but keeps an external runtime dependency and contradicts the spec; (b) importing only the needed plugins as ES modules from application code — viable but requires per-component lifecycle handling for zero functional gain; (c) keeping jQuery and Bootstrap 4's JS — rejected, it is the thing being removed.

### D4. Remove the `jquery` dependency

Verified before deciding: zero jQuery API call sites, zero Bootstrap plugin calls from TypeScript, and zero `data-toggle` strings built in TypeScript. The inline script in `index.html` is plain DOM. Its only consumer is Bootstrap 4's CDN JavaScript, which D3 removes.

One residual check belongs in implementation: confirm `izitoast` and `ngx-highlightjs` (the two other UI libraries present) do not require a global jQuery. Both are standalone vanilla-JS libraries, but the check is cheap and is a task.

### D5. Class and attribute migration, verified against Bootstrap 5.3.8

Occurrence counts are from the audit of `apps/codever-ui/src/**/*.html` and `**/*.scss`. "Absent in BS5" was confirmed by inspecting the compiled `bootstrap.css` of 5.3.8.

| Bootstrap 4 usage | Hits | Bootstrap 5 equivalent | Notes |
|---|---|---|---|
| `mr-*` | 113 | `me-*` | BS4 name absent in BS5 |
| `ml-*` | 43 | `ms-*` | BS4 name absent in BS5; includes `ml-auto` (3) → `ms-auto` |
| `pr-*` | 6 | `pe-*` | BS4 name absent in BS5 |
| `pl-*` | 3 | `ps-*` | BS4 name absent in BS5 |
| `float-right` / `float-left` | 13 | `float-end` / `float-start` | BS4 name absent in BS5 |
| `float-xs-left` | 4 | `float-start` | BS4 responsive float; BS5 removed responsive floats |
| `border-right` | 4 | `border-end` | BS4 name absent in BS5; class form only — the `border-left` matches are CSS properties, not classes |
| `form-group` | 37 | margin/grid utilities (`mb-3`) | BS4 name absent in BS5 |
| `text-muted` | 29 | `text-body-secondary` | `.text-muted` still exists in 5.3 but is deprecated and removed in v6 |
| `badge-success` etc. | 22 | `bg-success` etc. | Keep `.badge`; `.badge-*` color classes absent in BS5 |
| `close` | 5 | `btn-close` | BS5 close button uses an SVG background image, so the `&times;` text node is dropped and an accessible label is added; "Close" button text and Angular `(click)` handlers are unaffected |
| `data-toggle`/`data-target`/`data-dismiss` | 20 | `data-bs-*` | Namespaced in BS5 |
| `sr-only` | 10 | `visually-hidden` | BS4 name absent in BS5 |
| `font-weight-*` | 7 | `fw-*` | BS4 name absent in BS5 |
| `input-group-append` | 5 | (wrapper removed) | `.input-group-text` becomes a direct child |
| `input-group-prepend` | 3 | (wrapper removed) | same |
| `dropdown-menu-right` | 3 | `dropdown-menu-end` | BS4 name absent in BS5 |
| `badge-pill` | 3 | `rounded-pill` | BS4 name absent in BS5 |
| `custom-file` / `custom-file-label` | 2 files | `.form-control` file input + `.form-label` | BS4 names absent in BS5 |
| `btn-block` | 1 | `d-grid` wrapper or `w-100` | BS4 name absent in BS5 |
| `jumbotron` / `jumbotron-fluid` | 13 files | none — see D6 | Component dropped from BS5 |
| `navbar-dark` | 1 template + 2 override rules | `data-bs-theme="dark"` — see D7 | Deprecated in 5.3.0, removed later |
| `table-sm` | 1 | unchanged | Verified present in 5.3.8 |
| `rounded-lg` | 2 | `rounded-3` | BS4 name absent in BS5; the two usages are `border border-danger rounded-lg` alert boxes |
| `no-gutters`, `text-left/right`, `thead-light/dark`, `text-monospace`, `rounded-sm`, `media`, `pre-scrollable`, `card-deck`, `card-columns` | 0 | — | Not present; no work needed |

### D6. Reintroduce the dropped pieces as local, Codever-owned styles

Bootstrap 5 drops three things Codever actually uses, so they are rebuilt locally rather than redesigned:

1. **`.jumbotron` / `.jumbotron-fluid`** (used in 10+ templates as a page-header block). Recreated as a local component style alongside the existing overrides: block padding, bottom margin, secondary background, and rounded corners for `.jumbotron`; horizontal padding reset and no radius for `.jumbotron-fluid`. **Alternative:** rewriting 10+ templates to utility classes (`.p-4 .mb-4 .bg-body-secondary .rounded`) — more churn, and the same look would have to be repeated in every file with no single place to change it.
2. **`.custom-file` / `.custom-file-label`** (2 files). Replaced with Bootstrap 5's native pattern: `.form-control` on the `<input type="file">` plus a `.form-label`. **Alternative:** keeping a local `.custom-file` shim — rejected; Bootstrap 5's native file input already looks close, and a shim would freeze markup the framework now supports directly.
3. **`.close`** (22 hits). Replaced with `.btn-close`, which renders its icon via CSS background image; the `&times;` text is removed and the button gets an accessible label. **Alternative:** keeping a local `.close` shim — rejected because the resulting markup would be a Bootstrap-4 idiom that no longer matches the rest of the button system.

Placing these in the override stylesheet keeps them after Bootstrap's own CSS in cascade order, which is where a local shim needs to be.

### D7. Migrate the navbar off the deprecated dark variant

`navigation.component.html` uses `navbar-dark bg-dark`, and `_bootstrap-override.scss` has two rules keyed on `.navbar-dark .navbar-nav .nav-link`. Bootstrap 5.3.0 deprecated `.navbar-dark` in favor of `data-bs-theme="dark"`. The template switches to `data-bs-theme="dark"` and the two override selectors are rewritten to match the equivalent elements under the new attribute, so the app leaves Bootstrap 4's naming behind instead of adopting a deprecated class on day one.

Design-level consequence worth calling out: the override currently hard-codes `#fff !important` for nav links. Under the new selector the same visual result is kept, but the rule is re-anchored to the elements that actually need it, which is how the "existing class contracts keep rendering" spec requirement is satisfied for the navbar.

### D8. Cascade order and Angular Material coexistence

The load order in `angular.json` (`bootstrap.min.css` -> `src/styles.scss` -> highlight.js -> KaTeX -> iziToast -> Angular Material prebuilt theme) is preserved, because the Codever overrides and the Material theme are both intended to win over Bootstrap. The two surfaces where Bootstrap and Angular Material compose — dialogs opened from the shared dialog components, and the notebook/markdown rendering path — are explicit visual checkpoints. No Material theme or CDK configuration changes.

### D9. Verification and revertibility

Baseline evidence is captured before any dependency change, and validation runs after each phase so Sass, wiring, and markup failures are attributable. Changes are grouped into conventional commits (`chore(ui)` for dependency and build wiring, `refactor(ui)`/`fix(ui)` for markup, `docs(ui)` for documentation) so a visual regression can be reverted by phase rather than by reverting the whole upgrade. Rollback is: revert the migration commits and reinstall from the previous lockfile.

Auth note (relevant to the UI): the Keycloak flow (`keycloak-angular`/`keycloak-js`) is untouched and is loaded through the Angular bundle, not through the CDN tags being removed, so removing those tags does not affect authentication. `HttpClientLocalStorageService` caching is also unaffected: no GET request, URL, cache key, or response shape changes, so existing cached entries stay valid and no cache version bump is needed. The only cache interaction is the service worker's prefetch group, which must pick up the newly hashed CSS/JS bundles.

## Risks / Trade-offs

- **[CSS payload grows ~43% (162,264 -> 232,111 bytes)]** -> Accepted and measured; the documented mitigation is a later change that switches to Sass partials and imports only used components. This design deliberately does not bundle that mitigation so the two effects can be measured separately.
- **[Bootstrap 5 reboots change default rendering: links are underlined by default, headings scale with the viewport (RFS is on by default), grid gutters narrow from 30px to 1.5rem, `ol`/`ul` left padding becomes 2rem, `<hr>` uses `height`, and component padding is unified around `$spacer`]** -> These are the most likely sources of unintended visual drift. Mitigated by capturing baseline screenshots at the documented widths and comparing after migration, and by treating any accepted difference as an explicit, recorded decision.
- **[The single Bootstrap modal in `core/error/error.component.html` may rely on Bootstrap 4 modal markup]** -> Verify it against Bootstrap 5 modal markup (dialog wrapper, `.modal-content`, and the dismiss button) during implementation rather than assuming a class rename is sufficient.
- **[jQuery removal could break a transitive consumer]** -> Verify `izitoast` and `ngx-highlightjs` are jQuery-free before removing the dependency, and confirm the app boots with `jquery` absent from `node_modules`.
- **[`.navbar-dark` deprecation]** -> Handled in D7; deliberately not deferred, so the codebase does not adopt a class that is already scheduled for removal.
- **[Service worker may serve a stale CSS bundle to an open tab]** -> The prefetch asset group covers hashed `/*.css` and `/*.js`; verify that a reload after deployment activates the new bundle, and record the observed behavior.
- **[Bundling Bootstrap JS adds ~80 KB to the JS bundle where the CDN tags were previously outside it]** -> Net effect is still a ~48% reduction in Bootstrap-related JavaScript bytes and one fewer round trip set, but the bundle-size comparison must report both the CSS growth and the JS reduction together rather than one of them.

## Migration Plan

1. **Baseline.** Branch from the recorded commit; run `npm run build`, `npm run build:aot`, `npm run lint`, `npm test -- --watch=false --browsers=ChromeHeadless`, and `npm run cy:run` where the Docker-backed environment is available. Capture production bundle sizes and screenshots at desktop/tablet/mobile widths.
2. **Dependencies.** Update `bootstrap` to `~5.3.8` and remove `jquery` in `apps/codever-ui/package.json`; regenerate `package-lock.json` with npm.
3. **Wiring.** Point the `angular.json` `styles` entry at the Bootstrap 5 stylesheet, add the Bootstrap bundle to `scripts`, and delete the three CDN tags from `src/index.html`.
4. **Styles.** Remove the dead `$icon-font-path`, add the local `.jumbotron` styles (D6), and rewrite the navbar override selectors (D7). Compile before touching templates so Sass failures are isolated from markup failures.
5. **Markup.** Apply the D5 mapping across templates, grouped by rule, with the D6 rewrites for `custom-file` and `close`.
6. **Validation.** Re-run the full command set, repeat the screenshot comparison, and check responsive behavior at 680px, 768px, 1000px, 1200px, 1349px, and 1600px, keyboard navigation and focus visibility, and that no third-party Bootstrap/jQuery/Popper request remains.
7. **Docs and measurement.** Record the sizes from step 1 versus step 6, the selected Bootstrap version, the diff in Bootstrap-related JavaScript, and any intentional visual difference; update `apps/codever-ui/README.md` and any repo notes that describe Bootstrap 4 or the CDN script setup.
8. **Release / rollback.** Verify a clean install from the committed manifests and lockfile. Roll back by reverting the migration commits and reinstalling from the previous lockfile.

## Open Questions

- Which Lighthouse (or equivalent) budget to adopt, if any. The production configuration currently only warns on `anyComponentStyle` above 6kb and sets no initial-bundle budget, so any threshold is a new policy decision. It does not change the approach or the task breakdown.
- Whether to self-host Font Awesome and drop its CDN stylesheet. Independent concern with its own 386 usages; explicitly out of scope here.
- The trigger for the follow-up Sass-partials change (a specific size threshold, or a fixed follow-up). Deferred; the payload growth is known and accepted in the meantime.


