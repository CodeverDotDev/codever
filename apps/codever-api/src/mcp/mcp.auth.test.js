jest.mock('../common/feature-toggle.service', () => ({
  isMcpServerEnabled: jest.fn(),
  isMcpCreateNotesEnabled: jest.fn(),
}));
const toggles = require('../common/feature-toggle.service');
const auth = require('./mcp.auth');

describe('MCP authorization', () => {
  beforeEach(() => jest.resetAllMocks());

  test('extracts only validated token subject and scopes', () => {
    const request = { body: { userId: 'attacker' }, kauth: { grant: { access_token: {
      content: { sub: 'owner', scope: 'openid  mcp:read\tmcp:write' },
    } } } };
    expect(auth.getUserId(request)).toBe('owner');
    expect(auth.getScopes(request)).toEqual(['openid', 'mcp:read', 'mcp:write']);
    expect(auth.getUserId({ body: { userId: 'attacker' } })).toBeUndefined();
    expect(auth.getScopes({})).toEqual([]);
    request.kauth.grant.access_token.content.scope = ['mcp:write'];
    expect(auth.getScopes(request)).toEqual([]);
  });

  for (const server of [false, true]) {
    for (const creation of [false, true]) {
      for (const read of [false, true]) {
        for (const write of [false, true]) {
          test(`server=${server}, creation=${creation}, read=${read}, write=${write}`, () => {
            toggles.isMcpServerEnabled.mockReturnValue(server);
            toggles.isMcpCreateNotesEnabled.mockReturnValue(creation);
            const scopes = [read && 'mcp:read', write && 'mcp:write'].filter(Boolean);
            expect(auth.canCreateNotes('owner', scopes)).toBe(server && creation && read && write);
            expect(auth.canCreateNotes(undefined, scopes)).toBe(false);
          });
        }
      }
    }
  }

  test('rechecks eligibility for the same issued scopes', () => {
    const scopes = ['mcp:read', 'mcp:write'];
    toggles.isMcpServerEnabled.mockReturnValue(true);
    toggles.isMcpCreateNotesEnabled.mockReturnValue(true);
    expect(auth.canCreateNotes('owner', scopes)).toBe(true);
    toggles.isMcpCreateNotesEnabled.mockReturnValue(false);
    expect(auth.canCreateNotes('owner', scopes)).toBe(false);
    expect(auth.isMcpEnabledForUser('owner')).toBe(true);
  });
});
