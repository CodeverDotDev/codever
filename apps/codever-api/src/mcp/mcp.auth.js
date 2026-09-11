const FeatureToggleService = require('../common/feature-toggle.service');

/**
 * Authorization helpers for the Codever MCP server.
 *
 * The user identity ALWAYS comes from the validated Keycloak access token
 * (`sub` claim) — never from tool arguments. Access is gated by the per-user
 * `mcpServer` feature toggle. Scope/audience hardening (`mcp:read`, the
 * `codever-mcp` client + `verify-token-audience`) is described in
 * documentation/mcp/mcp-auth.md and layered on top in deployment config.
 */

const MCP_READ_SCOPE = 'mcp:read';

function getTokenContent(request) {
  return (
    request &&
    request.kauth &&
    request.kauth.grant &&
    request.kauth.grant.access_token &&
    request.kauth.grant.access_token.content
  );
}

/**
 * Extract the authenticated user id (Keycloak `sub`) from the request.
 * @returns {string|undefined}
 */
function getUserId(request) {
  const content = getTokenContent(request);
  return content ? content.sub : undefined;
}

/**
 * Extract the granted OAuth scopes from the access token.
 * @returns {string[]}
 */
function getScopes(request) {
  const content = getTokenContent(request);
  const scope = content && content.scope ? content.scope : '';
  return scope.split(' ').filter(Boolean);
}

/**
 * Whether the given user is allowed to use the MCP server (per-user toggle).
 * @returns {boolean}
 */
function isMcpEnabledForUser(userId) {
  return !!userId && FeatureToggleService.isMcpServerEnabled(userId);
}

module.exports = {
  MCP_READ_SCOPE,
  getUserId,
  getScopes,
  isMcpEnabledForUser,
};

