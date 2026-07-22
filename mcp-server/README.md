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

## Production API setup

Keep production credentials in the ignored `mcp-server/.env.production` file, then start the stdio server with Node's environment-file support:

```bash
node --env-file=/absolute/path/to/mcp-server/.env.production /absolute/path/to/mcp-server/src/index.js
```

For Codex, configure this command under `[mcp_servers.kraviona_production]` in `~/.codex/config.toml`. The MCP process runs locally while all CMS operations use `https://api.kraviona.site`. Restart Codex after changing MCP configuration.
