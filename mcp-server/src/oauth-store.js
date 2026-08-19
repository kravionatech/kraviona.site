import { config } from "./config.js";
import { connectOAuthDatabase } from "./db.js";

const COLLECTIONS = Object.freeze({
  clients: "kraviona_site_mcp_oauth_clients",
  pending: "kraviona_site_mcp_oauth_pending",
  codes: "kraviona_site_mcp_oauth_codes",
  tokens: "kraviona_site_mcp_oauth_tokens",
});

const isLive = (document, field = "expiresAt") =>
  document && new Date(document[field]).getTime() > Date.now();

class MemoryOAuthStore {
  constructor() {
    this.clients = new Map();
    this.pending = new Map();
    this.codes = new Map();
    this.tokens = new Map();
  }

  async getClient(clientId) {
    return this.clients.get(clientId) || null;
  }

  async saveClient(client) {
    this.clients.set(client.client_id, client);
  }

  async savePending(requestHash, document) {
    this.pending.set(requestHash, document);
  }

  async getPending(requestHash) {
    const document = this.pending.get(requestHash);
    if (!isLive(document)) this.pending.delete(requestHash);
    return isLive(document) ? document : null;
  }

  async consumePending(requestHash) {
    const document = await this.getPending(requestHash);
    if (document) this.pending.delete(requestHash);
    return document;
  }

  async saveCode(codeHash, document) {
    this.codes.set(codeHash, document);
  }

  async getCode(codeHash, clientId) {
    const document = this.codes.get(codeHash);
    if (!isLive(document) || document?.clientId !== clientId) {
      if (!isLive(document)) this.codes.delete(codeHash);
      return null;
    }
    return document;
  }

  async consumeCode(codeHash, clientId) {
    const document = await this.getCode(codeHash, clientId);
    if (document) this.codes.delete(codeHash);
    return document;
  }

  async saveToken(accessHash, document) {
    this.tokens.set(accessHash, document);
  }

  async getAccessToken(accessHash) {
    const document = this.tokens.get(accessHash);
    if (!isLive(document, "accessExpiresAt")) return null;
    return document;
  }

  async consumeRefreshToken(refreshHash, clientId) {
    for (const [accessHash, document] of this.tokens) {
      if (
        document.refreshHash === refreshHash &&
        document.clientId === clientId &&
        isLive(document, "refreshExpiresAt")
      ) {
        this.tokens.delete(accessHash);
        return document;
      }
    }
    return null;
  }

  async revokeToken(clientId, tokenHash) {
    for (const [accessHash, document] of this.tokens) {
      if (
        document.clientId === clientId &&
        (accessHash === tokenHash || document.refreshHash === tokenHash)
      ) {
        this.tokens.delete(accessHash);
      }
    }
  }
}

class MongoOAuthStore {
  constructor() {
    this.indexesReady = null;
  }

  async collections() {
    const connection = await connectOAuthDatabase();
    const collections = Object.fromEntries(
      Object.entries(COLLECTIONS).map(([key, name]) => [
        key,
        connection.db.collection(name),
      ]),
    );

    if (!this.indexesReady) {
      this.indexesReady = Promise.all([
        collections.clients.createIndex({ client_id: 1 }, { unique: true }),
        collections.pending.createIndex({ requestHash: 1 }, { unique: true }),
        collections.pending.createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 },
        ),
        collections.codes.createIndex({ codeHash: 1 }, { unique: true }),
        collections.codes.createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 },
        ),
        collections.tokens.createIndex({ accessHash: 1 }, { unique: true }),
        collections.tokens.createIndex({ refreshHash: 1 }, { unique: true }),
        collections.tokens.createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 },
        ),
      ]).catch((error) => {
        this.indexesReady = null;
        throw error;
      });
    }
    await this.indexesReady;
    return collections;
  }

  async getClient(clientId) {
    const { clients } = await this.collections();
    return clients.findOne({ client_id: clientId });
  }

  async saveClient(client) {
    const { clients } = await this.collections();
    await clients.insertOne(client);
  }

  async savePending(requestHash, document) {
    const { pending } = await this.collections();
    await pending.insertOne({ requestHash, ...document });
  }

  async getPending(requestHash) {
    const { pending } = await this.collections();
    return pending.findOne({ requestHash, expiresAt: { $gt: new Date() } });
  }

  async consumePending(requestHash) {
    const { pending } = await this.collections();
    return pending.findOneAndDelete({
      requestHash,
      expiresAt: { $gt: new Date() },
    });
  }

  async saveCode(codeHash, document) {
    const { codes } = await this.collections();
    await codes.insertOne({ codeHash, ...document });
  }

  async getCode(codeHash, clientId) {
    const { codes } = await this.collections();
    return codes.findOne({
      codeHash,
      clientId,
      expiresAt: { $gt: new Date() },
    });
  }

  async consumeCode(codeHash, clientId) {
    const { codes } = await this.collections();
    return codes.findOneAndDelete({
      codeHash,
      clientId,
      expiresAt: { $gt: new Date() },
    });
  }

  async saveToken(accessHash, document) {
    const { tokens } = await this.collections();
    await tokens.insertOne({ accessHash, ...document });
  }

  async getAccessToken(accessHash) {
    const { tokens } = await this.collections();
    return tokens.findOne({
      accessHash,
      accessExpiresAt: { $gt: new Date() },
    });
  }

  async consumeRefreshToken(refreshHash, clientId) {
    const { tokens } = await this.collections();
    return tokens.findOneAndDelete({
      refreshHash,
      clientId,
      refreshExpiresAt: { $gt: new Date() },
    });
  }

  async revokeToken(clientId, tokenHash) {
    const { tokens } = await this.collections();
    await tokens.deleteOne({
      clientId,
      $or: [{ accessHash: tokenHash }, { refreshHash: tokenHash }],
    });
  }
}

export const oauthStore =
  config.oauthStore === "memory"
    ? new MemoryOAuthStore()
    : new MongoOAuthStore();
