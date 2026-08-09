import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const port = 4199;
const token = "local-http-smoke-token-32-characters";
const cwd = fileURLToPath(new URL("..", import.meta.url));
const child = spawn(process.execPath, ["src/http.js"], {
  cwd,
  env: {
    ...process.env,
    PORT: String(port),
    MCP_BEARER_TOKEN: token,
    MCP_PUBLIC_URL: `http://127.0.0.1:${port}`,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let logs = "";
child.stdout.on("data", (chunk) => {
  logs += chunk;
});
child.stderr.on("data", (chunk) => {
  logs += chunk;
});

try {
  const deadline = Date.now() + 10_000;
  let health;
  while (Date.now() < deadline) {
    try {
      health = await fetch(`http://127.0.0.1:${port}/health`);
      if (health.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!health?.ok)
    throw new Error(`HTTP server did not become healthy. ${logs}`);

  const unauthorized = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {},
    }),
  });
  if (unauthorized.status !== 401)
    throw new Error(`Expected 401, received ${unauthorized.status}`);
  if (
    !unauthorized.headers
      .get("www-authenticate")
      ?.includes("resource_metadata=")
  ) {
    throw new Error(
      "OAuth resource metadata was not advertised in the 401 response",
    );
  }

  const issuer = `http://127.0.0.1:${port}`;
  const resource = `${issuer}/mcp`;
  const metadata = await fetch(
    `${issuer}/.well-known/oauth-authorization-server`,
  ).then((response) => response.json());
  if (
    !metadata.registration_endpoint ||
    !metadata.authorization_endpoint ||
    !metadata.token_endpoint
  ) {
    throw new Error("OAuth discovery metadata is incomplete");
  }

  const registration = await fetch(metadata.registration_endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      client_name: "Claude",
    }),
  }).then((response) => response.json());
  if (!registration.client_id)
    throw new Error(`OAuth DCR failed: ${JSON.stringify(registration)}`);

  const verifier = "oauth-http-smoke-verifier-that-is-long-enough-123456789";
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const authorizeUrl = new URL(metadata.authorization_endpoint);
  authorizeUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: registration.client_id,
    redirect_uri: "https://claude.ai/api/mcp/auth_callback",
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: "mcp:tools",
    resource,
    state: "smoke-state",
  });
  const consent = await fetch(authorizeUrl, { redirect: "manual" });
  const consentHtml = await consent.text();
  const requestId = consentHtml.match(/name="request_id" value="([^"]+)"/)?.[1];
  if (consent.status !== 200 || !requestId)
    throw new Error("OAuth consent page was not rendered");

  const approval = await fetch(`${issuer}/oauth/approve`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ request_id: requestId, access_key: token }),
  });
  const callback = new URL(approval.headers.get("location"));
  if (
    approval.status !== 302 ||
    callback.searchParams.get("state") !== "smoke-state"
  ) {
    throw new Error("OAuth approval did not return a valid Claude callback");
  }

  const tokenResponse = await fetch(metadata.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: registration.client_id,
      code: callback.searchParams.get("code"),
      code_verifier: verifier,
      redirect_uri: "https://claude.ai/api/mcp/auth_callback",
      resource,
    }),
  }).then((response) => response.json());
  if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
    throw new Error(
      `OAuth token exchange failed: ${JSON.stringify(tokenResponse)}`,
    );
  }

  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${port}/mcp`),
    {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
  const client = new Client({
    name: "kraviona-http-smoke-test",
    version: "1.0.0",
  });
  await client.connect(transport);
  const tools = await client.listTools();
  if (tools.tools.length < 20)
    throw new Error(
      `Expected at least 20 tools, received ${tools.tools.length}`,
    );

  const healthTool = await client.callTool({
    name: "cms_health",
    arguments: {},
  });
  if (healthTool.isError)
    throw new Error(
      `Backend health tool failed: ${healthTool.content?.[0]?.text}`,
    );

  if (process.env.KRAVIONA_ADMIN_EMAIL && process.env.KRAVIONA_ADMIN_PASSWORD) {
    const posts = await client.callTool({
      name: "list_posts",
      arguments: { status: "all", limit: 2 },
    });
    if (posts.isError)
      throw new Error(
        `Authenticated production API call failed: ${posts.content?.[0]?.text}`,
      );
  }

  await client.close();

  const oauthTransport = new StreamableHTTPClientTransport(new URL(resource), {
    requestInit: {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    },
  });
  const oauthClient = new Client({
    name: "kraviona-oauth-smoke-test",
    version: "1.0.0",
  });
  await oauthClient.connect(oauthTransport);
  const oauthTools = await oauthClient.listTools();
  await oauthClient.close();
  if (oauthTools.tools.length !== tools.tools.length)
    throw new Error("OAuth access token could not access all tools");

  console.log(
    `HTTP MCP smoke test passed: Claude DCR + PKCE OAuth, static bearer auth, ${tools.tools.length} tools, and backend API access confirmed.`,
  );
} finally {
  child.kill("SIGTERM");
}
