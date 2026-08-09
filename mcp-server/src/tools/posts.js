import { z } from "zod";
import { api } from "../api.js";
import { editablePostSchema, mongoId, updatePostSchema } from "../schemas.js";
import { buildQuery, registerTool } from "../toolkit.js";

export function registerPostTools(server) {
  registerTool(
    server,
    "list_posts",
    {
      title: "List Kraviona posts",
      description:
        "List editorial posts with optional status, search, page and result-limit filters.",
      inputSchema: z.object({
        status: z.enum(["all", "published", "draft"]).default("all"),
        search: z.string().trim().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
      annotations: { readOnlyHint: true },
    },
    ({ status, search, page, limit }) =>
      api.request(
        `/posts${buildQuery({
          status: "all",
          filter: status === "all" ? undefined : status,
          search,
          page,
          limit,
        })}`,
      ),
  );

  registerTool(
    server,
    "get_post",
    {
      title: "Get complete post",
      description: "Fetch every editable field for a post by its database ID.",
      inputSchema: z.object({ id: mongoId }),
      annotations: { readOnlyHint: true },
    },
    ({ id }) => api.request(`/posts/id/${id}`),
  );

  registerTool(
    server,
    "create_post",
    {
      title: "Create editorial post",
      description:
        "Create a complete Kraviona story. Keep it as a draft until facts, links and SEO have been checked by a human.",
      inputSchema: editablePostSchema,
      annotations: { idempotentHint: false },
    },
    (payload) =>
      api.request("/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "update_post",
    {
      title: "Update editorial post",
      description:
        "Update selected fields on a post. Fetch the post first before making substantial changes.",
      inputSchema: updatePostSchema,
      annotations: { idempotentHint: true },
    },
    ({ id, ...payload }) =>
      api.request(`/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "set_post_status",
    {
      title: "Publish or unpublish post",
      description:
        "Change a post between draft and published. Only publish after editorial verification.",
      inputSchema: z.object({
        id: mongoId,
        status: z.enum(["draft", "published"]),
      }),
      annotations: { idempotentHint: true },
    },
    ({ id, status }) =>
      api.request(`/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  );

  registerTool(
    server,
    "delete_post",
    {
      title: "Delete post permanently",
      description:
        "Permanently delete a post. The caller must explicitly set confirm to true.",
      inputSchema: z.object({ id: mongoId, confirm: z.literal(true) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id }) => api.request(`/posts/${id}`, { method: "DELETE" }),
  );
}
