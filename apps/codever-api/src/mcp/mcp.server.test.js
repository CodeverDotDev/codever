jest.mock('./mcp-tools.service', () => ({
  searchEntries: jest.fn(),
  getEntry: jest.fn(),
  listTags: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
}));

jest.mock('../common/feature-toggle.service', () => ({
  isMcpServerEnabled: jest.fn(() => true),
  isMcpCreateNotesEnabled: jest.fn(() => false),
}));
jest.mock('../common/config', () => ({
  config: () => JSON.parse(require('fs').readFileSync(require('path').resolve(__dirname, '../../env.json.example'), 'utf8')).test,
}));
const toggles = require('../common/feature-toggle.service');
const ValidationError = require('../error/validation.error');
const { TOO_MANY_TAGS } = require('../common/validation/tag-policy');

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
    expect(metadata.scopes_supported).toContain('mcp:write');
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

describe('mcp.server opt-in creation', () => {
  const scopes = ['mcp:read', 'mcp:write'];
  let client;
  beforeEach(() => {
    jest.clearAllMocks();
    toggles.isMcpServerEnabled.mockReturnValue(true);
    toggles.isMcpCreateNotesEnabled.mockReturnValue(true);
    mcpTools.createNote.mockResolvedValue({ id: 'n1', url: 'http://localhost:4200/my-notes/n1/details' });
  });
  afterEach(async () => { if (client) await client.close(); client = undefined; });

  test.each([
    [true, true, ['mcp:read']],
    [true, false, scopes],
    [false, true, scopes],
    [true, true, ['mcp:write']],
  ])('denies creation with server=%s creation=%s scopes=%j', async (server, creation, grantedScopes) => {
    toggles.isMcpServerEnabled.mockReturnValue(server);
    toggles.isMcpCreateNotesEnabled.mockReturnValue(creation);
    client = await connectClient(buildMcpServer(USER_ID, grantedScopes));
    expect((await client.listTools()).tools.map((t) => t.name).sort()).toEqual(['get_entry', 'list_tags', 'search_entries']);
    const result = await client.callTool({ name: 'create_note', arguments: { title: 'T', content: 'C' } });
    expect(result.isError).toBe(true);
    expect(mcpTools.createNote).not.toHaveBeenCalled();
  });

  test('exposes strict non-idempotent creation guidance only to an enabled writer', async () => {
    client = await connectClient(buildMcpServer(USER_ID, scopes));
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(5);
    const tool = tools.find((t) => t.name === 'create_note');
    expect(tool.inputSchema.additionalProperties).toBe(false);
    expect(tool.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false, idempotentHint: false });
    for (const text of ['preview', 'full draft content', 'tags', 'visibility', 'reference', 'origin',
      'confirmation', 'revisions', 'at most 8', 'ceiling is 13', 'returned authenticated note link',
      'not server-enforced', 'do not retry blindly']) {
      expect(tool.description).toContain(text);
    }
    const args = { title: 'Title', content: '```js\nconst x = 1;\n```' };
    const result = await client.callTool({ name: 'create_note', arguments: args });
    expect(result.isError).not.toBe(true);
    expect(mcpTools.createNote).toHaveBeenCalledWith(USER_ID, args, scopes);
    expect(JSON.parse(result.content[0].text).url).toContain('/my-notes/n1/details');
  });

  test('cached tool execution rechecks creation toggle while reads continue', async () => {
    client = await connectClient(buildMcpServer(USER_ID, scopes));
    expect((await client.listTools()).tools).toHaveLength(5);
    toggles.isMcpCreateNotesEnabled.mockReturnValue(false);
    const result = await client.callTool({ name: 'create_note', arguments: { title: 'T', content: 'C' } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('no longer enabled');
    expect(mcpTools.createNote).not.toHaveBeenCalled();
    mcpTools.listTags.mockResolvedValue([]);
    expect((await client.callTool({ name: 'list_tags', arguments: {} })).isError).not.toBe(true);
  });

  test.each([
    {}, { title: '', content: 'C' }, { title: ' ', content: 'C' }, { title: 1, content: 'C' },
    { title: 'T', content: ' ' }, { title: 'T', content: 1 }, { title: 'T', content: 'x'.repeat(30001) },
    ...['userId', '_id', 'id', 'shareableId', 'initiator', 'createdAt', 'updatedAt', 'type',
      'contentType', 'notebookContent', 'collection', 'collectionIds', 'confirmed'].map((field) => ({ title: 'T', content: 'C', [field]: 'forbidden' })),
    { title: 'T', content: 'C', tags: 'tag' }, { title: 'T', content: 'C', tags: [' '] },
    { title: 'T', content: 'C', tags: [1] }, { title: 'T', content: 'C', public: 'true' },
    { title: 'T', content: 'C', origin: { userId: 'other' } },
    { title: 'T', content: 'C', origin: { file: 42 } },
  ])('rejects malformed or unsupported input %# before the service', async (args) => {
    client = await connectClient(buildMcpServer(USER_ID, scopes));
    const result = await client.callTool({ name: 'create_note', arguments: args });
    expect(result.isError).toBe(true);
    expect(mcpTools.createNote).not.toHaveBeenCalled();
  });

  test('accepts exactly 30000 characters and explicit metadata/public visibility', async () => {
    client = await connectClient(buildMcpServer(USER_ID, scopes));
    const args = { title: 'T', content: 'x'.repeat(30000), public: true, tags: ['js'],
      reference: 'https://example.com', origin: { project: 'P', file: 'a.js' } };
    expect((await client.callTool({ name: 'create_note', arguments: args })).isError).not.toBe(true);
    expect(mcpTools.createNote).toHaveBeenCalledWith(USER_ID, args, scopes);
  });

  test.each([
    [new ValidationError('Invalid', [TOO_MANY_TAGS]), 'max 13'],
    [new Error('database password secret stack trace'), 'Do not retry blindly'],
  ])('sanitizes failure without success links', async (error, expected) => {
    mcpTools.createNote.mockRejectedValue(error);
    client = await connectClient(buildMcpServer(USER_ID, scopes));
    const result = await client.callTool({ name: 'create_note', arguments: { title: 'T', content: 'C' } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(expected);
    expect(result.content[0].text).not.toMatch(/secret|stack trace|\/my-notes\//);
  });

  test('exposes an idempotent strict update tool and forwards valid patches', async () => {
    mcpTools.updateNote.mockResolvedValue({ id: 'n1', type: 'note', title: 'Updated' });
    client = await connectClient(buildMcpServer(USER_ID, scopes));
    const { tools } = await client.listTools();
    const tool = tools.find((candidate) => candidate.name === 'update_note');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.additionalProperties).toBe(false);
    expect(tool.inputSchema.required).toEqual(['id']);
    expect(tool.annotations).toMatchObject({ readOnlyHint: false, idempotentHint: true });
    expect(tool.description).toContain('replace the entire list');

    const args = { id: 'n1', title: 'Updated' };
    const result = await client.callTool({ name: 'update_note', arguments: args });
    expect(result.isError).not.toBe(true);
    expect(mcpTools.updateNote).toHaveBeenCalledWith(USER_ID, args, scopes);
  });

  test('rejects malformed update input before the service', async () => {
    client = await connectClient(buildMcpServer(USER_ID, scopes));
    const result = await client.callTool({ name: 'update_note', arguments: { id: 'n1' } });
    expect(result.isError).toBe(true);
    expect(mcpTools.updateNote).not.toHaveBeenCalled();
  });
});

