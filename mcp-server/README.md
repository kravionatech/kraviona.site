# Kraviona MCP Server

Local stdio MCP server for the Kraviona platform API. It exposes authenticated tools for posts, categories, services, client enquiries, website settings, AI drafts, and the keyword queue.

## Configure

Set these variables in your MCP host configuration:

```text
KRAVIONA_API_URL=http://localhost:4000
KRAVIONA_ADMIN_EMAIL=your-admin@example.com
KRAVIONA_ADMIN_PASSWORD=your-admin-password
```

Never commit real credentials. The server signs in through the normal Kraviona API and keeps its HTTP-only session cookies in memory only.

## MCP host configuration

```json
{
  "mcpServers": {
    "kraviona": {
      "command": "node",
      "args": ["/absolute/path/to/kravionasite/mcp-server/src/index.js"],
      "env": {
        "KRAVIONA_API_URL": "http://localhost:4000",
        "KRAVIONA_ADMIN_EMAIL": "your-admin@example.com",
        "KRAVIONA_ADMIN_PASSWORD": "your-password"
      }
    }
  }
}
```

Run `npm test -w mcp-server` while the backend is running to verify tool discovery and API connectivity.
