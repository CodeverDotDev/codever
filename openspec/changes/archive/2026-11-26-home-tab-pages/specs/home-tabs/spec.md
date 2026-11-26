## Purpose

Makes the landing tabs (Feed, History, Pinned, Read Later) individually
addressable pages and lets signed-in users choose their order, with the first
tab acting as their home page.

## ADDED Requirements

### Requirement: Landing tabs are individual pages

The web UI SHALL serve the four landing tabs at `/feed`, `/history`,
`/pinned`, and `/read-later`. Each page SHALL show the same content,
empty-state messages, and logged-out login prompts as the corresponding tab
did before this change, and SHALL honor a `page` query parameter for
pagination. All four pages SHALL display a shared tab bar that links to each
page and highlights the active one.

#### Scenario: Open a tab page directly

- **WHEN** a signed-in user navigates to `/pinned?page=2`
- **THEN** the Pinned tab is highlighted and the second page of their
  pinned entries is shown

#### Scenario: Switch tabs

- **WHEN** a user on `/feed` clicks the History tab
- **THEN** the browser URL becomes `/history` and the History content is
  shown

#### Scenario: Logged-out user opens a personal tab page

- **WHEN** an anonymous visitor navigates to `/read-later`
- **THEN** the Read Later explanation with a Login / Register button is
  shown

#### Scenario: Login returns to the same page

- **WHEN** an anonymous visitor on `/history` clicks Login / Register and
  signs in successfully
- **THEN** they are returned to `/history`

### Requirement: Root redirects to the user's first tab

The web UI SHALL redirect `/` to the page of the first tab in the signed-in
user's saved tab order. When the visitor is anonymous, or the user has no
saved order, `/` SHALL redirect to `/feed`.

#### Scenario: User with a saved order

- **WHEN** a signed-in user whose saved order is
  `pinned, feed, read-later, history` navigates to `/`
- **THEN** they are redirected to `/pinned`

#### Scenario: Anonymous visitor

- **WHEN** an anonymous visitor navigates to `/`
- **THEN** they are redirected to `/feed`

#### Scenario: User without a saved order

- **WHEN** a signed-in user who has never reordered the tabs navigates to
  `/`
- **THEN** they are redirected to `/feed`

### Requirement: Default tab order

When no saved order exists, the tab bar SHALL show the tabs in the order
Feed, History, Pinned, Read Later.

#### Scenario: Default order shown

- **WHEN** an anonymous visitor opens `/feed`
- **THEN** the tab bar shows Feed, History, Pinned, Read Later in that order

### Requirement: Signed-in users reorder tabs by dragging

The web UI SHALL show a drag handle on each tab for signed-in users only.
Dragging a tab by its handle and dropping it in a new position SHALL
reorder the tab bar immediately and SHALL save the new order to the user's
data. The order SHALL then apply on every device the user signs in from.
Clicking a tab outside its handle SHALL still navigate to that tab. If
saving fails, the tab bar SHALL revert to the previous order and the user
SHALL be notified.

#### Scenario: Reorder tabs

- **WHEN** a signed-in user drags the Pinned tab handle before Feed
- **THEN** the tab bar shows Pinned, Feed, History, Read Later and the
  order is saved

#### Scenario: Order applies on another device

- **WHEN** the user later signs in on another browser and navigates to `/`
- **THEN** the tab bar shows Pinned, Feed, History, Read Later and they
  are redirected to `/pinned`

#### Scenario: No handles for anonymous visitors

- **WHEN** an anonymous visitor opens any tab page
- **THEN** no drag handles are shown and the tabs cannot be reordered

#### Scenario: Save fails

- **WHEN** a signed-in user reorders the tabs and the save request fails
- **THEN** the tab bar returns to the previous order and an error message
  is shown

### Requirement: Saving the tab order via the personal API

The API SHALL accept `PATCH /api/personal/users/:userId/home-tabs` with
body `{ "homeTabs": [...] }`, where `homeTabs` is an ordered list that MUST
contain each of `feed`, `history`, `pinned`, and `read-later` exactly once.
On success it SHALL store the order and respond `200` with
`{ "homeTabs": [...] }`. The user data returned by the API SHALL include
`homeTabs` once it has been saved.

#### Scenario: Valid order saved

- **WHEN** the authenticated user sends
  `{ "homeTabs": ["history", "feed", "pinned", "read-later"] }`
- **THEN** the API responds `200` with the same order and subsequent user
  data responses include it

#### Scenario: Invalid order rejected

- **WHEN** the body is missing `homeTabs`, contains an unknown value,
  repeats a value, or omits one of the four tabs
- **THEN** the API responds `400` with a `ValidationError` and the stored
  order is unchanged

#### Scenario: Unauthenticated request

- **WHEN** the request has no valid access token
- **THEN** the API rejects it without changing any data

#### Scenario: Another user's data

- **WHEN** the authenticated user sends the request for a different
  `:userId`
- **THEN** the API responds `401` with a `UseridValidationError`

### Requirement: Legacy landing URLs redirect

The web UI SHALL redirect `/?tab=feed`, `/?tab=history`, `/?tab=pinned`,
and `/?tab=read-later` to `/feed`, `/history`, `/pinned`, and
`/read-later` respectively, preserving any `page` query parameter. The
legacy path `/readlater` SHALL redirect to `/read-later`. Existing
`/public/...` URLs SHALL redirect to the equivalent root-level path,
preserving path suffixes and query parameters. An unrecognized `tab` value
SHALL be treated as `/` without a `tab` parameter. The paths `/favorites`
and `/watched-tags` SHALL no longer redirect to the landing page.

#### Scenario: Legacy tab link

- **WHEN** a user opens `/?tab=read-later&page=3`
- **THEN** they are redirected to `/read-later?page=3`

#### Scenario: Legacy readlater path

- **WHEN** a user opens `/readlater`
- **THEN** they are redirected to `/read-later`

#### Scenario: Unknown tab value

- **WHEN** a user opens `/?tab=favorites`
- **THEN** they are redirected as if they had opened `/`

#### Scenario: Existing public-prefixed URL

- **WHEN** a user opens `/public/bookmarks/abc`
- **THEN** they are redirected to `/bookmarks/abc`
