# Kraviona.site MCP Server

Private MCP access to the Kraviona.site editorial platform. The server exposes
38 structured CMS tools over local stdio and OAuth-protected Streamable HTTP.

## Multi-Claude architecture

```text
Claude Code instances ── stdio ─────────────┐
                                            ├── Kraviona.site MCP ── CMS API
Claude Chat connectors ─ OAuth 2.1 + HTTP ──┘           │
                                                        └── MongoDB OAuth store
```

- Every local Claude Code process gets an isolated stdio server.
- Remote Claude clients dynamically register and use authorization-code PKCE.
- OAuth clients, pending requests, authorization codes and hashed tokens are
  stored in MongoDB instead of process memory.
- Access and refresh tokens survive restarts and work across multiple Vercel or
  Node instances.
- HTTP MCP requests are stateless, so no sticky session is required.
- Refresh tokens rotate on use. Authorization codes are single-use.
- Only the official configured Claude callback URLs are accepted.
- The CMS administrator password remains server-side and is never sent to a
  Claude client.

## Tools

| Domain      | Tools                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------- |
| System      | `cms_health`, `get_dashboard_summary`                                                    |
| Posts       | `list_posts`, `get_post`, `create_post`, `update_post`, `set_post_status`, `delete_post` |
| Guest posts | `list_guest_posts`, `get_guest_post`, `review_guest_post`, `delete_guest_post`           |
| Comments    | `list_comments`, `moderate_comment`, `delete_comment`                                    |
| Subscribers | `list_subscribers`, `save_subscriber`, `update_subscriber_status`, `delete_subscriber`   |
| Users       | `list_users`, `create_editor_account`, `update_user_access`                              |
| Categories  | `list_categories`, `save_category`, `delete_category`                                    |
| Services    | `list_services`, `save_service`, `delete_service`                                        |
| Enquiries   | `list_inquiries`, `update_inquiry`, `delete_inquiry`                                     |
| Settings    | `get_site_settings`, `update_site_settings`, `update_crawler_settings`                   |
| Automation  | `generate_ai_draft`, `list_keyword_queue`, `add_keyword`, `delete_keyword`               |

Permanent-delete tools require `confirm: true`. Read tools advertise
`readOnlyHint`; destructive tools advertise `destructiveHint`.

## Local Claude Code setup

Install dependencies from the repository root:

```powershell
npm install
```

Copy `mcp-server/.env.example` to `mcp-server/.env` and set:

```text
KRAVIONA_API_URL=http://localhost:4000
KRAVIONA_ADMIN_EMAIL=your-admin@example.com
KRAVIONA_ADMIN_PASSWORD=your-admin-password
```

The committed project-level `.mcp.json` starts
`mcp-server/src/index.js`. Open the `kraviona.site` repository as the Claude
project and restart Claude Code after creating the environment file. Multiple
Claude Code windows can connect simultaneously because each starts its own
stdio process.

Equivalent manual client configuration:

```json
{
  "mcpServers": {
    "kraviona-site": {
      "command": "node",
      "args": ["C:/absolute/path/kraviona.site/mcp-server/src/index.js"]
    }
  }
}
```

## Remote Claude connector deployment

Create a dedicated Vercel project with `mcp-server` as the Root Directory:

- Framework preset: Other
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave empty
- Node.js: 22 or newer

Set these production variables:

```text
KRAVIONA_API_URL=https://api.kraviona.site
KRAVIONA_ADMIN_EMAIL=<production administrator email>
KRAVIONA_ADMIN_PASSWORD=<production administrator password>
MONGO_URI=<production MongoDB URI>
DB_NAME=kraviona-site
MCP_BEARER_TOKEN=<random secret with at least 24 characters>
MCP_PUBLIC_URL=https://mcp.kraviona.site
MCP_TRANSPORT=streamable-http
MCP_OAUTH_REDIRECT_URIS=https://claude.ai/api/mcp/auth_callback,https://claude.com/api/mcp/auth_callback
MCP_OAUTH_ACCESS_TOKEN_SECONDS=3600
MCP_OAUTH_REFRESH_TOKEN_DAYS=30
MCP_DB_TIMEOUT_MS=20000
```

`MCP_BEARER_TOKEN` is the access key entered on the authorization screen. Use a
standalone random secret; never reuse the CMS administrator password.

After deployment, verify:

```text
https://mcp.kraviona.site/
https://mcp.kraviona.site/health
https://mcp.kraviona.site/.well-known/oauth-authorization-server
https://mcp.kraviona.site/.well-known/oauth-protected-resource/mcp
```

In every Claude account or workspace:

1. Open **Customize > Connectors**.
2. Choose **Add custom connector**.
3. Enter `https://mcp.kraviona.site/mcp`.
4. Complete the authorization screen with `MCP_BEARER_TOKEN`.

Each Claude connection receives its own client registration and rotating token
pair. Adding another Claude does not invalidate existing connectors.

The same server can run on Render or Railway with `npm run start:http`; keep a
single stable `MCP_PUBLIC_URL` and the same MongoDB across all instances.

## Commands

```powershell
npm run build -w mcp-server             # Syntax verification
npm test -w mcp-server                  # 38-tool contract test
npm run test:http -w mcp-server         # DCR + PKCE + HTTP smoke test
npm run test:integration -w mcp-server  # Live authenticated CMS API reads
npm run test:remote -w mcp-server       # Deployed endpoint smoke test
npm run start:stdio -w mcp-server       # Local MCP
npm run start:http -w mcp-server        # Remote-style local server
```

The HTTP smoke test explicitly uses the in-memory OAuth store and is safe for
local CI. Production rejects `MCP_OAUTH_STORE=memory`; MongoDB persistence is
required there.

## Safety

1. Read a record before a substantial update.
2. Create AI-generated articles as drafts.
3. Verify facts, sources, media rights and links before publishing.
4. Prefer status changes over permanent deletion.
5. Never place production secrets in content or tool arguments.
6. Run contract and HTTP tests before deployment.

The complete project SOP is at
[`../docs/kraviona-project-sop.html`](../docs/kraviona-project-sop.html).
