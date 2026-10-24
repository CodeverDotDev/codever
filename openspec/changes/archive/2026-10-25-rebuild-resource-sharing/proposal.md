## Why

Owners can currently generate reusable sharing links, but cannot see all
shared resources or revoke access. Since existing sharing links need not
survive, Codever can replace the legacy mechanism directly instead of
hardening it temporarily and migrating it later.

## What Changes

- Introduce one active, reusable, read-only sharing link per bookmark or note,
  including Markdown and notebook notes. Anyone with the link can read the
  resource without signing in.
- Make creation explicit. Opening a dialog or checking sharing status never
  creates a link. Owners can copy the same link on subsequent visits.
- Add owner-only revocation. Sharing again requires an explicit action and
  produces a new URL; previously revoked URLs stay invalid.
- Add a paginated "Shared by me" dashboard view with resource title, type,
  sharing date, and Copy link, Open resource, and Stop sharing actions.
- Store server-generated credentials in a dedicated sharing model, separate
  from resource content. Store tokens in plaintext for this version to support
  repeat copying without encryption-key infrastructure.
- Limit anonymous responses to intended shared content; protect credentials
  from ordinary responses, logs, referrers, and persistent browser caching.
- **BREAKING**: Retire legacy `shareableId` resolution and the old
  create-on-GET endpoints. Existing sharing URLs stop working. Do not migrate
  credentials, delete resources, or change ordinary public resource URLs.
- Defer expiration, multiple simultaneous links per resource, encryption,
  access analytics, and a separate one-click rotation action. Replacement is
  Stop sharing followed by explicit creation.

## Capabilities

### New Capabilities

- `resource-sharing`: Reusable resource-scoped bearer links, authenticated
  owner management, anonymous read access, dashboard discovery, revocation,
  response privacy, and legacy-link retirement.

### Modified Capabilities

None. Existing public visibility, MCP creation/update contracts, and notebook
download behavior remain unchanged.

## Impact

- **codever-api**: Both personal authenticated routes and public anonymous
  retrieval routes change. Add sharing lifecycle and listing services using
  Router -> Service -> Model, explicit response mapping, sanitized errors,
  and tests. Resource deletion and ordinary write paths must respect sharing
  boundaries.
- **Mongoose models**: Add `ShareLink` with unique token and resource indexes.
  Retire `shareableId` from bookmark/note behavior; no credential backfill or
  mandatory destructive data cleanup is required.
- **codever-ui**: Update bookmark/note share dialogs, shared detail views,
  typed API services, and dashboard navigation. Keep public-link sharing
  distinct from revocable bearer-link access.
- **Operations**: Coordinate API/UI cutover, redact shared URLs in application
  and proxy logs, and apply no-store/referrer protections to shared pages.
  Rolling back must not silently restore legacy access.
- **Dependencies**: Use Node's built-in cryptographic randomness. No encryption
  service or new infrastructure is required for this first version.
- **Source material**: The audit and actions plans in
  `documentation/requirements/migrate-to-docker/`
  `update-sharable-links-functionality` inform this change. Their staged
  on-resource-token design and migration steps are superseded here; the
  original documents remain unchanged.
