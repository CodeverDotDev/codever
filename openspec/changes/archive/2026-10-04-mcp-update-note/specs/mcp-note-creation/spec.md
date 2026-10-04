## ADDED Requirements

### Requirement: Partial note update

The system SHALL expose `update_note` to authorized write-enabled MCP connections. It SHALL require a valid note `id` and SHALL modify only the fields explicitly supplied among `title`, `content`, `tags`, `reference`, and `public`; omitted fields SHALL remain unchanged. `tags`, when present, SHALL be the complete desired list following the `entry-tagging-policy` capability, and `content` SHALL obey the existing 30,000-character limit. The update SHALL be scoped to the authenticated user's own note; a missing id or a note owned by another user SHALL return not-found without disclosing content. Updates SHALL be idempotent and retry-safe.

#### Scenario: Change a single field
- **WHEN** an authorized user calls `update_note` with a valid `id` and only `title`
- **THEN** the note's title is updated and its content, tags, reference, and visibility are unchanged

#### Scenario: Change multiple fields
- **WHEN** an authorized user calls `update_note` with a valid `id` and supplies both `title` and `tags`
- **THEN** only those two fields change and all other fields are preserved

#### Scenario: Tags replace the complete list
- **WHEN** `update_note` supplies a `tags` array
- **THEN** the note's tags are replaced by the normalized supplied list, subject to the thirteen-tag ceiling
- **AND** tags not in the supplied list are removed

#### Scenario: Update with no editable fields
- **WHEN** `update_note` is called with only an `id` and no editable fields
- **THEN** the call returns an MCP validation error and performs no write

#### Scenario: Missing or foreign note
- **WHEN** `update_note` is called with a missing id, or with the id of a note owned by another user
- **THEN** the call returns not-found and performs no write, and the note's content and metadata are not disclosed

#### Scenario: Invalid content or tags
- **WHEN** `update_note` supplies blank content, content over 30,000 characters, or fourteen normalized unique tags
- **THEN** the call returns an actionable MCP validation error and the stored note is unchanged

#### Scenario: Successful update result
- **WHEN** `update_note` succeeds
- **THEN** the result contains the persisted `id`, `type`, `title`, normalized `tags`, `contentType`, `public`, timestamps, and an authenticated `/my-notes/<id>/details` URL
- **AND** the result does not echo full content or expose internal fields

## MODIFIED Requirements

### Requirement: Opt-in write access and read-only compatibility

Note creation and update SHALL require valid authentication for the MCP resource, both per-user `mcpServer` and `mcpCreateNotes` entitlements, and both `mcp:read` and `mcp:write` scopes. Write scope SHALL be opt-in, not automatically granted to existing read-only connections. Read-only tool discovery SHALL continue to expose `search_entries`, `get_entry`, and `list_tags` without `create_note` or `update_note`. Read-only calls and existing non-mutating prompts SHALL remain usable without write scope. OAuth resource metadata SHALL advertise both supported scopes without granting them.

#### Scenario: Read-only token
- **WHEN** a user enabled for both toggles connects with a valid `mcp:read` token lacking `mcp:write`
- **THEN** the three existing read tools remain available and `create_note` and `update_note` are absent from tool discovery
- **AND** directly requesting `create_note` or `update_note` returns an MCP error and performs no write

#### Scenario: Explicitly write-enabled token
- **WHEN** a user enabled for both toggles connects with a valid token containing both scopes
- **THEN** `create_note` and `update_note` are available alongside the existing read tools
- **AND** a valid call can create or update a note for that user

#### Scenario: Invalid authentication
- **WHEN** `/api/mcp` receives a missing, invalid, or wrong-audience token
- **THEN** it returns HTTP 401 with the existing OAuth authentication challenge and performs no write

#### Scenario: Missing endpoint scope or disabled access
- **WHEN** a valid token lacks `mcp:read`, even if it has `mcp:write`, or the user's `mcpServer` access is disabled, even if `mcpCreateNotes` is enabled
- **THEN** the endpoint returns HTTP 403 and performs no write

#### Scenario: MCP credential used against ordinary write routes
- **WHEN** an MCP-only audience token is presented to an ordinary personal REST write endpoint
- **THEN** that endpoint rejects the credential under its existing authorization behavior
- **AND** adding MCP creation does not grant general REST write access
