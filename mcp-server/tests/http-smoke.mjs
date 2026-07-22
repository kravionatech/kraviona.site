import { spawn } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const port = 4199;
const token = 'local-http-smoke-token-32-characters';
const cwd = new URL('..', import.meta.url).pathname;
const child = spawn(process.execPath, ['src/http.js'], {
  cwd,
  env: { ...process.env, PORT: String(port), MCP_BEARER_TOKEN: token },
  stdio: ['ignore', 'pipe', 'pipe']
});

let logs = '';
child.stdout.on('data', chunk => { logs += chunk; });
child.stderr.on('data', chunk => { logs += chunk; });

try {
  const deadline = Date.now() + 10_000;
  let health;
  while (Date.now() < deadline) {
    try {
      health = await fetch(`http://127.0.0.1:${port}/health`);
      if (health.ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!health?.ok) throw new Error(`HTTP server did not become healthy. ${logs}`);

  const unauthorized = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
  });
  if (unauthorized.status !== 401) throw new Error(`Expected 401, received ${unauthorized.status}`);

  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } }
  });
  const client = new Client({ name: 'kraviona-http-smoke-test', version: '1.0.0' });
  await client.connect(transport);
  const tools = await client.listTools();
  if (tools.tools.length < 20) throw new Error(`Expected at least 20 tools, received ${tools.tools.length}`);

  const healthTool = await client.callTool({ name: 'cms_health', arguments: {} });
  if (healthTool.isError) throw new Error(`Backend health tool failed: ${healthTool.content?.[0]?.text}`);

  if (process.env.KRAVIONA_ADMIN_EMAIL && process.env.KRAVIONA_ADMIN_PASSWORD) {
    const posts = await client.callTool({ name: 'list_posts', arguments: { status: 'all', limit: 2 } });
    if (posts.isError) throw new Error(`Authenticated production API call failed: ${posts.content?.[0]?.text}`);
  }

  await client.close();
  console.log(`HTTP MCP smoke test passed: bearer auth enforced, ${tools.tools.length} tools available, backend API reachable${process.env.KRAVIONA_ADMIN_EMAIL ? ', authenticated API access confirmed' : ''}.`);
} finally {
  child.kill('SIGTERM');
}
