# mcp-note-creation Specification

## Purpose

Enable authenticated agents to save Markdown notes with optional source and project context, while preserving read-only connections and returning a usable link to the saved note.

## Requirements

### Requirement: Markdown note creation

The system SHALL expose `create_note` to authorized write-enabled MCP connections. It SHALL accept nonblank string `title` and `content`, optional string-array `tags`, optional string `reference`, optional `origin` with string `location`, `file`, `project`, and `workspace` fields, and optional boolean `public`. The note SHALL be saved for the authenticated user with type `note` and content type `markdown`. Markdown content SHALL be preserved, including code fences and language labels, and SHALL NOT exceed 30,000 characters. Tags SHALL follow the `entry-tagging-policy` capability.

#### Scenario: Save prose and snippets as one note
- **WHEN** an authorized user supplies a valid title and Markdown containing prose and multiple language-labelled code blocks
- **THEN** one Markdown note is persisted for that user with the submitted content intact
- **AND** no separate snippet entry is created

#### Scenario: Minimal input
- **WHEN** an authorized user supplies only a valid title and content
- **THEN** the saved note is private with no tags and no inferred reference or origin metadata

#### Scenario: Invalid required content
- **WHEN** title or content is missing, has the wrong type, is blank, or content exceeds 30,000 characters
- **THEN** the call returns an MCP validation error and creates no note

#### Scenario: Unsupported creation inputs
- **WHEN** the call supplies a notebook payload, caller-selected content type, collection assignment, or other unsupported field
- **THEN** the call returns an MCP validation error and creates no note

### Requirement: Token-bound ownership and explicit visibility

The system SHALL derive ownership exclusively from the authenticated token and SHALL reject caller-supplied ownership or internal persistence fields. It SHALL default visibility to private and SHALL only create a public note when `public: true` is explicitly supplied.

#### Scenario: Caller attempts to choose another owner
- **WHEN** the call includes `userId`, an ID, a shareable ID, timestamps, or other internal fields
- **THEN** it returns an MCP validation error and persists no note for either user

#### Scenario: Explicit public creation
- **WHEN** an authorized user submits valid content and explicitly sets `public: true`
- **THEN** the saved note is public
- **AND** the creation result reports that visibility without automatically creating a shareable link

### Requirement: Optional source and project context round-trip

The system SHALL preserve supplied reference and origin fields, SHALL NOT invent omitted fields, and SHALL include supplied origin metadata in the creation result and subsequent authorized `get_entry` response. Reference and origin values SHALL be treated as data, not requests to fetch remote content or read local files.

#### Scenario: Partial project context
- **WHEN** a note is created with a reference URL and only `origin.project` and `origin.file`
- **THEN** those values are saved and returned by creation and the owner's subsequent `get_entry` call
- **AND** no workspace or location is inferred and no collection is created or assigned

#### Scenario: Another user requests the created note
- **WHEN** a different authenticated user requests that note through `get_entry`
- **THEN** the existing not-found behavior is preserved and the note's content and metadata are not disclosed

### Requirement: Opt-in write access and read-only compatibility

Creation SHALL require valid authentication for the MCP resource, both per-user `mcpServer` and `mcpCreateNotes` entitlements, and both `mcp:read` and `mcp:write` scopes. Write scope SHALL be opt-in, not automatically granted to existing read-only connections. Read-only tool discovery SHALL continue to expose `search_entries`, `get_entry`, and `list_tags` without `create_note`. Read-only calls and existing non-mutating prompts SHALL remain usable without write scope. OAuth resource metadata SHALL advertise both supported scopes without granting them.

#### Scenario: Read-only token
- **WHEN** a user enabled for both toggles connects with a valid `mcp:read` token lacking `mcp:write`
- **THEN** the three existing read tools remain available and `create_note` is absent from tool discovery
- **AND** directly requesting `create_note` returns an MCP error and performs no write

#### Scenario: Explicitly write-enabled token
- **WHEN** a user enabled for both toggles connects with a valid token containing both scopes
- **THEN** `create_note` is available alongside the existing read tools
- **AND** a valid call can create a note for that user

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

### Requirement: Independent default-off creation toggle

The system SHALL provide a per-user `mcpCreateNotes` toggle using an `enabledUserIds` allowlist, shipped empty. Missing, malformed, or empty creation-toggle configuration SHALL deny creation. Enabling creation SHALL NOT implicitly enable general MCP access or grant write scope. Creation eligibility SHALL be enforced during tool discovery and rechecked during execution before saving. Disabling creation SHALL take effect for subsequent execution checks without a backend restart or token revocation; it SHALL NOT disable otherwise authorized reads, change the thirteen-tag policy, or remove existing notes. A save already admitted before disablement is not required to be cancelled.

#### Scenario: Default-off creation with a write-capable token
- **WHEN** a user has `mcpServer` access and both scopes but the creation toggle is missing, malformed, empty, or does not include the user
- **THEN** `create_note` is absent from tool discovery and a direct invocation returns an MCP error without saving
- **AND** authorized search, read, and tag-list calls remain available

#### Scenario: Creation disabled after discovery
- **WHEN** a client has discovered `create_note`, the user's creation access is then disabled, and the client attempts a new creation call with its still-valid write-capable token
- **THEN** the call returns an MCP error and no new note is saved
- **AND** an execution-time denial from an already-registered handler is returned with `isError: true`
- **AND** reads continue without requiring a server restart or new token

#### Scenario: Enablement is per user
- **WHEN** one user's ID is added to the creation allowlist while another MCP user's ID is absent
- **THEN** only the included user with both scopes can discover and execute creation
- **AND** the second user retains only their existing read access

#### Scenario: Creation rollback leaves saved entries and tag policy intact
- **WHEN** creation is disabled after a note with thirteen tags was saved
- **THEN** the note remains available to its authorized owner
- **AND** normal note/bookmark editing still permits thirteen tags and AI refinements still recommend at most eight where possible

### Requirement: Local-first verification

The change SHALL provide a documented local testing path using the development identity/database services, MCP at `http://localhost:3000/api/mcp`, and frontend links at `http://localhost:4200`. Development token tooling SHALL retain read-only behavior by default and SHALL offer an explicit write-scope option that does not bypass either toggle or alter the token audience. The runbook SHALL cover local-only user enablement, optional scope setup for fresh and existing realms, startup, allow/deny checks, link verification, and creation-only disablement without requiring production enablement.

#### Scenario: Local helper remains read-only by default
- **WHEN** the developer requests a token with the development helper's default options
- **THEN** the helper does not request `mcp:write` and the issued default-client token cannot authorize creation

#### Scenario: Explicit local write test
- **WHEN** the local realm supports optional `mcp:write`, the developer explicitly requests it, and the local test user is enabled for both toggles
- **THEN** that user can create a note in the local environment and follow the returned local frontend link
- **AND** no production identity, database, or toggle change is required

#### Scenario: Local creation kill switch
- **WHEN** the local test user keeps both scopes and `mcpServer` access but is removed from `mcpCreateNotes`
- **THEN** a subsequent creation attempt is denied without saving while local search/read calls continue to succeed

### Requirement: Recommended preview and confirmation

The creation tool's discoverable guidance and connection documentation SHALL instruct agents to show the draft title, full content, tags, visibility, reference, and supplied project context; obtain user confirmation; apply requested revisions; then invoke creation and present the saved link. The guidance SHALL strongly recommend at most eight relevant tags where possible and SHALL discourage invented or unsolicited local metadata. Documentation SHALL explicitly state that preview rendering and confirmation depend on the agent/client and are not server-enforced.

#### Scenario: Agent discovers creation guidance
- **WHEN** a write-enabled client retrieves tool metadata
- **THEN** the creation description includes preview, confirmation, the eight-tag recommendation, and presenting the returned link
- **AND** annotations identify creation as a write operation that is not idempotent

#### Scenario: No server draft prerequisite
- **WHEN** an authorized client directly calls `create_note` with valid inputs and no draft ID or confirmation token
- **THEN** the server saves the note without requiring an additional preview/confirmation endpoint

### Requirement: Saved-note result and authenticated link

Successful creation SHALL return an MCP success result containing the persisted `id`, `type`, `title`, normalized `tags`, `contentType`, `public`, timestamps, supplied reference/origin metadata, and an absolute `url` to the authenticated `/my-notes/<id>/details` page. The link SHALL use the deployment's configured frontend base, not the caller's Host/Origin headers or an assumed API origin. The response SHALL NOT expose credentials, internal fields, or generate a public sharing token.

#### Scenario: Local UI and API use different ports
- **WHEN** a note is saved with the frontend configured at `http://localhost:4200` and MCP served at port 3000
- **THEN** the returned URL uses port 4200 and the saved note's authenticated details path

#### Scenario: Production frontend link
- **WHEN** creation succeeds with a configured production frontend base
- **THEN** the returned URL uses that base and resolves to the newly saved note for its authenticated owner
- **AND** the result does not echo the full Markdown content

#### Scenario: Missing or invalid link configuration
- **WHEN** creation cannot construct a valid frontend link because configuration is missing or invalid
- **THEN** it returns a sanitized MCP tool error with `isError: true` before persistence
- **AND** existing read-only tools remain usable

### Requirement: Actionable creation failures

Business validation failures SHALL return an MCP tool error with `isError: true` and actionable validation details; schema-invalid arguments SHALL return an MCP validation error. Persistence failures SHALL return a sanitized tool error without stack traces, success identifiers, or a claimed saved-note link. Failed validation SHALL NOT create a note.

#### Scenario: Persistence operation fails
- **WHEN** the persistence operation reports a failure
- **THEN** the tool reports an error rather than a successful creation or link
- **AND** guidance does not recommend blind automatic retries of this non-idempotent operation

#### Scenario: Too many tags
- **WHEN** a valid creation request otherwise contains fourteen normalized unique tags
- **THEN** it returns an actionable validation error identifying the thirteen-tag ceiling and creates no note
