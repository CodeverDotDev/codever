const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function shellPath(value) {
  return value.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`);
}

describe('development MCP token helper', () => {
  let dir;
  let token;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codever-mcp-token-'));
    token = `test.${Buffer.from(JSON.stringify({ sub: 'local-test', aud: 'codever-mcp' })).toString('base64url')}.stub`;
    fs.writeFileSync(path.join(dir, 'curl'), '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > "$MCP_TEST_REQUEST"\nprintf \'%s\\n\' \'{"access_token":"' + token + '"}\'\n', { mode: 0o755 });
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  function run(args) {
    return spawnSync('bash', ['-c', 'export PATH="$MCP_TEST_BIN:$PATH"; bash "$MCP_TEST_HELPER" "$@"', 'helper-test', ...args], {
      encoding: 'utf8', timeout: 15000,
      env: { ...process.env, MCP_TEST_BIN: shellPath(dir), MCP_TEST_REQUEST: shellPath(path.join(dir, 'request')),
        MCP_TEST_HELPER: shellPath(path.join(__dirname, 'mcp-token.sh')),
        KC_BASE_URL: 'http://localhost:8480/auth', KC_REALM: 'bookmarks', MCP_CLIENT_ID: 'codever-mcp', MCP_USER: 'mock', MCP_PASS: 'mock' },
    });
  }

  test.each([[], ['--export'], ['--write'], ['--write', '--export'], ['--export', '--write']])
  ('requests scopes for options %j without changing toggles', (...options) => {
    // Jest spreads array table rows; collect the option strings back into a list.
    const args = options.filter((value) => typeof value === 'string');
    const togglePath = path.resolve(__dirname, '../feature-toggles.json');
    const before = fs.readFileSync(togglePath, 'utf8');
    const result = run(args);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const request = fs.readFileSync(path.join(dir, 'request'), 'utf8');
    expect(request).toContain('scope=openid offline_access' + (args.includes('--write') ? ' mcp:write' : '') + '\n');
    expect(request).toContain('client_id=codever-mcp');
    expect(request).not.toContain('bookmarks-api');
    if (args.includes('--export')) expect(result.stdout.trim()).toBe(`export MCP_TOKEN=${token}`);
    else expect(result.stdout).toContain('local-test');
    expect(fs.readFileSync(togglePath, 'utf8')).toBe(before);
  });

  test('rejects unknown options before requesting credentials', () => {
    const result = run(['--unknown']);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('unknown option');
    expect(fs.existsSync(path.join(dir, 'request'))).toBe(false);
  });
});

describe('development realm MCP scope configuration', () => {
  const realm = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../docker-compose-setup/keycloak-export-import/bookmarks-realm.json'), 'utf8'));
  const client = realm.clients.find((value) => value.clientId === 'codever-mcp');

  test('keeps write optional and leaves read-only default grants unchanged', () => {
    expect(client.defaultClientScopes).toEqual(['web-origins', 'role_list', 'profile', 'roles', 'email', 'mcp:read']);
    expect(client.optionalClientScopes).toContain('mcp:write');
    expect(realm.defaultDefaultClientScopes).not.toContain('mcp:write');
    expect(realm.defaultOptionalClientScopes).not.toContain('mcp:write');
    const write = realm.clientScopes.find((value) => value.name === 'mcp:write');
    expect(write.attributes['include.in.token.scope']).toBe('true');
    expect(write.protocolMappers).toEqual([]);
    expect(client.protocolMappers.filter((value) => value.protocolMapper === 'oidc-audience-mapper')
      .map((value) => value.config['included.client.audience'])).toEqual(['codever-mcp']);
    expect(realm.clients.filter((value) => value.clientId !== 'codever-mcp')
      .every((value) => !(value.defaultClientScopes || []).includes('mcp:write') && !(value.optionalClientScopes || []).includes('mcp:write'))).toBe(true);
  });
});
