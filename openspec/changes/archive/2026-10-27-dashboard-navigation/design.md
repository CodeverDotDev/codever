## Context

See `proposal.md` for the problem and agreed route scope. The dashboard
currently renders seven section components in one tab group. Its component
loads the signed-in user's ID and user data, then passes those values to
sections that need them. The dashboard module already contains the section
components and is lazy-loaded at `/dashboard`.

The `/dashboard/tags` route currently redirects to the `tab=tags` query
parameter. The exact `/my-bookmarks` and `/my-notes` redirects are defined
before their lazy-loaded modules, whose nested create, edit, clone, copy, and
detail paths must remain accessible. Some dashboard-related links target the
generic overview; tag-specific links should target the new tags page.

## Goals / Non-Goals

**Goals:**

- Use `/dashboard` as the authenticated overview and give each section its
  own authenticated path.
- Reuse the existing section components and preserve their inputs, layout,
  and behavior.
- Keep the current nested bookmark and note action routes working.
- Update exact root redirects and section-specific internal links.

**Non-Goals:**

- Do not change bookmark, note, tag, search, follow, or share functionality.
- Do not move create, edit, clone, copy, or detail routes under `/dashboard`.
- Do not preserve query-parameter section selection.
- Do not change APIs, data models, authentication policy, or dependencies.

## Decisions

### Use explicit routes within the existing lazy dashboard module

Define a route for the overview and one route for each section in
`user-dashboard.module.ts`. Use route metadata to identify which section a
shared section-page host displays. `/dashboard/tags` becomes a real page
instead of redirecting to a query parameter. Keep the dashboard module
lazy-loaded from the existing top-level `/dashboard` route.

**Alternative considered:** Keep the tab group and add another navigation
layer. Rejected because it retains the cramped tab navigation that caused the
problem.

### Reuse section components through one route host

Keep `UserDashboardComponent` as the landing page. Add a section-page host
that reads the route's section identifier, obtains the signed-in user's
identity and user-data stream through the existing stores, and renders the
matching section component. Pass `userId` and `userData$` to bookmarks and
tags as today; pass `userId` to sections that require it. Let saved searches
continue using their existing user-data store behavior.

**Alternative considered:** Duplicate each section's view or data-loading
logic in a new page. Rejected because it risks behavior drift and
unnecessarily replaces working components.

### Keep authentication protection on every dashboard destination

Apply the existing `AuthGuard` to the overview and all seven section routes.
The change affects authenticated personal UI routes only; it does not alter
Keycloak configuration or backend authorization.

### Preserve action routes and redirect only exact legacy roots

Change exact `/my-bookmarks` and `/my-notes` destinations to
`/dashboard/bookmarks` and `/dashboard/notes`. Keep their existing nested
lazy-loaded route modules and use full-path matching for the redirects.
Leave resource detail links and create/edit/clone/copy flows on their current
paths. Update tag-specific links to `/dashboard/tags`; generic dashboard
links continue to `/dashboard`.

Old `/dashboard?tab=...` values no longer select sections; `/dashboard`
shows the overview regardless of that query parameter.

### Use the existing visual system for the overview

Present the seven destinations as grouped links with short descriptions:

- **Your content:** bookmarks, notes, and tags.
- **Search:** saved searches.
- **Community:** following, followers, and Shared by me.

Use existing Bootstrap layout conventions and make the groups responsive.
Do not embed the section components or their data views on the overview.

### Label each section page

Show the matching section title beside the dashboard back link on every
section page. Keep the existing section component content and layout intact.

### Verify routing and unchanged section behavior at the UI boundary

Replace tab-index/query-mapping tests with tests for overview grouping,
section links, direct route selection, authentication protection, and the
legacy exact-root redirects. Update Cypress dashboard coverage to visit the
new bookmarks route and confirm existing sorting/filtering still works.
Check that nested bookmark/note action URLs continue resolving and that
tag-specific links land on the tags page.

## Risks / Trade-offs

- [Risk] A route host may not pass the identity or user-data values expected
  by an existing section → Keep the current component inputs and verify each
  route renders with authenticated user data.
- [Risk] Old bookmarked query URLs will now open the overview instead of a
  selected section → This compatibility is explicitly out of scope; direct
  section URLs are the supported destinations.
- [Risk] An overly broad legacy redirect could intercept nested actions →
  Retain exact full-path matching and test representative nested routes.
- [Risk] A section-specific link may keep pointing to the overview →
  Audit dashboard-related links and update tag-specific destinations.

## Migration Plan

No data or server migration is required. Deploy the UI route and navigation
changes together. If rollback is needed, restore the prior dashboard module
and exact legacy redirect destinations; no persisted data is affected.
