# dashboard-navigation Specification

## Purpose

Makes personal dashboard features easier to discover and reach through a
clear overview and individually addressable pages.

## Requirements

### Requirement: Dashboard landing page guides users to personal sections

The authenticated `/dashboard` page SHALL present an overview rather than
rendering a personal section inside a tab group. It SHALL group links to
bookmarks, notes, and tags under "Your content"; saved searches under
"Search"; and following, followers, and Shared by me under "Community".
Each link SHALL include a brief description of its destination.

#### Scenario: User opens the dashboard landing page
- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the page displays the three section groups and their descriptions
- **AND** each of the seven personal sections has a visible navigation link

#### Scenario: User opens the dashboard with an old tab query
- **WHEN** an authenticated user navigates to `/dashboard?tab=notes`
- **THEN** the dashboard displays its overview page
- **AND** the query parameter does not select or render a section

### Requirement: Dashboard sections have separate authenticated URLs

The seven existing personal dashboard sections SHALL be available at:
`/dashboard/bookmarks`, `/dashboard/notes`, `/dashboard/tags`,
`/dashboard/searches`, `/dashboard/following`, `/dashboard/followers`, and
`/dashboard/shared`. Each route SHALL display its corresponding existing
section with its current layout and functionality. Each route SHALL require
authentication.

#### Scenario: User follows a section link
- **WHEN** an authenticated user selects a section link from `/dashboard`
- **THEN** the browser navigates to that section's dashboard URL
- **AND** the corresponding existing section is displayed

#### Scenario: User opens a section URL directly
- **WHEN** an authenticated user directly navigates to any of the seven
  dashboard section URLs
- **THEN** the matching section is displayed without requiring prior
  navigation through the overview
- **AND** the page displays its section label beside the dashboard back link

#### Scenario: Unauthenticated user opens a dashboard section
- **WHEN** an unauthenticated user navigates to a dashboard section URL
- **THEN** the existing authentication protection is applied

#### Scenario: Existing section behavior remains available
- **WHEN** a user opens a section at its new dashboard URL
- **THEN** that section retains its current actions, content, and layout
