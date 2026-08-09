import { z } from "zod";
import { api } from "../api.js";
import { mongoId } from "../schemas.js";
import { buildQuery, registerTool } from "../toolkit.js";

export function registerEditorialTools(server) {
  registerGuestPostTools(server);
  registerCommentTools(server);
  registerSubscriberTools(server);
  registerUserTools(server);
}

function registerGuestPostTools(server) {
  registerTool(
    server,
    "list_guest_posts",
    {
      title: "List guest posts",
      description:
        "List contributor articles, optionally filtered by their editorial status.",
      inputSchema: z.object({
        status: z
          .enum([
            "all",
            "draft",
            "submitted",
            "approved",
            "published",
            "rejected",
          ])
          .default("all"),
      }),
      annotations: { readOnlyHint: true },
    },
    ({ status }) => api.request(`/guest-posts${buildQuery({ status })}`),
  );

  registerTool(
    server,
    "get_guest_post",
    {
      title: "Get guest post",
      description:
        "Fetch the full contributor article, author, links and editorial notes.",
      inputSchema: z.object({ id: mongoId }),
      annotations: { readOnlyHint: true },
    },
    ({ id }) => api.request(`/guest-posts/${id}`),
  );

  registerTool(
    server,
    "review_guest_post",
    {
      title: "Review guest post",
      description:
        "Approve, reject or publish a contributor article and save private editorial notes. Publishing also creates its public journal post.",
      inputSchema: z.object({
        id: mongoId,
        status: z.enum(["approved", "rejected", "published"]),
        adminNotes: z.string().trim().max(2000).optional(),
      }),
      annotations: { idempotentHint: true },
    },
    ({ id, ...payload }) =>
      api.request(`/guest-posts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "delete_guest_post",
    {
      title: "Delete guest post permanently",
      description:
        "Permanently remove a contributor submission. Explicit confirmation is required.",
      inputSchema: z.object({ id: mongoId, confirm: z.literal(true) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id }) => api.request(`/guest-posts/${id}`, { method: "DELETE" }),
  );
}

function registerCommentTools(server) {
  registerTool(
    server,
    "list_comments",
    {
      title: "List comments for moderation",
      description: "List comments by pending, approved or spam status.",
      inputSchema: z.object({
        status: z.enum(["pending", "approved", "spam"]).default("pending"),
      }),
      annotations: { readOnlyHint: true },
    },
    ({ status }) => api.request(`/comments${buildQuery({ status })}`),
  );

  registerTool(
    server,
    "moderate_comment",
    {
      title: "Moderate comment",
      description: "Approve a useful comment or classify it as spam.",
      inputSchema: z.object({
        id: mongoId,
        status: z.enum(["approved", "spam"]),
      }),
      annotations: { idempotentHint: true },
    },
    ({ id, status }) =>
      api.request(`/comments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  );

  registerTool(
    server,
    "delete_comment",
    {
      title: "Delete comment permanently",
      description: "Permanently delete a comment after explicit confirmation.",
      inputSchema: z.object({ id: mongoId, confirm: z.literal(true) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id }) => api.request(`/comments/${id}`, { method: "DELETE" }),
  );
}

function registerSubscriberTools(server) {
  registerTool(
    server,
    "list_subscribers",
    {
      title: "List newsletter subscribers",
      description: "List newsletter contacts and their confirmation status.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    () => api.request("/subscribers"),
  );

  registerTool(
    server,
    "save_subscriber",
    {
      title: "Add or restore subscriber",
      description:
        "Create a newsletter contact or restore an existing email address to a selected status.",
      inputSchema: z.object({
        email: z.string().trim().email(),
        status: z
          .enum(["pending", "subscribed", "unsubscribed"])
          .default("subscribed"),
      }),
    },
    (payload) =>
      api.request("/subscribers", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "update_subscriber_status",
    {
      title: "Update subscriber status",
      description: "Change a newsletter contact subscription status.",
      inputSchema: z.object({
        id: mongoId,
        status: z.enum(["pending", "subscribed", "unsubscribed"]),
      }),
      annotations: { idempotentHint: true },
    },
    ({ id, status }) =>
      api.request(`/subscribers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  );

  registerTool(
    server,
    "delete_subscriber",
    {
      title: "Delete subscriber permanently",
      description:
        "Permanently remove a newsletter contact. Prefer unsubscribe unless deletion is explicitly required.",
      inputSchema: z.object({ id: mongoId, confirm: z.literal(true) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id }) => api.request(`/subscribers/${id}`, { method: "DELETE" }),
  );
}

function registerUserTools(server) {
  registerTool(
    server,
    "list_users",
    {
      title: "List platform users",
      description:
        "List readers, editors and administrators without password or refresh-token hashes.",
      inputSchema: z.object({
        role: z.enum(["all", "reader", "editor", "admin"]).default("all"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ role }) => {
      const users = await api.request("/users");
      return role === "all"
        ? users
        : users.filter((user) => user.role === role);
    },
  );

  registerTool(
    server,
    "create_editor_account",
    {
      title: "Create approved editor account",
      description:
        "Create an active contributor account. Share the temporary password through a secure channel and ask the editor to rotate it.",
      inputSchema: z.object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().email(),
        temporaryPassword: z.string().min(12),
        backlinkLimit: z.number().int().min(0).max(50).default(0),
      }),
      annotations: { idempotentHint: false },
    },
    ({ temporaryPassword, ...user }) =>
      api.request("/users", {
        method: "POST",
        body: JSON.stringify({
          ...user,
          password: temporaryPassword,
          role: "editor",
        }),
      }),
  );

  registerTool(
    server,
    "update_user_access",
    {
      title: "Update user access",
      description:
        "Change a user's role, editor approval status or per-article backlink allowance.",
      inputSchema: z.object({
        id: mongoId,
        role: z.enum(["reader", "editor", "admin"]).optional(),
        editorStatus: z.enum(["pending", "active", "suspended"]).optional(),
        backlinkLimit: z.number().int().min(0).max(50).optional(),
      }),
      annotations: { idempotentHint: true },
    },
    ({ id, ...payload }) =>
      api.request(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  );
}
