import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["src/index.js"],
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: { ...process.env },
});
const client = new Client({
  name: "kraviona-integration-test",
  version: "2.0.0",
});

await client.connect(transport);

try {
  const tools = await client.listTools();
  if (tools.tools.length < 38) {
    throw new Error(
      `Expected at least 38 tools, received ${tools.tools.length}.`,
    );
  }

  const checks = [
    ["cms_health", {}],
    ["list_categories", {}],
    ["list_services", { status: "published" }],
    ["list_posts", { status: "all", limit: 2 }],
    ["get_dashboard_summary", {}],
  ];

  for (const [name, arguments_] of checks) {
    const response = await client.callTool({ name, arguments: arguments_ });
    if (response.isError) {
      throw new Error(`${name} failed: ${response.content?.[0]?.text}`);
    }
  }

  console.log(
    `MCP integration passed: ${tools.tools.length} tools and authenticated API access confirmed.`,
  );
} finally {
  await client.close();
}
