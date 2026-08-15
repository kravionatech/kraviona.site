# Kraviona MCP Server

Kraviona MCP exposes the editorial platform as 38 structured tools. An MCP client can manage posts, contributors, moderation, subscribers, services, enquiries, settings and content automation through the existing backend API.

## Architecture

```text
MCP client
   │  stdio or OAuth-protected Streamable HTTP
   ▼
mcp-server/src/index.js
   │  validates tool input with Zod
   ▼
mcp-server/src/api.js
   │  signs in as an administrator and keeps cookies in memory
   ▼
Kraviona Express API → MongoDB / Cloudinary / Resend / AI provider
```

Tool code is grouped by responsibility:

- `src/tools/posts.js` — first-party editorial posts.
- `src/tools/editorial.js` — guest posts, comments, subscribers and users.
- `src/tools/platform.js` — dashboard, categories, services, enquiries, settings and AI automation.
- `src/schemas.js` — shared Zod input contracts.
- `src/toolkit.js` — consistent MCP responses, errors and query building.
- `src/api.js` — authenticated backend API client.

## Tool catalogue

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

Permanent-delete tools require `confirm: true`. Read tools advertise `readOnlyHint`; destructive tools advertise `destructiveHint`.

## Local configuration

Copy `.env.example` to a local ignored environment file and set:

```text
KRAVIONA_API_URL=http://localhost:4000
KRAVIONA_ADMIN_EMAIL=your-admin@example.com
KRAVIONA_ADMIN_PASSWORD=your-admin-password
```

Never commit real credentials. The MCP process signs in through `/api/auth/login` and stores only the returned session cookies in process memory.

Example MCP host configuration:

```json
{
  "mcpServers": {
    "kraviona": {
      "command": "node",
      "args": ["C:/absolute/path/kraviona.site/mcp-server/src/index.js"],
      "env": {
        "KRAVIONA_API_URL": "http://localhost:4000",
        "KRAVIONA_ADMIN_EMAIL": "your-admin@example.com",
        "KRAVIONA_ADMIN_PASSWORD": "your-password"
      }
    }
  }
}
```

## Commands

```bash
npm run build -w mcp-server
npm test -w mcp-server
npm run test:integration -w mcp-server
npm run test:http -w mcp-server
npm run start:stdio -w mcp-server
npm run start:http -w mcp-server
```

The contract and HTTP transport tests work without a running backend. `cms_health` reports the backend as `online`, `unhealthy`, or `offline` without taking down the MCP session. The integration test requires the backend and valid administrator credentials.

## Remote deployment

Create a separate Node web service with `mcp-server` as its root directory:

```text
Build command: npm install
Start command: npm run start:http
Health path: /health
Node version: 22
```

Required production environment:

```text
KRAVIONA_API_URL=https://api.kraviona.site
KRAVIONA_ADMIN_EMAIL=<production administrator email>
KRAVIONA_ADMIN_PASSWORD=<production administrator password>
MCP_BEARER_TOKEN=<at least 24 random characters>
MCP_PUBLIC_URL=https://YOUR-MCP-HOST.example.com
```

Generate a standalone bearer secret; never reuse the administrator password. The MCP endpoint is `/mcp` and supports static bearer authentication plus OAuth Dynamic Client Registration and PKCE for the official Claude callback URLs.

Remote client example:

```toml
[mcp_servers.kraviona_remote]
url = "https://YOUR-MCP-HOST.example.com/mcp"
bearer_token_env_var = "KRAVIONA_MCP_TOKEN"
startup_timeout_sec = 30
tool_timeout_sec = 60
```

## Safe operating rules

1. Read a record before making a substantial update.
2. Create AI-generated articles as drafts.
3. Verify facts, sources, rights and external links before publishing.
4. Use status changes instead of deletion whenever records may be needed later.
5. Never pass production secrets inside post content, notes or tool descriptions.
6. Review `review_guest_post` output and confirm that the public post exists after publication.
7. Run contract and integration tests before deploying MCP changes.

The complete project SOP is available at [`../docs/kraviona-project-sop.html`](../docs/kraviona-project-sop.html).
