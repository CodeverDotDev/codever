# Codever MCP Demo — Architecture, Deployment, and Lessons Learned

**Tags:** mcp, mcp-server, codever, ai-engineering, github-copilot, oauth, docker

## Overview

This note documents the Codever MCP server demo, including the MCP concepts, server architecture, authentication model, deployment process, and reusable MCP prompts.

The workflow demonstrates how an AI assistant can use multiple MCP servers to complete a business workflow without manually copying context between systems.

## Demo workflow

The demo prompt is:

> Use the Codever MCP server to find my bookmarked link related to “Kundenblatt Abklärung”.
> Open the linked Confluence page.
> Analyze the “Zahlungsverbindungen” section.
> Implement the clarified requirements for Jira issue ONYX-4522.
> Update the issue’s acceptance criteria in Jira.
> Create a dedicated Git branch.
> Push the branch to GitLab.
> Create a merge request.
> Provide a final summary of the implemented changes.

### MCP server orchestration

```text
Codever
  │
  ├── Find the bookmark related to “Kundenblatt Abklärung”
  │
  ▼
Confluence
  │
  ├── Open the linked page
  ├── Analyze the “Zahlungsverbindungen” section
  │
  ▼
Jira
  │
  ├── Read ONYX-4522
  └── Update the acceptance criteria
  │
  ▼
GitLab
  │
  ├── Create a dedicated branch
  ├── Push the implementation
  └── Create a merge request
  │
  ▼
Final summary
```

The LLM orchestrates the sequence based on the results of previous tool calls. The user does not need to manually copy the bookmark URL into Confluence or copy the requirements into Jira.

## MCP concepts

MCP, or Model Context Protocol, standardizes how an AI assistant interacts with external systems.

The main MCP primitives are:

- **Tools** — callable operations such as searching bookmarks or updating a Jira issue.
- **Resources** — structured data that an AI assistant can read.
- **Prompts** — reusable templates that guide the assistant through a workflow.
- **Transports** — the communication mechanism between the MCP client and server.

Typical transports include:

- `stdio` for local processes
- HTTP-based transports for remote services
- Streamable HTTP for modern remote MCP servers

## Codever MCP server

The Codever MCP server is implemented in:

```text
apps/codever-api/src/mcp/
```

Important files:

```text
mcp.server.js
mcp.auth.js
mcp-tools.service.js
```

### Server characteristics

The Codever MCP server is:

- Built with the official MCP SDK
- Hosted inside the existing Express API
- Exposed through Streamable HTTP
- Protected with Keycloak OAuth
- Scoped to the authenticated user
- Read-only by architecture
- Stateless, with a new server instance created per request

## Exposed Codever tools

The server currently exposes three read-only tools.

### `search_entries`

Searches the authenticated user’s bookmarks and notes by text, tags, or type.

Example:

```json
{
  "text": "Kundenblatt Abklärung",
  "types": ["bookmark"],
  "limit": 10
}
```

### `get_entry`

Fetches the complete content of a bookmark or note.

Example:

```json
{
  "id": "bookmark-id",
  "type": "bookmark"
}
```

### `list_tags`

Lists the authenticated user’s tags and their usage counts.

Example:

```json
{
  "type": "bookmark"
}
```

No create, update, or delete tools are exposed. This prevents the Codever MCP server from modifying bookmarks or notes.

## Reusable Codever MCP prompts

The server also exposes reusable prompt templates.

### `find-and-summarize`

Arguments:

```text
topic — required
limit — optional
```

Workflow:

```text
search_entries → get_entry → briefing with sources
```

Example:

```text
Use the Codever find-and-summarize prompt for:

"Kundenblatt Abklärung"
```

This prompt searches the user’s saved entries, reads the most relevant results, and creates a concise briefing with links to the original sources.

### `weekly-digest`

Arguments:

```text
tags — optional
```

Workflow:

```text
search_entries → grouped digest → follow-up action
```

Example:

```text
Use the Codever weekly-digest prompt for the tag:

"mcp"
```

This prompt summarizes saved entries related to a tag, groups them into themes, and suggests a follow-up action.

### `tag-cleanup`

Arguments:

```text
type — optional
```

Workflow:

```text
list_tags → identify related tags → suggest cleanup
```

Example:

```text
Use the Codever tag-cleanup prompt for bookmarks.
```

The prompt can identify possible duplicates such as:

```text
js
javascript
javascript-language
```

It only proposes a cleanup plan. It does not change any tags.

## MCP SDK implementation

### Creating the MCP server

Codever uses the official `McpServer` class:

```javascript
const { McpServer } = require(
  '@modelcontextprotocol/sdk/server/mcp.js'
);

const SERVER_INFO = {
  name: 'codever-mcp',
  version: '1.0.0',
};

function buildMcpServer(userId) {
  const server = new McpServer(SERVER_INFO);

  // Register read-only tools and prompts here.

  return server;
}
```

A fresh server is created for the authenticated user. The `userId` is derived from the validated OAuth token and is not accepted as a tool argument.

### Registering a tool

Codever uses Zod schemas to describe and validate tool arguments:

```javascript
const { z } = require('zod');

const entryTypeEnum = z.enum(['bookmark', 'note']);

const asToolResult = (data) => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify(data),
    },
  ],
});

server.registerTool(
  'search_entries',
  {
    title: 'Search Codever entries',
    description:
      "Search the current user's own bookmarks and notes " +
      'by free text and/or tags.',
    inputSchema: {
      text: z.string().optional(),
      tags: z.array(z.string()).optional(),
      types: z.array(entryTypeEnum).optional(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().optional(),
    },
  },
  async (args) =>
    asToolResult(
      await mcpTools.searchEntries(userId, args)
    )
);
```

The schema serves two purposes:

1. It validates incoming arguments.
2. It tells the MCP host which arguments the LLM can provide.

### Registering a prompt

Prompts are registered with `registerPrompt`:

```javascript
server.registerPrompt(
  'find-and-summarize',
  {
    title: 'Find & summarize a topic',
    description:
      'Search bookmarks and notes for a topic and produce ' +
      'a briefing with sources.',
    argsSchema: {
      topic: z.string(),
      limit: z.string().optional(),
    },
  },
  ({ topic, limit }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text:
            `Call search_entries with text "${topic}"` +
            (limit ? ` and limit ${limit}.` : '.') +
            ' Then call get_entry for the most relevant results ' +
            'and produce a briefing with sources.',
        },
      },
    ],
  })
);
```

Prompt handlers are synchronous. They return messages that are added to the LLM conversation. The LLM then decides which tools to call.

### Connecting Streamable HTTP

Codever uses the MCP SDK’s Streamable HTTP transport:

```javascript
const {
  StreamableHTTPServerTransport,
} = require(
  '@modelcontextprotocol/sdk/server/streamableHttp.js'
);

const server = buildMcpServer(userId);

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

response.on('close', () => {
  transport.close();
  server.close();
});

await server.connect(transport);

await transport.handleRequest(
  request,
  response,
  request.body
);
```

Using `sessionIdGenerator: undefined` makes the endpoint stateless. Each request receives a fresh server and transport.

The SDK handles JSON-RPC framing, MCP initialization, capability negotiation, `tools/list`, `tools/call`, `prompts/list`, and `prompts/get`.

## Security model

### OAuth

OAuth is the preferred authentication method for the remote Codever MCP server.

Benefits include:

- No long-lived token pasted into the client configuration
- Short-lived access tokens
- Automatic token refresh
- Per-user authorization
- Browser-based authentication
- Scope-based access control

The MCP access token includes:

```text
Audience: codever-mcp
Scope: mcp:read
Subject: authenticated user
```

The user identity comes from the token’s `sub` claim:

```javascript
const userId = mcpAuth.getUserId(request);
```

The server never accepts a user ID from tool arguments.

### Read-only by architecture

The Codever MCP server exposes only:

```text
search_entries
get_entry
list_tags
```

There are no mutation operations:

```text
create
update
delete
```

Read-only behavior is enforced by the server implementation, not merely by instructions given to the LLM.

### OAuth discovery

When no valid token is provided, the server returns a `401` response with a `WWW-Authenticate` header. The MCP host can use this challenge to discover the authorization server and start the OAuth flow.

## Deployment

The production API runs with Docker Compose.

The relevant service is defined in:

```text
docker-compose.prod.yml
```

The API image is built from:

```text
apps/codever-api/Dockerfile
```

### Tests before deployment

Run the API test suite:

```bash
cd apps/codever-api
npm test
```

The MCP server tests verify:

- The three read-only tools
- Tool argument forwarding
- User scoping
- Available prompts
- Prompt argument interpolation
- OAuth metadata and authentication challenges

### Rebuild and redeploy

On the production host:

```bash
git fetch origin
git checkout feat/mcp-mvp
git pull --ff-only

docker compose \
  -f docker-compose.prod.yml \
  build codever-api

docker compose \
  -f docker-compose.prod.yml \
  up -d --no-deps codever-api
```

Verify the deployment:

```bash
docker compose \
  -f docker-compose.prod.yml \
  ps codever-api

docker compose \
  -f docker-compose.prod.yml \
  logs --tail=50 codever-api

curl -s https://www.codever.dev/api/version
```

After redeployment, reconnect the MCP server in IntelliJ or another MCP client and verify that these prompts are available:

```text
find-and-summarize
weekly-digest
tag-cleanup
```

## Demo lessons learned

### 1. Prompts and tools complement each other

Tools provide capabilities. Prompts provide reusable workflows that tell the LLM how to combine those capabilities.

```text
Tools   = what the server can do
Prompts = how the assistant should use it
```

### 2. User identity must come from authentication

The server derives the user from the OAuth token. It does not trust a user ID supplied by the model.

```text
OAuth token → subject (`sub`) → user-scoped tools
```

### 3. Read-only is easier to reason about

Starting with read-only tools reduces the risk of unintended changes and makes it safer to demonstrate MCP with real data.

### 4. MCP enables cross-system workflows

The live demo shows how one prompt can connect:

```text
Bookmarks
  → Confluence requirements
  → Jira acceptance criteria
  → Git branch
  → GitLab merge request
```

### 5. Transport and authentication are separate concerns

Streamable HTTP defines how messages reach the server. OAuth defines who is allowed to use it.

```text
Transport: Streamable HTTP
Authentication: OAuth / Keycloak
Authorization: audience + scope + user identity
```

## Follow-up ideas

Potential future Codever MCP prompts include:

- `related-entries` — find entries related to a selected bookmark
- `reading-list` — create a prioritized reading list for a topic
- `note-to-blog` — turn a saved note into a blog post outline
- `bookmark-review` — review and improve a bookmark description
- `research-brief` — combine several saved entries into a structured research brief

Any future mutation prompts should be introduced carefully with explicit confirmation and narrowly scoped write tools.

## Summary

The Codever MCP server demonstrates a secure, read-only integration between an AI assistant and a personal knowledge base.

It combines:

- MCP SDK
- Express
- Streamable HTTP
- Keycloak OAuth
- Zod input schemas
- User-scoped tool execution
- Reusable MCP prompts
- Docker-based deployment

The result is a practical foundation for AI-assisted workflows that can retrieve personal context and pass it safely into larger enterprise processes.

