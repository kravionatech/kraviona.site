const DEFAULT_API_ORIGIN = "http://localhost:4000";
const REQUEST_TIMEOUT_MS = 30_000;

function normalizeOrigin(value) {
  return String(value || DEFAULT_API_ORIGIN)
    .trim()
    .replace(/\/$/, "")
    .replace(/\/api$/, "");
}

const apiOrigin = normalizeOrigin(process.env.KRAVIONA_API_URL);

async function readResponse(response) {
  if (response.status === 204) return { ok: true };
  return response.json().catch(() => ({}));
}

export class KravionaApi {
  constructor(origin = apiOrigin) {
    this.origin = origin;
    this.cookie = "";
  }

  async login() {
    const email = process.env.KRAVIONA_ADMIN_EMAIL?.trim();
    const password = process.env.KRAVIONA_ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "Set KRAVIONA_ADMIN_EMAIL and KRAVIONA_ADMIN_PASSWORD before using authenticated MCP tools.",
      );
    }

    const response = await fetch(`${this.origin}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const data = await readResponse(response);

    if (!response.ok) {
      throw new Error(data.error || `Admin login failed (${response.status}).`);
    }
    if (data.user?.role !== "admin") {
      throw new Error("The configured MCP account is not an administrator.");
    }

    const cookies = response.headers.getSetCookie?.() || [
      response.headers.get("set-cookie") || "",
    ];
    this.cookie = cookies
      .map((value) => value.split(";")[0])
      .filter(Boolean)
      .join("; ");
  }

  async request(path, options = {}, authenticated = true, retry = true) {
    if (authenticated && !this.cookie) await this.login();

    const response = await fetch(`${this.origin}/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authenticated && this.cookie ? { Cookie: this.cookie } : {}),
        ...options.headers,
      },
      signal: options.signal || AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 401 && authenticated && retry) {
      this.cookie = "";
      await this.login();
      return this.request(path, options, authenticated, false);
    }

    const data = await readResponse(response);
    if (!response.ok) {
      throw new Error(
        data.error || `Kraviona API request failed (${response.status}).`,
      );
    }
    return data;
  }

  async health() {
    const response = await fetch(`${this.origin}/health`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Health check failed (${response.status}).`);
    }
    return response.json();
  }
}

export const api = new KravionaApi();
