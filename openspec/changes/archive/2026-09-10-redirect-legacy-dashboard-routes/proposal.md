## Why

The legacy `/my-bookmarks` and `/my-notes` URLs currently load feature-module roots that do not provide a usable landing page, resulting in an empty page for users. Redirecting these established URLs to the corresponding dashboard tabs restores a functional destination while preserving the dashboard as the central personal-resource experience.

## What Changes

- Redirect `/my-bookmarks` to `/dashboard?tab=bookmarks`.
- Redirect `/my-notes` to `/dashboard?tab=notes`.
- Apply the redirects in the Angular SPA route configuration for in-application navigation.
- Keep existing child routes such as `/my-bookmarks/new` and `/my-notes/:id/edit` unchanged.
- Add focused verification for the Angular route redirects.
- Keep SEO and public-resource redirect behavior out of scope.

## Capabilities

### New Capabilities

- `legacy-dashboard-route-redirects`: Redirect legacy personal bookmark and note entry URLs to their equivalent dashboard tabs.

### Modified Capabilities

<!-- No existing OpenSpec capabilities are present in this repository. -->

## Impact

- Angular routing in `apps/codever-ui/src/app/app.routing.ts`.
- Frontend route tests.
- No API, database, authentication, or dependency changes are expected.

