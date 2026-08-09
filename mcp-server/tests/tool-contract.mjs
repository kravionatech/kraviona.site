import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const requiredTools = [
  "cms_health",
  "get_dashboard_summary",
  "list_posts",
  "get_post",
  "create_post",
  "update_post",
  "set_post_status",
  "delete_post",
  "list_guest_posts",
  "get_guest_post",
  "review_guest_post",
  "delete_guest_post",
  "list_comments",
  "moderate_comment",
  "delete_comment",
  "list_subscribers",
  "save_subscriber",
  "update_subscriber_status",
  "delete_subscriber",
  "list_users",
  "create_editor_account",
  "update_user_access",
  "list_categories",
  "save_category",
  "delete_category",
  "list_services",
  "save_service",
  "delete_service",
  "list_inquiries",
  "update_inquiry",
  "delete_inquiry",
  "get_site_settings",
  "update_site_settings",
  "update_crawler_settings",
  "generate_ai_draft",
  "list_keyword_queue",
  "add_keyword",
  "delete_keyword",
];

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["src/index.js"],
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: { ...process.env },
});
const client = new Client({
  name: "kraviona-tool-contract-test",
  version: "2.0.0",
});

await client.connect(transport);

try {
  const response = await client.listTools();
  const availableNames = new Set(response.tools.map((tool) => tool.name));
  const missingTools = requiredTools.filter(
    (name) => !availableNames.has(name),
  );

  if (missingTools.length) {
    throw new Error(`Missing MCP tools: ${missingTools.join(", ")}`);
  }
  if (response.tools.length !== requiredTools.length) {
    throw new Error(
      `Expected ${requiredTools.length} tools, received ${response.tools.length}.`,
    );
  }

  console.log(`MCP contract passed: ${response.tools.length} tools available.`);
} finally {
  await client.close();
}
