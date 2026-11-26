## Context

See proposal.md - Why. Today `HomepageComponent` (route `''` in
`public.module.ts`) renders a `mat-tab-group` and drives four stores, four
page counters, and four pagination callers through a hard-coded
`TabIndex` enum mapped to `?tab=`. `public.module.ts` already redirects
`/history`, `/pinned`, and `/readlater` *to* `?tab=` URLs, plus two stale
targets (`favorites`, `watched-tags`). The dashboard made the same move
from `?tab=` to routes (`dashboard-navigation` spec).

On the API, small user-data preferences use dedicated `PATCH` endpoints in
`user.router.js` (`feed-toggle`, `local-storage`, `welcome-acknowledge`)
backed by `$set` updates in `user-data.service.js`. The UI mirrors each in
`UserDataStore` (optimistic in-memory update, then emit). User data is
fetched with plain `HttpClient`, not `HttpClientLocalStorageService`.

## Goals / Non-Goals

**Goals:**

- Each tab is a routed page with its own component and state, no shared
  index switch.
- Drag-to-reorder uses the already-installed `@angular/cdk/drag-drop`.
- One pure, unit-testable function decides the effective tab order.

**Non-Goals:**

- Changing any tab's content, list components, or pagination component.
- Keyboard reordering, hiding/adding tabs, a reset action (see proposal).
- SSR/SEO handling of the `/` redirect.

## Decisions

### 1. Routed shell with child pages

```
main.ts imports PublicResourcesModule eagerly, registering its child
routes at the application root.

app.routing.ts
  { path: 'public', redirectTo: '', pathMatch: 'prefix' }

public.module.ts
  { path: '', component: HomeTabsComponent, children: [
      { path: 'feed',       component: FeedPageComponent },
      { path: 'history',    component: HistoryPageComponent },
      { path: 'pinned',     component: PinnedPageComponent },
      { path: 'read-later', component: ReadLaterPageComponent },
      { path: '', pathMatch: 'full', canActivate: [homeRedirectGuard],
        children: [] },
  ]}
  { path: 'readlater', redirectTo: '/read-later' }
```

`HomeTabsComponent` holds the tab bar and a `<router-outlet>`. Each page
component takes over the matching slice of `HomepageComponent` (store call,
page counter from `?page=`, pagination caller, template block) and updates
`?page=` on pagination as today. The old `history`, `pinned`, `favorites`,
and `watched-tags` redirects are deleted (the first two would otherwise
shadow the new pages). The public module's existing eager root registration
provides the required URLs. Its `/public` lazy alias becomes a top-level
prefix redirect to the equivalent root-level path. `HomepageComponent` is
removed.

*Alternative:* keep one component and map routes to the tab index. Rejected:
it keeps the index coupling that makes reordering error-prone.

### 2. `homeRedirectGuard` handles `/` and legacy `?tab=`

A functional `CanActivateFn` returns a `UrlTree`:

1. If `tab` is one of the four known ids, redirect to `/<tab>` keeping
   `page`.
2. Else if signed in, wait for `UserDataStore.getUserData$()` (a
   `ReplaySubject` filled by `AppComponent` at start-up; `take(1)` with a
   short timeout falling back to the default) and redirect to the first
   entry of `resolveHomeTabs(...)`.
3. Else redirect to `/feed`.

Unknown `tab` values fall through to steps 2-3. The login `redirectUri`
becomes `APP_HOME_URL + '/<tab>'`. About-page links and
`save-bookmark-form` navigation point to the new paths directly.

### 3. Effective order via `resolveHomeTabs`

`core/home-tabs/home-tabs.ts` exports the `HomeTabId` union, the
`DEFAULT_HOME_TABS` constant, tab metadata (label, icon, path, shortcut
title), and `resolveHomeTabs(saved?: string[]): HomeTabId[]`. It returns
`saved` when it is an exact permutation of the four ids, otherwise the
default. The guard and the tab bar both use it, so malformed stored data
can never break navigation.

### 4. Tab bar: `mat-tab-nav-bar` + CDK drop list

```
<nav mat-tab-nav-bar [tabPanel]="panel"
     cdkDropList cdkDropListOrientation="horizontal"
     (cdkDropListDropped)="drop($event)">
  @for (tab of tabs; track tab.id) {
    <a mat-tab-link [routerLink]="tab.path" routerLinkActive
       #rla="routerLinkActive" [active]="rla.isActive"
       cdkDrag [cdkDragDisabled]="!loggedIn"
       cdkDragLockAxis="x">
      @if (loggedIn) { <i class="fas fa-grip-vertical" cdkDragHandle></i> }
      <i [class]="tab.icon"></i> {{ tab.label }}
    </a>
  }
</nav>
<mat-tab-nav-panel #panel><router-outlet /></mat-tab-nav-panel>
```

`drop()` calls `moveItemInArray`, then `UserDataStore.updateHomeTabs$()`.
On error it restores the previous array and calls `ErrorService` to show an
error message. Because `cdkDragHandle` is present, only the grip starts a
drag; a normal click on the link still navigates.

*Alternative:* CDK drag on a `mat-tab-group` header. Rejected: the header
DOM is internal to Material, and making it draggable means fighting it.

### 5. API: dedicated endpoint, validated in the service

- `user.js` schema: `homeTabs: { type: [String], default: undefined }`.
  `default: undefined` stops Mongoose from storing `[]` on every user,
  so a missing field still means the default order.
- `user.router.js`: `PATCH /:userId/home-tabs` with `keycloak.protect()`
  and `userIdTokenValidator.validateUserId(request)`, like
  `feed-toggle`. Responds `200 { homeTabs }`.
- `user-data.service.js`: `updateHomeTabs(homeTabs, userId)` throws
  `ValidationError` unless `homeTabs` is an exact permutation of the
  allowed ids (kept in `common/constants.js`), then `$set`s it.
- OpenAPI: new path plus `homeTabs` on the `UserData` schema.

Router -> Service -> Model; no controller layer.

### 6. UI store and model

`UserData.homeTabs?: HomeTabId[]`; `UserDataService.updateHomeTabs(...)`
(`PATCH`); `UserDataStore.updateHomeTabs$(...)` follows the
`updateFeedToggleOption$` pattern. Nothing touches localStorage: user data
is not cached through `HttpClientLocalStorageService`.

## Risks / Trade-offs

- [The full-document `PUT` user data path does not validate `homeTabs`, so
  a client could store junk] -> `resolveHomeTabs` falls back to the
  default; that path is not used for ordering.
- [`mat-tab-nav-bar` scroll/pagination arrows may interfere with drag on
  narrow screens] -> four short labels fit on mobile; verify in a small
  viewport, fall back to `cdkDropListAutoScrollDisabled` if needed.
- [Logo click previously reset the Feed to page 1 in place] -> the logo
  links to `/`, which redirects to the first tab at page 1; the Feed page
  keeps listening to `logoClicked` for when it is already active.
- [External bookmarks of `/?tab=...`] -> covered by the guard's legacy
  branch.
- [Extra request on `/` for signed-in users] -> none; user data is already
  loaded at app start and the guard reuses the store.
- [User-data load fails or is slow, so the guard would hang on `/`] ->
  guard timeout falls back to `/feed`.
- [A new user whose user data is being created] -> the created document
  has no `homeTabs`, so the default applies.

## Migration Plan

No data migration: existing users have no `homeTabs` and get the default.
Deploy the API first (the new field and endpoint are additive), then the
UI. Rollback: redeploy the previous UI. Stored `homeTabs` values are
ignored by older clients.
