# Kraviona MCP Server

MCP server for the Kraviona platform API. It supports local stdio and authenticated Streamable HTTP for production. It exposes tools for posts, categories, services, client enquiries, website settings, crawler files, AI drafts, and the keyword queue.

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

## Render production web service

Create a separate Render Web Service from the monorepo using these values:

```text
Name: kraviona-site-mcp
Language: Node
Branch: main
Root Directory: mcp-server
Build Command: npm install
Start Command: npm run start:http
Health Check Path: /health
```

Set these Render environment variables:

```text
NODE_VERSION=22
KRAVIONA_API_URL=https://api.kraviona.site
KRAVIONA_ADMIN_EMAIL=<production admin email>
KRAVIONA_ADMIN_PASSWORD=<production admin password>
MCP_BEARER_TOKEN=<a unique random secret of at least 24 characters>
MCP_PUBLIC_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Generate the bearer token locally with `openssl rand -hex 32`. Do not use the admin password as the bearer token. After deployment, verify the public health URL at `https://YOUR-RENDER-SERVICE.onrender.com/health`. The MCP endpoint is `https://YOUR-RENDER-SERVICE.onrender.com/mcp` and requires `Authorization: Bearer <MCP_BEARER_TOKEN>`.

Remote Codex configuration:

```toml
[mcp_servers.kraviona_remote]
url = "https://YOUR-RENDER-SERVICE.onrender.com/mcp"
bearer_token_env_var = "KRAVIONA_MCP_TOKEN"
startup_timeout_sec = 30
tool_timeout_sec = 60
```

Export `KRAVIONA_MCP_TOKEN` in the environment that starts Codex, then restart Codex. Test the production HTTP transport before deployment with:

```bash
npm run test:http -w mcp-server
```

## Claude custom connector

Use the full Streamable HTTP URL when adding the connector:

```text
https://YOUR-RENDER-SERVICE.onrender.com/mcp
```

The server advertises OAuth protected-resource and authorization-server metadata, supports Claude Dynamic Client Registration, and enforces PKCE. Clicking **Connect** opens the Kraviona consent screen. Enter the same value stored in `MCP_BEARER_TOKEN`; Claude receives a revocable OAuth access token and never receives the backend admin password.
