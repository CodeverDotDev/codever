## 1. API: persist the tab order (codever-api)

- [x] 1.1 Add `ALLOWED_HOME_TABS = ['feed', 'history', 'pinned',
  'read-later']` to `src/common/constants.js` and `homeTabs: { type:
  [String], default: undefined }` to the `User` schema in
  `src/model/user.js`; verify by saving a new user in a unit test and
  asserting `homeTabs` is absent.
- [x] 1.2 Add `updateHomeTabs(homeTabs, userId)` to `user-data.service.js`.
  It throws `ValidationError` unless the input is an exact permutation of
  the allowed ids, then `$set`s it. Verify with cases in
  `user-data.service.test.js` (valid, missing, unknown value, duplicate,
  missing tab).
- [ ] 1.3 Add `PATCH /:userId/home-tabs` to `user.router.js` with
  `keycloak.protect()` and `validateUserId`, responding `200 { homeTabs }`.
  Verify in `user.router.integration-test.js`: 200 plus `GET` returns the
  order, 400 for an invalid body, 401 for another user's id.
- [ ] 1.4 Document the endpoint and the `homeTabs` property of `UserData`
  in `docs/openapi/openapi.yaml`; verify the spec renders at `/api/docs`.

## 2. UI: tab model and store (codever-ui)

- [x] 2.1 Create `core/home-tabs/home-tabs.ts` with `HomeTabId`,
  `DEFAULT_HOME_TABS`, tab metadata (label, icon, path, title) and
  `resolveHomeTabs()`; verify with a Vitest spec (valid permutation kept;
  undefined, partial, duplicate or unknown values fall back to default).
- [x] 2.2 Add `homeTabs?: HomeTabId[]` to `UserData`,
  `updateHomeTabs()` to `UserDataService` and `updateHomeTabs$()` to
  `UserDataStore` (pattern of `updateFeedToggleOption$`); verify with a
  Vitest spec asserting the PATCH URL and body and the store emission.

## 3. UI: tab pages and shell (codever-ui)

- [ ] 3.1 Extract `FeedPageComponent`, `HistoryPageComponent`,
  `PinnedPageComponent` and `ReadLaterPageComponent` from
  `HomepageComponent`. Each keeps its template block, store call,
  pagination caller, `?page=` handling and logged-out prompt, with the
  login `redirectUri` set to its own path. The Feed page keeps the logo
  reset. Verify with `ng build` and by checking each page manually,
  logged in and logged out.
- [ ] 3.2 Create `HomeTabsComponent` (external `.html`/`.scss`) with a
  `mat-tab-nav-bar` built from `resolveHomeTabs(userData.homeTabs)`,
  `routerLinkActive` highlighting and a `<router-outlet>`; verify that
  the active tab follows the URL when switching tabs.
- [ ] 3.3 Add the CDK drop list, a `cdkDragHandle` grip shown only to
  signed-in users, and a `drop()` that reorders, calls
  `updateHomeTabs$()` and reverts on error. Verify with a Vitest spec for
  `drop()` (reorder, save called, revert on error) and manually that
  clicking a tab still navigates.
- [x] 3.4 Implement `homeRedirectGuard`: legacy `tab` -> `/<tab>` keeping
  `page`; signed-in users -> first resolved tab (with a timeout fallback);
  otherwise -> `/feed`. Verify with a Vitest spec covering each branch,
  including an unknown `tab` value and the timeout.
- [ ] 3.5 Redirect the legacy `/public/...` prefix to the equivalent
  root-level path in `app.routing.ts`. Rewrite
  landing routes in `public.module.ts` as in design.md, add `readlater`
  -> `/read-later`, delete the `history`, `pinned`, `favorites` and
  `watched-tags` redirects and remove `HomepageComponent`; verify `ng lint`
  and `ng build` pass and that `/favorites` no longer lands on the homepage.

## 4. UI: update links (codever-ui)

- [x] 4.1 Point the About page links to `/history`, `/read-later` and
  `/pinned`, and change the `save-bookmark-form` navigation to
  `/history`; verify with a grep showing no `tab=` landing links remain
  outside the guard.

## 5. End-to-end verification

- [ ] 5.1 Update `cypress/e2e/public/homepage.cy.ts`: `/` redirects to
  `/feed`, the tab links navigate to the pages and show their alerts, and
  `/?tab=pinned` redirects to `/pinned`. Verify that `npm run cy:run`
  passes for this spec.
- [ ] 5.2 Manual check with the `mock` user: drag Pinned to the first
  position, reload `/` and land on `/pinned`, and confirm the order
  persists in another browser profile.
