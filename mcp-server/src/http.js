#!/usr/bin/env node
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from './index.js';

const host = '0.0.0.0';
const port = Number(process.env.PORT || 4100);
const bearerToken = process.env.MCP_BEARER_TOKEN?.trim();

if (!bearerToken || bearerToken.length < 24) {
  console.error('MCP_BEARER_TOKEN is required and must contain at least 24 characters.');
  process.exit(1);
}

const app = createMcpExpressApp({ host });
const sessions = new Map();

function tokenMatches(value) {
  if (!value?.startsWith('Bearer ')) return false;
  const supplied = Buffer.from(value.slice(7));
  const expected = Buffer.from(bearerToken);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function requireBearerToken(req, res, next) {
  if (!tokenMatches(req.get('authorization'))) {
    res.set('WWW-Authenticate', 'Bearer realm="kraviona-mcp"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/', (_req, res) => {
  res.json({ name: 'Kraviona MCP Server', status: 'online', endpoint: '/mcp' });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'kraviona-mcp', transport: 'streamable-http' });
});

app.post('/mcp', requireBearerToken, async (req, res) => {
  const sessionId = req.get('mcp-session-id');

  try {
    let session = sessionId ? sessions.get(sessionId) : undefined;

    if (!session && !sessionId && isInitializeRequest(req.body)) {
      const server = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
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

app.get('/mcp', requireBearerToken, handleSessionRequest);
app.delete('/mcp', requireBearerToken, handleSessionRequest);

const listener = app.listen(port, host, error => {
  if (error) throw error;
  console.log(`Kraviona MCP listening on ${host}:${port}`);
});

async function shutdown() {
  listener.close();
  await Promise.allSettled([...sessions.values()].map(({ transport }) => transport.close()));
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
