let appPromise;

const firstHeaderValue = (value) =>
  String(value || "")
    .split(",", 1)[0]
    .trim();

const inferPublicUrl = (request) => {
  const host = firstHeaderValue(
    request.headers["x-forwarded-host"] || request.headers.host,
  );
  if (!host || !/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) {
    throw new Error("Cannot determine a valid public MCP hostname");
  }

  const forwardedProtocol = firstHeaderValue(
    request.headers["x-forwarded-proto"],
  );
  const protocol = forwardedProtocol === "http" ? "http" : "https";
  return `${protocol}://${host}`;
};

const createApp = async (request) => {
  if (
    !process.env.MCP_PUBLIC_URL &&
    !process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    !process.env.VERCEL_URL
  ) {
    process.env.MCP_PUBLIC_URL = inferPublicUrl(request);
  }

  const { createHttpApp } = await import("../src/http.js");
  return createHttpApp();
};

export default async function handler(request, response) {
  try {
    appPromise ||= createApp(request);
    const app = await appPromise;
    return app(request, response);
  } catch (error) {
    appPromise = undefined;
    console.error(`[MCP] Vercel initialization failed: ${error.message}`);
    if (!response.headersSent) {
      return response.status(500).json({
        status: "error",
        code: "MCP_INITIALIZATION_FAILED",
        message: error.message,
      });
    }
    return response.end();
  }
}
