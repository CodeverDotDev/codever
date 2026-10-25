## MODIFIED Requirements

### Requirement: Legacy bookmark URL opens the dashboard bookmarks tab

The SPA SHALL redirect an exact navigation to `/my-bookmarks` to
`/dashboard/bookmarks`.

#### Scenario: User opens the legacy bookmarks URL
- **WHEN** an unauthenticated or authenticated browser navigation resolves
  the exact SPA path `/my-bookmarks`
- **THEN** the SPA SHALL navigate to `/dashboard/bookmarks`

### Requirement: Legacy note URL opens the dashboard notes tab

The SPA SHALL redirect an exact navigation to `/my-notes` to
`/dashboard/notes`.

#### Scenario: User opens the legacy notes URL
- **WHEN** an unauthenticated or authenticated browser navigation resolves
  the exact SPA path `/my-notes`
- **THEN** the SPA SHALL navigate to `/dashboard/notes`
