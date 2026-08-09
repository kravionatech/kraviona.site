/**
 * Convert JavaScript data into the text response format expected by MCP.
 */
export function successResult(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Return a safe error to the MCP client without crashing the server process.
 */
export function errorResult(error) {
  return {
    content: [
      {
        type: "text",
        text: error instanceof Error ? error.message : String(error),
      },
    ],
    isError: true,
  };
}

/**
 * Register a tool with consistent success and error handling.
 */
export function registerTool(server, name, config, handler) {
  server.registerTool(name, config, async (arguments_) => {
    try {
      return successResult(await handler(arguments_));
    } catch (error) {
      return errorResult(error);
    }
  });
}

/**
 * Build an encoded query string while omitting empty values.
 */
export function buildQuery(parameters) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(parameters)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}
