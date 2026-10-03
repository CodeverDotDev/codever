const app = require('../app');

const request = require('supertest');
const superagent = require('superagent');
const fs = require('fs');
const path = require('path');

const common = require('../common/config');
const config = common.config();

const { TOO_MANY_TAGS } = require('../common/validation/tag-policy');

const MCP_URL = '/api/mcp';
const MOCK_USER = 'a7908cb5-3b37-4cc1-a751-42f674d870e1';
const togglesPath = path.resolve(__dirname, '../../feature-toggles.json');

const TOKEN_ENDPOINT = `${config.keycloak['auth-server-url']}/realms/${config.keycloak.realm}/protocol/openid-connect/token`;

/**
 * Fetch a Codever MCP access token via the local `codever-mcp` client's
 * password (direct access) grant, mirroring dev-only/mcp-token.sh.
 * @param {string[]} extraScopes Additional scope strings to request.
 */
async function getMcpToken(extraScopes = []) {
  const scope = ['openid', 'offline_access', ...extraScopes].join(' ');
  const response = await superagent
    .post(TOKEN_ENDPOINT)
    .send('client_id=codever-mcp')
    .send('username=mock')
    .send('password=mock')
    .send('grant_type=password')
    .send(`scope=${scope}`)
    .set('Accept', 'application/json');
  return response.body.access_token;
}

async function getIntegrationServiceAccountToken() {
  const response = await superagent
    .post(config.integration_tests.token_endpoint)
    .send(`client_id=${config.integration_tests.client_id}`)
    .send(`client_secret=${config.integration_tests.client_secret}`)
    .send('grant_type=client_credentials')
    .set('Accept', 'application/json');
  return response.body.access_token;
}

function parseJsonRpcBody(res) {
  const contentType = res.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    return res.body;
  }
  const text = res.text || '';
  const match = text.match(/data:\s*(\{.*\})$/m) || text.match(/data:\s*(\{.*\})/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (err) {
      // fall through to the whole-body parse below
    }
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    return {};
  }
}

async function postJsonRpc(token, payload) {
  const res = await request(app)
    .post(MCP_URL)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json, text/event-stream')
    .send(payload);
  return { status: res.statusCode, body: parseJsonRpcBody(res) };
}

function toolNames(body) {
  return (body && body.result && body.result.tools ? body.result.tools : []).map((t) => t.name);
}

function callResultText(body) {
  const result = body && body.result;
  if (!result || !Array.isArray(result.content)) return null;
  return result.content.map((item) => item.text).join('');
}

/**
 * Temporarily rewrite feature-toggles.json while running `fn`, then restore
 * the exact original bytes. The toggle service reads the file on every call,
 * so this exercises the live re-read path without leaving state behind.
 */
async function withToggles(mutate, fn) {
  const original = fs.readFileSync(togglesPath, 'utf8');
  try {
    const toggles = JSON.parse(original);
    mutate(toggles);
    fs.writeFileSync(togglesPath, JSON.stringify(toggles, null, 2));
    return await fn();
  } finally {
    fs.writeFileSync(togglesPath, original);
  }
}

describe('MCP server — authenticated note creation (integration)', () => {
  let readToken;
  let writeToken;
  let originalToggles;
  const createdNoteIds = [];

  beforeAll(async () => {
    // The committed mcpCreateNotes allowlist ships empty. Enable the mock user
    // for the duration of this suite, then restore the exact original bytes.
    originalToggles = fs.readFileSync(togglesPath, 'utf8');
    const toggles = JSON.parse(originalToggles);
    toggles.mcpCreateNotes.enabledUserIds = [...new Set([...(toggles.mcpCreateNotes.enabledUserIds || []), MOCK_USER])];
    fs.writeFileSync(togglesPath, JSON.stringify(toggles, null, 2));

    readToken = await getMcpToken();
    writeToken = await getMcpToken(['mcp:write']);
  });

  afterAll(async () => {
    // Best-effort cleanup of notes created via MCP (as the mock user, via REST).
    if (writeToken) {
      const accessToken = await getMcpToken(['mcp:write']);
      const { getBearerToken } = require('../common/testing/test.utils');
      for (const noteId of createdNoteIds) {
        try {
          await request(app)
            .delete(`/api/personal/users/${MOCK_USER}/notes/${noteId}`)
            .set('Authorization', getBearerToken(accessToken));
        } catch (err) {
          // best-effort cleanup
        }
      }
    }
    if (originalToggles !== undefined) {
      fs.writeFileSync(togglesPath, originalToggles);
    }
  });

  it('exposes three read tools to a default read-only token', async () => {
    const response = await postJsonRpc(readToken, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    expect(response.status).toBe(200);
    expect(toolNames(response.body).sort()).toEqual(['get_entry', 'list_tags', 'search_entries']);
  });

  it('denies a token with the wrong audience (not codever-mcp)', async () => {
    const wrongAudienceToken = await getIntegrationServiceAccountToken();
    const response = await postJsonRpc(wrongAudienceToken, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    expect([401, 403]).toContain(response.status);
  });

  it('denies a user not enabled in the mcpServer allowlist', async () => {
    await withToggles((toggles) => {
      toggles.mcpServer.enabledUserIds = toggles.mcpServer.enabledUserIds.filter((id) => id !== MOCK_USER);
    }, async () => {
      const response = await postJsonRpc(readToken, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
      expect(response.status).toBe(403);
      expect(response.body.error).toBeTruthy();
    });
  });

  it('exposes create_note to a write-enabled token and creates a Markdown note', async () => {
    const listResponse = await postJsonRpc(writeToken, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    expect(listResponse.status).toBe(200);
    expect(toolNames(listResponse.body).sort()).toEqual(['create_note', 'get_entry', 'list_tags', 'search_entries']);

    const createResponse = await postJsonRpc(writeToken, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'create_note',
        arguments: {
          title: 'MCP integration test note',
          content: '```js\nconst x = 1;\n```',
          tags: ['integration', 'mcp', 'test'],
        },
      },
    });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.result.isError).not.toBe(true);
    const created = JSON.parse(callResultText(createResponse.body));
    expect(created.id).toBeTruthy();
    expect(created.url).toContain('/my-notes/');
    createdNoteIds.push(created.id);
  });

  it('round-trips reference and origin metadata through get_entry', async () => {
    const createResponse = await postJsonRpc(writeToken, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'create_note',
        arguments: {
          title: 'MCP metadata round-trip',
          content: 'round-trip content',
          reference: 'https://example.com/source',
          origin: { project: 'codever', file: 'src/mcp/mcp.server.js' },
        },
      },
    });
    expect(createResponse.body.result.isError).not.toBe(true);
    const created = JSON.parse(callResultText(createResponse.body));
    createdNoteIds.push(created.id);

    const getResponse = await postJsonRpc(writeToken, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'get_entry', arguments: { id: created.id, type: 'note' } },
    });

    const entry = JSON.parse(callResultText(getResponse.body));
    expect(entry.reference).toBe('https://example.com/source');
    expect(entry.origin).toMatchObject({ project: 'codever', file: 'src/mcp/mcp.server.js' });
  });

  it('does not register create_note for a read-only token and denies a direct call', async () => {
    const listResponse = await postJsonRpc(readToken, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    expect(toolNames(listResponse.body)).not.toContain('create_note');

    const callResponse = await postJsonRpc(readToken, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'create_note', arguments: { title: 'T', content: 'C' } },
    });

    // Either a JSON-RPC error (tool absent) or an isError result — but never a save.
    const failed = callResponse.body.error !== undefined ||
      (callResponse.body.result && callResponse.body.result.isError === true);
    expect(failed).toBe(true);
  });

  it('accepts thirteen tags and rejects fourteen tags via create_note', async () => {
    const thirteen = Array.from({ length: 13 }, (_, i) => `tag-${i}`);
    const okResponse = await postJsonRpc(writeToken, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'create_note', arguments: { title: 'thirteen tags', content: 'content', tags: thirteen } },
    });
    expect(okResponse.body.result.isError).not.toBe(true);
    const created = JSON.parse(callResultText(okResponse.body));
    expect(created.tags).toHaveLength(13);
    createdNoteIds.push(created.id);

    const fourteen = Array.from({ length: 14 }, (_, i) => `tag-${i}`);
    const failResponse = await postJsonRpc(writeToken, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'create_note', arguments: { title: 'fourteen tags', content: 'content', tags: fourteen } },
    });
    expect(failResponse.body.result.isError).toBe(true);
    expect(callResultText(failResponse.body)).toContain('max 13');
  });

  it('denies creation after the user is removed from the creation allowlist while reads continue', async () => {
    await withToggles((toggles) => {
      toggles.mcpCreateNotes.enabledUserIds = toggles.mcpCreateNotes.enabledUserIds.filter((id) => id !== MOCK_USER);
    }, async () => {
      const listResponse = await postJsonRpc(writeToken, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
      expect(toolNames(listResponse.body)).not.toContain('create_note');

      const createResponse = await postJsonRpc(writeToken, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'create_note', arguments: { title: 'T', content: 'C' } },
      });
      const failed = createResponse.body.error !== undefined ||
        (createResponse.body.result && createResponse.body.result.isError === true);
      expect(failed).toBe(true);

      const readResponse = await postJsonRpc(writeToken, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'list_tags', arguments: {} },
      });
      expect(readResponse.body.result.isError).not.toBe(true);
    });
  });
});
