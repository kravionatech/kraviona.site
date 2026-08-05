#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import express from 'express';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { getOAuthProtectedResourceMetadataUrl, mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from './index.js';
import { KravionaOAuthProvider } from './oauth.js';

const host = '0.0.0.0';
const port = Number(process.env.PORT || 4100);
const bearerToken = process.env.MCP_BEARER_TOKEN?.trim();
const inferredPublicUrl = process.env.MCP_PUBLIC_URL
  || process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  || process.env.RENDER_EXTERNAL_URL
  || (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : undefined)
  || `http://127.0.0.1:${port}`;
const publicUrl = new URL(inferredPublicUrl);
const resourceUrl = new URL('/mcp', publicUrl);

if (!bearerToken || bearerToken.length < 24) {
  console.error('MCP_BEARER_TOKEN is required and must contain at least 24 characters.');
  process.exit(1);
}

const app = createMcpExpressApp({ host });
app.set('trust proxy', 1);

// MCP & CORS headers middleware for all responses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, mcp-session-id');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const sessions = new Map();
const oauthProvider = new KravionaOAuthProvider({ accessKey: bearerToken, resourceUrl });
const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(resourceUrl);
const requireMcpAuth = requireBearerAuth({
  verifier: oauthProvider,
  requiredScopes: ['mcp:tools'],
  resourceMetadataUrl
});

app.get('/.well-known/oauth-protected-resource', (_req, res) => res.json({
  resource: resourceUrl.href,
  authorization_servers: [publicUrl.href],
  scopes_supported: ['mcp:tools'],
  bearer_methods_supported: ['header'],
  resource_name: 'Kraviona CMS'
}));

app.post('/oauth/approve', express.urlencoded({ extended: false }), (req, res) => {
  oauthProvider.approve(req.body.request_id, req.body.access_key, res);
});

app.use(mcpAuthRouter({
  provider: oauthProvider,
  issuerUrl: publicUrl,
  baseUrl: publicUrl,
  resourceServerUrl: resourceUrl,
  scopesSupported: ['mcp:tools'],
  resourceName: 'Kraviona CMS'
}));

app.get('/', (_req, res) => {
  res.json({ name: 'Kraviona MCP Server', status: 'online', endpoint: '/mcp', oauth: true });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', ok: true, service: 'kraviona-mcp', transport: 'streamable-http' });
});

app.post('/mcp', requireMcpAuth, async (req, res) => {
  const sessionId = req.get('mcp-session-id');

  try {
    let session = sessionId ? sessions.get(sessionId) : undefined;

    if (!session && !sessionId && isInitializeRequest(req.body)) {
      const server = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: id => sessions.set(id, { server, transport })
      });

      transport.onclose = () => {
        if (transport.sessionId) sessions.delete(transport.sessionId);
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (!session) {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid or missing MCP session ID' },
        id: null
      });
    }

    await session.transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP POST failed:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null
      });
    }
  }
});

async function handleSessionRequest(req, res) {
  const session = sessions.get(req.get('mcp-session-id'));
  if (!session) return res.status(400).send('Invalid or missing MCP session ID');
  await session.transport.handleRequest(req, res);
}

app.get('/mcp', requireMcpAuth, (_req, res) => {
  res.status(405).set('Allow', 'POST, DELETE').send('Method Not Allowed');
});
app.delete('/mcp', requireMcpAuth, handleSessionRequest);

const listener = app.listen(port, host, error => {
  if (error) throw error;
  console.log(`Kraviona MCP listening on ${host}:${port} (${resourceUrl.href})`);
});
listener.keepAliveTimeout = 65000;
listener.headersTimeout = 66000;

async function shutdown() {
  listener.close();
  await Promise.allSettled([...sessions.values()].map(({ transport }) => transport.close()));
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);