# dev-only

Scripts and helpers for **local development only**. Nothing here is used at
runtime or in production builds.

- `mcp-token.sh` — fetch a Codever MCP token from the local Keycloak (dev
  `codever-mcp` client, password grant) and print your Keycloak `sub` to enable
  in `feature-toggles.json`. See `documentation/mcp/mcp-auth.md`.

  ```bash
  cd apps/codever-api
  npm run dev:mcp:token
  ```

