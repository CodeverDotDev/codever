jest.mock('./mcp-tools.service', () => ({
  searchEntries: jest.fn(),
  getEntry: jest.fn(),
  listTags: jest.fn(),
}));

// Avoid requiring keycloak/env config when we only test the MCP server object.
const mcpTools = require('./mcp-tools.service');
const mcpRouter = require('./mcp.server');
const { buildMcpServer } = mcpRouter;
const express = require('express');
const request = require('supertest');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const {
  InMemoryTransport,
} = require('@modelcontextprotocol/sdk/inMemory.js');

const USER_ID = 'user-123';

async function connectClient(server) {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return client;
}

describe('mcp.server (end-to-end via in-memory transport)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exposes exactly the three read-only tools', async () => {
    const server = buildMcpServer(USER_ID);
    const client = await connectClient(server);

    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();

    expect(names).toEqual(['get_entry', 'list_tags', 'search_entries']);

    await client.close();
  });

  test('search_entries forwards args and returns tool output scoped to the user', async () => {
    mcpTools.searchEntries.mockResolvedValue({
      page: 1,
      limit: 20,
      count: 1,
      results: [{ type: 'bookmark', id: 'b1', title: 'K8s' }],
    });

    const server = buildMcpServer(USER_ID);
    const client = await connectClient(server);

    const result = await client.callTool({
      name: 'search_entries',
      arguments: { text: 'k8s', tags: ['devops'] },
    });

    expect(mcpTools.searchEntries).toHaveBeenCalledWith(USER_ID, {
      text: 'k8s',
      tags: ['devops'],
    });
    const payload = JSON.parse(result.content[0].text);
    expect(payload.count).toBe(1);
    expect(payload.results[0].title).toBe('K8s');

    await client.close();
  });

  test('get_entry forwards id and type', async () => {
    mcpTools.getEntry.mockResolvedValue({
      type: 'note',
      id: 'n1',
      content: 'full',
    });

    const server = buildMcpServer(USER_ID);
    const client = await connectClient(server);

    await client.callTool({
      name: 'get_entry',
      arguments: { id: 'n1', type: 'note' },
    });

    expect(mcpTools.getEntry).toHaveBeenCalledWith(USER_ID, {
      id: 'n1',
      type: 'note',
    });

    await client.close();
  });

  test('list_tags returns merged tags', async () => {
    mcpTools.listTags.mockResolvedValue([{ name: 'devops', count: 5 }]);

    const server = buildMcpServer(USER_ID);
    const client = await connectClient(server);

    const result = await client.callTool({
      name: 'list_tags',
      arguments: {},
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload).toEqual([{ name: 'devops', count: 5 }]);

    await client.close();
  });
});

describe('mcp.server prompts', () => {
  test('exposes the demo prompts', async () => {
    const server = buildMcpServer(USER_ID);
    const client = await connectClient(server);

    const { prompts } = await client.listPrompts();
    const names = prompts.map((p) => p.name).sort();

    expect(names).toEqual(['find-and-summarize', 'tag-cleanup', 'weekly-digest']);

    await client.close();
  });

  test('find-and-summarize interpolates topic and limit into the message', async () => {
    const server = buildMcpServer(USER_ID);
    const client = await connectClient(server);

    const { messages } = await client.getPrompt({
      name: 'find-and-summarize',
      arguments: { topic: 'kubernetes', limit: '5' },
    });

    const text = messages[0].content.text;
    expect(text).toContain('search_entries with text "kubernetes"');
    expect(text).toContain('limit 5');
    expect(text).toContain('get_entry');

    await client.close();
  });

  test('tag-cleanup references list_tags and stays read-only', async () => {
    const server = buildMcpServer(USER_ID);
    const client = await connectClient(server);

    const { messages } = await client.getPrompt({
      name: 'tag-cleanup',
      arguments: {},
    });

    const text = messages[0].content.text;
    expect(text).toContain('list_tags');
    expect(text).toContain('Do not modify');

    await client.close();
  });
});


describe('mcp.server OAuth metadata & challenge', () => {
  test('protected-resource metadata points at the MCP resource and Keycloak issuer', () => {
    const metadata = mcpRouter.getProtectedResourceMetadata();
    expect(metadata.resource).toMatch(/\/api\/mcp$/);
    expect(metadata.authorization_servers[0]).toMatch(/\/realms\/bookmarks$/);
    expect(metadata.scopes_supported).toContain('mcp:read');
    expect(metadata.bearer_methods_supported).toContain('header');
  });

  test('unauthenticated POST /api/mcp returns 401 with a resource_metadata challenge', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/mcp', mcpRouter);

    const response = await request(app).post('/api/mcp').send({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    });

    expect(response.status).toBe(401);
    expect(response.headers['www-authenticate']).toContain('Bearer');
    expect(response.headers['www-authenticate']).toContain(
      'resource_metadata='
    );
    expect(response.headers['www-authenticate']).toContain(
      'error="invalid_token"'
    );
  });
});

