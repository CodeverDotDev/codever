## Why

The dashboard currently puts seven personal sections in one tab group, making
the tab labels difficult to discover and navigate. A clear landing page and
direct section URLs will make these existing features easier to find without
changing their content or behavior.

## What Changes

- Replace the tabbed dashboard view with an overview at `/dashboard`.
- Group links to the seven existing sections and describe what each page
  offers.
- Give each section a direct route: `/dashboard/bookmarks`,
  `/dashboard/notes`, `/dashboard/tags`, `/dashboard/searches`,
  `/dashboard/following`, `/dashboard/followers`, and `/dashboard/shared`.
- Redirect exact `/my-bookmarks` and `/my-notes` navigations to the matching
  dashboard pages; preserve nested create, edit, clone, copy, and detail
  routes under their current paths.
- Do not preserve the old `/dashboard?tab=...` section-selection URLs.
- Keep the existing section layouts and functionality unchanged.

## Capabilities

### New Capabilities

- `dashboard-navigation`: Dashboard overview, grouped section links, and
  separately addressable personal dashboard pages.

### Modified Capabilities

- `legacy-dashboard-route-redirects`: Change the exact root destinations for
  `/my-bookmarks` and `/my-notes` to their new dashboard section routes.

## Impact

- **codever-ui**: Dashboard view, routes, route tests, and links into the
  dashboard.
- **Routes**: Affected routes are personal and authenticated. Section routes
  remain protected by the existing dashboard authentication guard.
- **APIs and Mongoose models**: No changes.
- **Dependencies**: No changes.
