import { createHash } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const origin = (process.env.MCP_PUBLIC_URL || "").replace(/\/$/, "");
const accessKey = process.env.MCP_BEARER_TOKEN;
if (!origin || !accessKey)
  throw new Error("MCP_PUBLIC_URL and MCP_BEARER_TOKEN are required");

const endpoint = `${origin}/mcp`;
console.log("1/7 OAuth discovery");
const metadata = await fetch(
  `${origin}/.well-known/oauth-authorization-server`,
).then(async (response) => {
  if (!response.ok)
    throw new Error(`OAuth metadata returned ${response.status}`);
  return response.json();
});

const registrationResponse = await fetch(metadata.registration_endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    client_name: "Claude production smoke test",
  }),
});
console.log("2/7 Dynamic client registration");
const registration = await registrationResponse.json();
if (!registrationResponse.ok || !registration.client_id) {
  throw new Error(
    `DCR failed (${registrationResponse.status}): ${JSON.stringify(registration)}`,
  );
}

const verifier = "kraviona-production-oauth-verifier-12345678901234567890";
const challenge = createHash("sha256").update(verifier).digest("base64url");
const authorizeUrl = new URL(metadata.authorization_endpoint);
authorizeUrl.search = new URLSearchParams({
  response_type: "code",
  client_id: registration.client_id,
  redirect_uri: "https://claude.ai/api/mcp/auth_callback",
  code_challenge: challenge,
  code_challenge_method: "S256",
  scope: "mcp:tools",
  resource: endpoint,
  state: "production-smoke",
});

const consent = await fetch(authorizeUrl, { redirect: "manual" });
console.log("3/7 Consent page");
const consentHtml = await consent.text();
const requestId = consentHtml.match(/name="request_id" value="([^"]+)"/)?.[1];
if (consent.status !== 200 || !requestId)
  throw new Error("Consent screen did not return an authorization request ID");

const approval = await fetch(`${origin}/oauth/approve`, {
  method: "POST",
  redirect: "manual",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ request_id: requestId, access_key: accessKey }),
});
console.log("4/7 Consent approval");
const callback = new URL(approval.headers.get("location"));
const code = callback.searchParams.get("code");
if (approval.status !== 302 || !code)
  throw new Error("Approval did not issue an authorization code");

const oauthResponse = await fetch(metadata.token_endpoint, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    client_id: registration.client_id,
    code,
    code_verifier: verifier,
    redirect_uri: "https://claude.ai/api/mcp/auth_callback",
    resource: endpoint,
  }),
});
console.log("5/7 OAuth token exchange");
const oauth = await oauthResponse.json();
if (!oauthResponse.ok || !oauth.access_token) {
  throw new Error(
    `Token exchange failed (${oauthResponse.status}): ${JSON.stringify(oauth)}`,
  );
}

const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
  requestInit: { headers: { Authorization: `Bearer ${oauth.access_token}` } },
  fetch: async (url, init) => {
    const response = await fetch(url, init);
    console.log(
      `MCP ${init?.method || "GET"} -> ${response.status} ${response.headers.get("content-type") || ""}`,
    );
    return response;
  },
});
const client = new Client({
  name: "kraviona-production-smoke",
  version: "1.0.0",
});
await client.connect(transport);
console.log("6/7 MCP initialize");
const tools = await client.listTools();
console.log("7/7 MCP tools and API reads");
const health = await client.callTool({ name: "cms_health", arguments: {} });
const posts = await client.callTool({
  name: "list_posts",
  arguments: { status: "all", limit: 1 },
});
await client.close();

if (tools.tools.length < 20 || health.isError || posts.isError) {
  throw new Error("Production MCP tool verification failed");
}

console.log(
  `Production OAuth MCP passed: DCR, PKCE, token exchange, ${tools.tools.length} tools, health and authenticated posts read.`,
);
