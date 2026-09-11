# legacy-dashboard-route-redirects Specification

## Purpose

Provides predictable in-application destinations for legacy personal bookmark and note URLs by routing users to the equivalent dashboard tabs.

## Requirements

### Requirement: Legacy bookmark URL opens the dashboard bookmarks tab

The SPA SHALL redirect an exact navigation to `/my-bookmarks` to `/dashboard?tab=bookmarks`.

#### Scenario: User opens the legacy bookmarks URL

- **WHEN** an unauthenticated or authenticated browser navigation resolves the exact SPA path `/my-bookmarks`
- **THEN** the SPA SHALL navigate to `/dashboard?tab=bookmarks`

### Requirement: Legacy note URL opens the dashboard notes tab

The SPA SHALL redirect an exact navigation to `/my-notes` to `/dashboard?tab=notes`.

#### Scenario: User opens the legacy notes URL

- **WHEN** an unauthenticated or authenticated browser navigation resolves the exact SPA path `/my-notes`
- **THEN** the SPA SHALL navigate to `/dashboard?tab=notes`

### Requirement: Existing nested personal routes remain available

The legacy root redirects SHALL NOT redirect or otherwise change nested personal bookmark and note routes.

#### Scenario: User opens a nested bookmark route

- **WHEN** a browser navigation resolves a path such as `/my-bookmarks/new` or `/my-bookmarks/:id/edit`
- **THEN** the SPA SHALL continue resolving that nested bookmark route rather than redirecting to the dashboard bookmarks tab

#### Scenario: User opens a nested note route

- **WHEN** a browser navigation resolves a path such as `/my-notes/new` or `/my-notes/:id/edit`
- **THEN** the SPA SHALL continue resolving that nested note route rather than redirecting to the dashboard notes tab

