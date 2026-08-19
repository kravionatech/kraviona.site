import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  InvalidClientMetadataError,
  InvalidGrantError,
  InvalidScopeError,
  InvalidTargetError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { config } from "./config.js";
import { oauthStore } from "./oauth-store.js";

const SCOPES = Object.freeze(["mcp:tools"]);

const hashToken = (value) =>
  createHash("sha256").update(String(value || "")).digest("hex");

const randomToken = () => randomBytes(48).toString("base64url");

const secretMatches = (supplied, expected) => {
  const left = Buffer.from(String(supplied || ""));
  const right = Buffer.from(String(expected || ""));
  return left.length === right.length && timingSafeEqual(left, right);
};

const normalizeUrl = (value) => {
  try {
    return new URL(String(value)).href.replace(/\/$/, "");
  } catch {
    return "";
  }
};

const assertResource = (resource) => {
  const expected = normalizeUrl(config.oauth.resourceUrl);
  const supplied = resource?.href || resource;
  if (supplied && normalizeUrl(supplied) !== expected) {
    throw new InvalidTargetError(
      "The requested resource is not this MCP server.",
    );
  }
  return expected;
};

const assertScopes = (scopes = []) => {
  const requested = scopes.length ? scopes : [...SCOPES];
  if (requested.some((scope) => !SCOPES.includes(scope))) {
    throw new InvalidScopeError("Only the mcp:tools scope is supported.");
  }
  return [...new Set(requested)];
};

const redirectAllowed = (uri) =>
  config.oauth.redirectUris.includes(normalizeUrl(uri));

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

class PersistentClaudeClientsStore {
  async getClient(clientId) {
    return oauthStore.getClient(String(clientId));
  }

  async registerClient(metadata) {
    if (
      !metadata.redirect_uris?.length ||
      metadata.redirect_uris.some((uri) => !redirectAllowed(uri))
    ) {
      throw new InvalidClientMetadataError(
        "Only configured Claude MCP callback URLs are allowed.",
      );
    }

    const client = {
      ...metadata,
      client_id: `kraviona_site_${randomBytes(24).toString("base64url")}`,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: String(metadata.client_name || "Claude").slice(0, 100),
      redirect_uris: metadata.redirect_uris.map(normalizeUrl),
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: SCOPES.join(" "),
      createdAt: new Date(),
    };
    delete client.client_secret;
    delete client.client_secret_expires_at;

    await oauthStore.saveClient(client);
    return client;
  }
}

const issueTokens = async ({ clientId, scopes, resource }) => {
  const accessToken = randomToken();
  const refreshToken = randomToken();
  const now = new Date();
  const accessExpiresAt = new Date(
    now.getTime() + config.oauth.accessTokenTtlSeconds * 1000,
  );
  const refreshExpiresAt = new Date(
    now.getTime() + config.oauth.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  );

  await oauthStore.saveToken(hashToken(accessToken), {
    refreshHash: hashToken(refreshToken),
    clientId,
    scopes,
    resource,
    createdAt: now,
    accessExpiresAt,
    refreshExpiresAt,
    expiresAt: refreshExpiresAt,
  });

  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: config.oauth.accessTokenTtlSeconds,
    refresh_token: refreshToken,
    scope: scopes.join(" "),
  };
};

class KravionaOAuthProvider {
  constructor() {
    this.clientsStore = new PersistentClaudeClientsStore();
  }

  async authorize(client, params, response) {
    const scopes = assertScopes(params.scopes);
    const resource = assertResource(params.resource);
    const requestToken = randomToken();
    const now = new Date();

    await oauthStore.savePending(hashToken(requestToken), {
      clientId: client.client_id,
      redirectUri: normalizeUrl(params.redirectUri),
      state: params.state,
      scopes,
      codeChallenge: params.codeChallenge,
      resource,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    });

    response
      .status(200)
      .set({
        "Cache-Control": "no-store, no-transform",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      })
      .type("html")
      .send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authorize Kraviona.site MCP</title><style>
body{margin:0;background:#f5f7f7;color:#11242a;font-family:Inter,system-ui,sans-serif;display:grid;min-height:100vh;place-items:center}.card{width:min(440px,calc(100% - 40px));background:#fff;border:1px solid #dce4e5;border-radius:20px;padding:32px;box-shadow:0 20px 60px #16343e1a}.mark{width:48px;height:48px;border-radius:14px;background:#123d46;color:#ff6a3d;display:grid;place-items:center;font-size:24px;font-weight:800}h1{font-size:26px;margin:22px 0 8px}p{color:#5b6a6e;line-height:1.55}label{display:block;font-size:13px;font-weight:700;margin:24px 0 8px}input{box-sizing:border-box;width:100%;padding:13px 14px;border:1px solid #cbd7d9;border-radius:10px;font:inherit}button{width:100%;margin-top:14px;padding:13px;border:0;border-radius:10px;background:#123d46;color:#fff;font-weight:750;cursor:pointer}.note{font-size:12px;margin-top:16px}</style></head>
<body><main class="card"><div class="mark">K</div><h1>Connect Claude to Kraviona.site</h1>
<p>Claude is requesting access to the Kraviona.site CMS tools, including content publishing and administration.</p>
<form method="post" action="/oauth/approve"><input type="hidden" name="request_id" value="${escapeHtml(requestToken)}">
<label for="access_key">MCP access key</label><input id="access_key" name="access_key" type="password" required autocomplete="current-password">
<button type="submit">Authorize Claude</button></form><p class="note">The access key authorizes this Claude connection. CMS administrator credentials are never sent to Claude.</p></main></body></html>`);
  }

  async approve(requestToken, suppliedKey, response) {
    const requestHash = hashToken(requestToken);
    const request = await oauthStore.getPending(requestHash);
    if (!request) {
      return response
        .status(400)
        .send("Authorization request expired. Return to Claude and connect again.");
    }
    if (!secretMatches(suppliedKey, config.bearerToken)) {
      return response
        .status(401)
        .send("Invalid MCP access key. Go back and try again.");
    }

    const consumed = await oauthStore.consumePending(requestHash);
    if (!consumed) {
      return response.status(400).send("Authorization request was already used.");
    }

    const code = randomToken();
    const now = new Date();
    await oauthStore.saveCode(hashToken(code), {
      ...consumed,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
    });

    const target = new URL(consumed.redirectUri);
    target.searchParams.set("code", code);
    if (consumed.state) target.searchParams.set("state", consumed.state);
    return response.redirect(302, target.href);
  }

  async challengeForAuthorizationCode(client, authorizationCode) {
    const code = await oauthStore.getCode(
      hashToken(authorizationCode),
      client.client_id,
    );
    if (!code) throw new InvalidGrantError("Invalid authorization code.");
    return code.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client,
    authorizationCode,
    _codeVerifier,
    redirectUri,
    resource,
  ) {
    const code = await oauthStore.consumeCode(
      hashToken(authorizationCode),
      client.client_id,
    );
    if (!code) throw new InvalidGrantError("Invalid authorization code.");
    if (redirectUri && normalizeUrl(redirectUri) !== code.redirectUri) {
      throw new InvalidGrantError(
        "redirect_uri does not match the authorization request.",
      );
    }
    if (resource && normalizeUrl(resource?.href || resource) !== code.resource) {
      throw new InvalidTargetError(
        "Token resource does not match the authorization request.",
      );
    }
    return issueTokens({
      clientId: code.clientId,
      scopes: code.scopes,
      resource: code.resource,
    });
  }

  async exchangeRefreshToken(client, refreshToken, scopes, resource) {
    const token = await oauthStore.consumeRefreshToken(
      hashToken(refreshToken),
      client.client_id,
    );
    if (!token) throw new InvalidGrantError("Invalid or expired refresh token.");

    const nextScopes = scopes?.length ? assertScopes(scopes) : token.scopes;
    if (nextScopes.some((scope) => !token.scopes.includes(scope))) {
      throw new InvalidScopeError(
        "Refresh token cannot gain additional scopes.",
      );
    }
    if (
      resource &&
      normalizeUrl(resource?.href || resource) !== token.resource
    ) {
      throw new InvalidTargetError("Refresh token resource does not match.");
    }

    return issueTokens({
      clientId: token.clientId,
      scopes: nextScopes,
      resource: token.resource,
    });
  }

  async verifyAccessToken(accessToken) {
    if (secretMatches(accessToken, config.bearerToken)) {
      return {
        token: accessToken,
        clientId: "static-bearer-client",
        scopes: [...SCOPES],
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        resource: new URL(config.oauth.resourceUrl),
      };
    }

    const token = await oauthStore.getAccessToken(hashToken(accessToken));
    if (!token) throw new InvalidTokenError("Invalid or expired access token.");
    assertResource(token.resource);
    return {
      token: accessToken,
      clientId: token.clientId,
      scopes: token.scopes,
      expiresAt: Math.floor(new Date(token.accessExpiresAt).getTime() / 1000),
      resource: new URL(token.resource),
    };
  }

  async revokeToken(client, request) {
    await oauthStore.revokeToken(client.client_id, hashToken(request.token));
  }
}

export const oauthProvider = new KravionaOAuthProvider();
export const oauthScopes = SCOPES;
