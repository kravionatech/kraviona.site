#!/usr/bin/env node

import path from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthRouter,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { assertHttpConfiguration, config } from "./config.js";
import { disconnectOAuthDatabase } from "./db.js";
import { createMcpServer } from "./index.js";
import { oauthProvider, oauthScopes } from "./oauth.js";

const jsonRpcError = (response, status, message) => {
  response.status(status).json({
    jsonrpc: "2.0",
    error: {
      code: status === 401 ? -32001 : -32603,
      message,
    },
    id: null,
  });
};

const oauthBearerMiddleware = () =>
  requireBearerAuth({
    verifier: oauthProvider,
    requiredScopes: [...oauthScopes],
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(
      new URL(config.oauth.resourceUrl),
    ),
  });

export const createHttpApp = () => {
  assertHttpConfiguration();

  const allowedHosts = [
    ...new Set(
      [
        new URL(config.oauth.publicUrl).hostname,
        process.env.VERCEL_URL,
        process.env.VERCEL_BRANCH_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        "127.0.0.1",
        "localhost",
        "[::1]",
      ].filter(Boolean),
    ),
  ];
  const app = createMcpExpressApp({ host: "0.0.0.0", allowedHosts });
  app.set("trust proxy", process.env.VERCEL ? 2 : 1);

  app.post(
    "/oauth/approve",
    express.urlencoded({ extended: false, limit: "16kb" }),
    async (request, response, next) => {
      try {
        await oauthProvider.approve(
          request.body.request_id,
          request.body.access_key,
          response,
        );
      } catch (error) {
        next(error);
      }
    },
  );

  const publicUrl = new URL(config.oauth.publicUrl);
  const rateLimitOptions = { validate: false };
  app.use(
    mcpAuthRouter({
      provider: oauthProvider,
      issuerUrl: publicUrl,
      baseUrl: publicUrl,
      resourceServerUrl: new URL(config.oauth.resourceUrl),
      scopesSupported: [...oauthScopes],
      resourceName: "Kraviona.site CMS",
      authorizationOptions: { rateLimit: rateLimitOptions },
      tokenOptions: { rateLimit: rateLimitOptions },
      clientRegistrationOptions: { rateLimit: rateLimitOptions },
      revocationOptions: { rateLimit: rateLimitOptions },
    }),
  );

  app.get("/", (_request, response) => {
    response.json({
      status: "ok",
      service: config.name,
      version: config.version,
      transport: "streamable-http",
      endpoint: "/mcp",
      authentication: "oauth-2.1",
      multiClient: true,
    });
  });

  app.get("/health", (_request, response) => {
    response.status(200).json({
      status: "ok",
      ok: true,
      service: config.name,
      transport: "streamable-http",
    });
  });

  app.use("/mcp", oauthBearerMiddleware());

  // Stateless Streamable HTTP lets requests land on different server instances.
  // OAuth state remains shared through MongoDB, so multiple Claude connectors
  // can use the same deployment without process-local session affinity.
  app.post("/mcp", async (request, response) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    let cleanedUp = false;
    const cleanup = async () => {
      if (cleanedUp) return;
      cleanedUp = true;
      await Promise.allSettled([transport.close(), server.close()]);
    };

    response.once("close", () => void cleanup());

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      console.error(`[MCP] HTTP request failed: ${error.message}`);
      if (!response.headersSent) {
        jsonRpcError(response, 500, "Internal server error");
      }
    } finally {
      if (response.writableEnded) await cleanup();
    }
  });

  app.all("/mcp", (_request, response) => {
    response.setHeader("Allow", "POST");
    jsonRpcError(response, 405, "Method not allowed");
  });

  app.use((error, _request, response, _next) => {
    console.error(`[MCP] HTTP error: ${error.message}`);
    if (!response.headersSent) {
      response.status(500).json({
        status: "error",
        code: "MCP_HTTP_ERROR",
        message: "Internal server error",
      });
    }
  });

  return app;
};

export const startHttpServer = () => {
  const app = createHttpApp();
  const listener = app.listen(config.port, "0.0.0.0", () => {
    console.error(
      `[MCP] ${config.name} ${config.version} listening on port ${config.port}`,
    );
  });

  const shutdown = async () => {
    await new Promise((resolve) => listener.close(resolve));
    await disconnectOAuthDatabase();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  return listener;
};

const isDirectExecution =
  process.argv[1] &&
  realpathSync(path.resolve(process.argv[1])) ===
    realpathSync(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  try {
    startHttpServer();
  } catch (error) {
    console.error(`[MCP] Fatal startup error: ${error.message}`);
    process.exit(1);
  }
}
