import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const hostProvidedPort = process.env.PORT;

// Host-provided values win, followed by the backend environment and then the
// MCP-only environment file.
dotenv.config({ path: path.join(directory, "../../backend/.env"), quiet: true });
dotenv.config({ path: path.join(directory, "../.env"), quiet: true });

const integerFromEnv = (name, fallback, minimum, maximum) => {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
};

const normalizeUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/$/, "");

const vercelHostname =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const inferredVercelUrl = vercelHostname ? `https://${vercelHostname}` : "";
const publicUrl = normalizeUrl(
  process.env.MCP_PUBLIC_URL || inferredVercelUrl,
);

export const config = Object.freeze({
  name: "kraviona-site-mcp",
  version: "3.0.0",
  transport: (
    process.env.MCP_TRANSPORT ||
    (hostProvidedPort ? "streamable-http" : "stdio")
  ).toLowerCase(),
  port: integerFromEnv("PORT", 4100, 1, 65_535),
  mongoUri:
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    "",
  databaseName: process.env.DB_NAME || "",
  dbTimeoutMs: integerFromEnv("MCP_DB_TIMEOUT_MS", 10_000, 1_000, 60_000),
  bearerToken: (process.env.MCP_BEARER_TOKEN || "").trim(),
  oauthStore: (process.env.MCP_OAUTH_STORE || "mongo").trim().toLowerCase(),
  oauth: Object.freeze({
    enabled: Boolean(publicUrl),
    publicUrl,
    resourceUrl: publicUrl ? `${publicUrl}/mcp` : "",
    redirectUris: Object.freeze(
      (process.env.MCP_OAUTH_REDIRECT_URIS ||
        "https://claude.ai/api/mcp/auth_callback,https://claude.com/api/mcp/auth_callback")
        .split(",")
        .map(normalizeUrl)
        .filter(Boolean),
    ),
    accessTokenTtlSeconds: integerFromEnv(
      "MCP_OAUTH_ACCESS_TOKEN_SECONDS",
      3600,
      300,
      86_400,
    ),
    refreshTokenTtlDays: integerFromEnv(
      "MCP_OAUTH_REFRESH_TOKEN_DAYS",
      30,
      1,
      90,
    ),
  }),
});

export const assertHttpConfiguration = () => {
  if (!config.oauth.enabled) {
    throw new Error("MCP_PUBLIC_URL is required for Streamable HTTP transport");
  }
  if (config.bearerToken.length < 24) {
    throw new Error(
      "MCP_BEARER_TOKEN is required and must contain at least 24 characters",
    );
  }
  if (!new Set(["mongo", "memory"]).has(config.oauthStore)) {
    throw new Error("MCP_OAUTH_STORE must be mongo or memory");
  }
  if (config.oauthStore === "memory" && process.env.NODE_ENV === "production") {
    throw new Error("MCP_OAUTH_STORE=memory is not allowed in production");
  }
  if (config.oauthStore === "mongo" && !config.mongoUri) {
    throw new Error("MONGO_URI is required for persistent remote OAuth");
  }
};
