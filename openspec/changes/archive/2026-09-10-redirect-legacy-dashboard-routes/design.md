## Context

The application currently lazy-loads `/my-bookmarks` and `/my-notes` as separate feature routes. Their root destinations are not the desired personal landing experience, while `/dashboard` already selects the bookmarks and notes views through the `tab` query parameter. The redirect must be limited to exact root paths so existing nested create, edit, details, clone, and copy routes continue to work.

## Goals / Non-Goals

**Goals:**

- Resolve exact `/my-bookmarks` navigation to `/dashboard?tab=bookmarks`.
- Resolve exact `/my-notes` navigation to `/dashboard?tab=notes`.
- Preserve nested routes under both legacy prefixes.
- Keep the change within Angular SPA routing.

**Non-Goals:**

- No Nginx or other server-level redirects.
- No changes to public SEO URLs.
- No changes to dashboard tab behavior, authentication, APIs, or feature-module child routes.

## Decisions

- **Use exact-match Angular redirect routes.** Add root redirect entries with `pathMatch: 'full'` and static dashboard query parameters. This prevents the redirect from matching nested paths.
  - **Alternative considered:** `pathMatch: 'prefix'` would also redirect nested routes and break existing bookmark and note actions, so it is rejected.
- **Place redirects before the existing lazy-loaded routes.** Angular route matching is order-sensitive; placing the exact redirects before the current `my-bookmarks` and `my-notes` module entries ensures the legacy roots no longer load their feature-module root destinations.
  - **Alternative considered:** Removing the existing routes would also remove access to their nested child routes, so it is rejected.
- **Keep the server configuration unchanged.** These are application-navigation aliases rather than public-resource or SEO redirects, so the SPA is the appropriate handling layer.
  - **Alternative considered:** Nginx `301` rules would affect direct HTTP requests and SEO behavior, which is intentionally outside this change.

## Risks / Trade-offs

- [Risk] Direct requests may still initially load the SPA before Angular performs the redirect → Mitigated by keeping this explicitly scoped to in-application SPA behavior; server-level behavior is intentionally unchanged.
- [Risk] A route-ordering mistake could intercept nested routes → Mitigated by exact `pathMatch: 'full'` redirects and focused route tests for both root and nested paths.

