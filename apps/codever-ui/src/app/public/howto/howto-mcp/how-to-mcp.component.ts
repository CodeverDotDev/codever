import { Component } from '@angular/core';

@Component({
  selector: 'app-howto-mcp',
  templateUrl: './how-to-mcp.component.html',
  styleUrls: ['./how-to-mcp.component.scss'],
  standalone: false,
})
export class HowToMcpComponent {
  /** Production MCP server endpoint (Streamable HTTP + OAuth 2.1). */
  readonly mcpUrl = 'https://www.codever.dev/api/mcp';

  /** Ready-to-paste VS Code `.vscode/mcp.json` snippet. */
  readonly vscodeConfig = `{
  "servers": {
    "codever": {
      "type": "http",
      "url": "https://www.codever.dev/api/mcp"
    }
  }
}`;

  /** Ready-to-paste Cursor / Claude Desktop style snippet. */
  readonly genericConfig = `{
  "mcpServers": {
    "codever": {
      "url": "https://www.codever.dev/api/mcp"
    }
  }
}`;
}
