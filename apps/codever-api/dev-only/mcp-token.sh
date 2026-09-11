#!/usr/bin/env bash
#
# mcp-token.sh — LOCAL DEVELOPMENT ONLY.
#
# Fetches a Codever MCP token from the local Keycloak and prints the user's
# `sub` so you can enable it in feature-toggles.json. This uses the password
# (direct access) grant against the dev `codever-mcp` client and must NOT be
# used in or against production — real clients obtain tokens via the settings
# page / OAuth (see documentation/mcp/mcp-auth.md).
#
# Usage:
#   ./dev-only/mcp-token.sh                 # uses defaults (mock/mock, local KC)
#   MCP_USER=ama MCP_PASS=ama ./dev-only/mcp-token.sh
#   ./dev-only/mcp-token.sh --export        # print `export MCP_TOKEN=...` line
#
# Env overrides:
#   KC_BASE_URL   default http://localhost:8480/auth
#   KC_REALM      default bookmarks
#   MCP_CLIENT_ID default codever-mcp
#   MCP_USER      default mock
#   MCP_PASS      default mock
#
set -euo pipefail

KC_BASE_URL="${KC_BASE_URL:-http://localhost:8480/auth}"
KC_REALM="${KC_REALM:-bookmarks}"
MCP_CLIENT_ID="${MCP_CLIENT_ID:-codever-mcp}"
MCP_USER="${MCP_USER:-mock}"
MCP_PASS="${MCP_PASS:-mock}"

TOKEN_ENDPOINT="${KC_BASE_URL}/realms/${KC_REALM}/protocol/openid-connect/token"

if ! command -v curl >/dev/null 2>&1; then
  echo "error: curl is required" >&2
  exit 1
fi

# base64url decode helper (adds padding) — used to read the JWT payload.
b64url_decode() {
  local data="${1//-/+}"
  data="${data//_//}"
  local mod=$(( ${#data} % 4 ))
  if [ "$mod" -eq 2 ]; then data="${data}=="; elif [ "$mod" -eq 3 ]; then data="${data}="; fi
  echo "$data" | base64 -d 2>/dev/null
}

RESPONSE="$(curl -s \
  -d "client_id=${MCP_CLIENT_ID}" \
  -d "username=${MCP_USER}" \
  -d "password=${MCP_PASS}" \
  -d 'grant_type=password' \
  -d 'scope=openid offline_access' \
  "${TOKEN_ENDPOINT}" || true)"

if [ -z "${RESPONSE}" ]; then
  echo "error: no response from ${TOKEN_ENDPOINT}" >&2
  echo "  hint: is 'docker-compose up' running (Keycloak on :8480)?" >&2
  exit 1
fi

# Extract access_token (prefer jq, fall back to grep/sed).
if command -v jq >/dev/null 2>&1; then
  ACCESS_TOKEN="$(echo "$RESPONSE" | jq -r '.access_token // empty')"
  ERROR_DESC="$(echo "$RESPONSE" | jq -r '.error_description // .error // empty')"
else
  ACCESS_TOKEN="$(echo "$RESPONSE" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')"
  ERROR_DESC="$(echo "$RESPONSE" | sed -n 's/.*"error_description":"\([^"]*\)".*/\1/p')"
fi

if [ -z "${ACCESS_TOKEN}" ]; then
  echo "error: could not obtain a token from ${TOKEN_ENDPOINT}" >&2
  [ -n "${ERROR_DESC}" ] && echo "  keycloak: ${ERROR_DESC}" >&2
  echo "  hint: is docker-compose up? does the '${MCP_CLIENT_ID}' client exist and user '${MCP_USER}' have that password?" >&2
  exit 1
fi

# Decode the JWT payload to read the `sub`.
PAYLOAD="$(echo "$ACCESS_TOKEN" | cut -d. -f2)"
DECODED="$(b64url_decode "$PAYLOAD")"
if command -v jq >/dev/null 2>&1; then
  SUB="$(echo "$DECODED" | jq -r '.sub // empty')"
else
  SUB="$(echo "$DECODED" | sed -n 's/.*"sub":"\([^"]*\)".*/\1/p')"
fi

if [ "${1:-}" = "--export" ]; then
  echo "export MCP_TOKEN=${ACCESS_TOKEN}"
  exit 0
fi

echo "----------------------------------------------------------------------"
echo "Keycloak sub : ${SUB}"
echo "----------------------------------------------------------------------"
echo "Enable MCP for this user by adding the sub to:"
echo "  apps/codever-api/feature-toggles.json  ->  mcpServer.enabledUserIds"
echo
echo "Access token (paste into the VS Code MCP token prompt):"
echo
echo "${ACCESS_TOKEN}"
echo
echo "Tip: eval \"\$(./dev-only/mcp-token.sh --export)\" to set \$MCP_TOKEN in your shell."

