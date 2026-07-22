import { randomUUID, timingSafeEqual } from 'node:crypto';
import {
  InvalidClientMetadataError,
  InvalidGrantError,
  InvalidScopeError,
  InvalidTargetError,
  InvalidTokenError
} from '@modelcontextprotocol/sdk/server/auth/errors.js';

const CLAUDE_REDIRECT_URIS = new Set([
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback'
]);

function secretMatches(supplied, expected) {
  const left = Buffer.from(supplied || '');
  const right = Buffer.from(expected || '');
  return left.length === right.length && timingSafeEqual(left, right);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

class ClaudeClientsStore {
  constructor() {
    this.clients = new Map();
  }

  getClient(clientId) {
    return this.clients.get(clientId);
  }

  registerClient(client) {
    if (!client.redirect_uris?.length || !client.redirect_uris.every(uri => CLAUDE_REDIRECT_URIS.has(uri))) {
      throw new InvalidClientMetadataError('Only the official Claude MCP callback URLs are allowed.');
    }

    const registered = {
      ...client,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      client_secret: undefined,
      client_secret_expires_at: undefined
    };
    this.clients.set(registered.client_id, registered);
    return registered;
  }
}

export class KravionaOAuthProvider {
  constructor({ accessKey, resourceUrl }) {
    this.accessKey = accessKey;
    this.resourceUrl = resourceUrl;
    this.clientsStore = new ClaudeClientsStore();
    this.pending = new Map();
    this.codes = new Map();
    this.accessTokens = new Map();
    this.refreshTokens = new Map();
  }

  validateResource(resource) {
    if (resource && resource.href !== this.resourceUrl.href) {
      throw new InvalidTargetError('The requested resource is not this MCP server.');
    }
  }

  async authorize(client, params, res) {
    this.validateResource(params.resource);
    const scopes = params.scopes?.length ? params.scopes : ['mcp:tools'];
    if (scopes.some(scope => scope !== 'mcp:tools')) {
      throw new InvalidScopeError('Only the mcp:tools scope is supported.');
    }

    const requestId = randomUUID();
    this.pending.set(requestId, {
      client,
      params: { ...params, scopes },
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    res.status(200).type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authorize Kraviona MCP</title><style>
body{margin:0;background:#f5f7f7;color:#11242a;font-family:Inter,system-ui,sans-serif;display:grid;min-height:100vh;place-items:center}.card{width:min(440px,calc(100% - 40px));background:#fff;border:1px solid #dce4e5;border-radius:20px;padding:32px;box-shadow:0 20px 60px #16343e1a}.mark{width:48px;height:48px;border-radius:14px;background:#123d46;color:#ff6a3d;display:grid;place-items:center;font-size:24px;font-weight:800}h1{font-size:26px;margin:22px 0 8px}p{color:#5b6a6e;line-height:1.55}label{display:block;font-size:13px;font-weight:700;margin:24px 0 8px}input{box-sizing:border-box;width:100%;padding:13px 14px;border:1px solid #cbd7d9;border-radius:10px;font:inherit}button{width:100%;margin-top:14px;padding:13px;border:0;border-radius:10px;background:#123d46;color:#fff;font-weight:750;cursor:pointer}.note{font-size:12px;margin-top:16px}</style></head>
<body><main class="card"><div class="mark">K</div><h1>Connect Claude to Kraviona</h1>
<p>Claude is requesting access to the Kraviona CMS tools, including content publishing and administration.</p>
<form method="post" action="/oauth/approve"><input type="hidden" name="request_id" value="${escapeHtml(requestId)}">
<label for="access_key">MCP access key</label><input id="access_key" name="access_key" type="password" required autocomplete="current-password">
<button type="submit">Authorize Claude</button></form><p class="note">Your backend admin password is not shared with Claude.</p></main></body></html>`);
  }

  approve(requestId, suppliedKey, res) {
    const request = this.pending.get(requestId);
    if (!request || request.expiresAt < Date.now()) {
      this.pending.delete(requestId);
      return res.status(400).send('Authorization request expired. Return to Claude and connect again.');
    }
    if (!secretMatches(suppliedKey, this.accessKey)) {
      return res.status(401).send('Invalid MCP access key. Go back and try again.');
    }

    this.pending.delete(requestId);
    const code = randomUUID();
    this.codes.set(code, { ...request, expiresAt: Date.now() + 5 * 60 * 1000 });
    const target = new URL(request.params.redirectUri);
    target.searchParams.set('code', code);
    if (request.params.state) target.searchParams.set('state', request.params.state);
    return res.redirect(302, target.href);
  }

  async challengeForAuthorizationCode(client, authorizationCode) {
    const record = this.codes.get(authorizationCode);
    if (!record || record.expiresAt < Date.now() || record.client.client_id !== client.client_id) {
      throw new InvalidGrantError('Invalid or expired authorization code.');
    }
    return record.params.codeChallenge;
  }

  async exchangeAuthorizationCode(client, authorizationCode, _codeVerifier, redirectUri, resource) {
    const record = this.codes.get(authorizationCode);
    if (!record || record.expiresAt < Date.now() || record.client.client_id !== client.client_id) {
      throw new InvalidGrantError('Invalid or expired authorization code.');
    }
    if (redirectUri && redirectUri !== record.params.redirectUri) {
      throw new InvalidGrantError('redirect_uri does not match the authorization request.');
    }
    this.validateResource(resource || record.params.resource);
    this.codes.delete(authorizationCode);
    return this.issueTokens(client.client_id, record.params.scopes, record.params.resource || this.resourceUrl);
  }

  async exchangeRefreshToken(client, refreshToken, scopes, resource) {
    const record = this.refreshTokens.get(refreshToken);
    if (!record || record.expiresAt < Date.now() || record.clientId !== client.client_id) {
      throw new InvalidGrantError('Invalid or expired refresh token.');
    }
    this.validateResource(resource || record.resource);
    const requestedScopes = scopes?.length ? scopes : record.scopes;
    if (requestedScopes.some(scope => !record.scopes.includes(scope))) {
      throw new InvalidScopeError('Refresh request contains an unauthorized scope.');
    }
    this.refreshTokens.delete(refreshToken);
    return this.issueTokens(client.client_id, requestedScopes, record.resource);
  }

  issueTokens(clientId, scopes, resource) {
    const accessToken = randomUUID() + randomUUID();
    const refreshToken = randomUUID() + randomUUID();
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    this.accessTokens.set(accessToken, { clientId, scopes, resource, expiresAt });
    this.refreshTokens.set(refreshToken, { clientId, scopes, resource, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 8 * 60 * 60,
      refresh_token: refreshToken,
      scope: scopes.join(' ')
    };
  }

  async verifyAccessToken(token) {
    if (secretMatches(token, this.accessKey)) {
      return {
        token,
        clientId: 'static-bearer-client',
        scopes: ['mcp:tools'],
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        resource: this.resourceUrl
      };
    }

    const record = this.accessTokens.get(token);
    if (!record || record.expiresAt < Date.now()) {
      this.accessTokens.delete(token);
      throw new InvalidTokenError('Invalid or expired access token.');
    }
    return {
      token,
      clientId: record.clientId,
      scopes: record.scopes,
      expiresAt: Math.floor(record.expiresAt / 1000),
      resource: record.resource
    };
  }

  async revokeToken(client, request) {
    const access = this.accessTokens.get(request.token);
    const refresh = this.refreshTokens.get(request.token);
    if (access?.clientId === client.client_id) this.accessTokens.delete(request.token);
    if (refresh?.clientId === client.client_id) this.refreshTokens.delete(request.token);
  }
}
