#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { api } from "./api.js";
import { config } from "./config.js";
import { registerEditorialTools } from "./tools/editorial.js";
import { registerPlatformTools } from "./tools/platform.js";
import { registerPostTools } from "./tools/posts.js";
import { registerTool } from "./toolkit.js";

export const MCP_SERVER_NAME = config.name;
export const MCP_SERVER_VERSION = config.version;

/**
 * Build a fresh MCP server for one stdio process or HTTP session.
 */
export function createMcpServer() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  registerTool(
    server,
    "cms_health",
    {
      title: "Kraviona CMS health",
      description: "Check whether the Kraviona backend API is online.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    () => api.health(),
  );

  registerPostTools(server);
  registerEditorialTools(server);
  registerPlatformTools(server);

  return server;
}

async function runStdioServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  await runStdioServer();
}
