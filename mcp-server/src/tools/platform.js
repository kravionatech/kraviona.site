import { z } from "zod";
import { api } from "../api.js";
import { mongoId } from "../schemas.js";
import { buildQuery, registerTool } from "../toolkit.js";

const basicSeoSchema = z.object({
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

export function registerPlatformTools(server) {
  registerDashboardTool(server);
  registerCategoryTools(server);
  registerServiceTools(server);
  registerInquiryTools(server);
  registerSettingsTools(server);
  registerAutomationTools(server);
}

function registerDashboardTool(server) {
  registerTool(
    server,
    "get_dashboard_summary",
    {
      title: "Get editorial dashboard summary",
      description:
        "Read platform totals, pending work, recent posts and recent AI activity.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    () => api.request("/dashboard"),
  );
}

function registerCategoryTools(server) {
  registerTool(
    server,
    "list_categories",
    {
      title: "List categories",
      description: "List all frontend categories and their SEO information.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    () => api.request("/categories", {}, false),
  );

  registerTool(
    server,
    "save_category",
    {
      title: "Create or update category",
      description:
        "Create a category or update one when its ID is supplied. Categories drive navigation and landing pages.",
      inputSchema: z.object({
        id: mongoId.optional(),
        name: z.string().trim().min(2).max(80),
        slug: z.string().trim().optional(),
        description: z.string().trim().max(500).optional(),
        seo: basicSeoSchema.optional(),
      }),
      annotations: { idempotentHint: true },
    },
    ({ id, ...payload }) =>
      api.request(id ? `/categories/${id}` : "/categories", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "delete_category",
    {
      title: "Delete empty category",
      description:
        "Delete a category only when no posts use it. Explicit confirmation is required.",
      inputSchema: z.object({ id: mongoId, confirm: z.literal(true) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id }) => api.request(`/categories/${id}`, { method: "DELETE" }),
  );
}

function registerServiceTools(server) {
  registerTool(
    server,
    "list_services",
    {
      title: "List Kraviona services",
      description: "List draft or published commercial service pages.",
      inputSchema: z.object({
        status: z.enum(["all", "published"]).default("all"),
      }),
      annotations: { readOnlyHint: true },
    },
    ({ status }) =>
      api.request(
        `/services${buildQuery({ status: status === "all" ? "all" : undefined })}`,
        {},
        status === "all",
      ),
  );

  registerTool(
    server,
    "save_service",
    {
      title: "Create or update service",
      description:
        "Manage a service page, its deliverables, publishing status, official URL and SEO.",
      inputSchema: z.object({
        id: mongoId.optional(),
        title: z.string().trim().min(2).max(120),
        slug: z.string().trim().optional(),
        eyebrow: z.string().trim().optional(),
        summary: z.string().trim().min(10).max(320),
        deliverables: z.array(z.string().trim()).max(20).optional(),
        status: z.enum(["draft", "published"]).default("draft"),
        featured: z.boolean().default(false),
        order: z.number().int().default(0),
        officialUrl: z.string().url().optional(),
        seo: basicSeoSchema.optional(),
      }),
      annotations: { idempotentHint: true },
    },
    ({ id, ...payload }) =>
      api.request(id ? `/services/${id}` : "/services", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "delete_service",
    {
      title: "Delete unused service",
      description:
        "Permanently delete a service only when no enquiries reference it.",
      inputSchema: z.object({ id: mongoId, confirm: z.literal(true) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id }) => api.request(`/services/${id}`, { method: "DELETE" }),
  );
}

function registerInquiryTools(server) {
  registerTool(
    server,
    "list_inquiries",
    {
      title: "List client enquiries",
      description: "Read project briefs submitted from the services form.",
      inputSchema: z.object({
        status: z
          .enum(["all", "new", "contacted", "qualified", "closed", "spam"])
          .default("all"),
      }),
      annotations: { readOnlyHint: true },
    },
    ({ status }) => api.request(`/inquiries${buildQuery({ status })}`),
  );

  registerTool(
    server,
    "update_inquiry",
    {
      title: "Update client enquiry",
      description: "Set a follow-up status and private administrative notes.",
      inputSchema: z.object({
        id: mongoId,
        status: z.enum(["new", "contacted", "qualified", "closed", "spam"]),
        notes: z.string().max(4000).optional(),
      }),
      annotations: { idempotentHint: true },
    },
    ({ id, ...payload }) =>
      api.request(`/inquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "delete_inquiry",
    {
      title: "Delete client enquiry permanently",
      description:
        "Permanently remove an enquiry after explicit confirmation. Prefer closing or marking spam when retention is useful.",
      inputSchema: z.object({ id: mongoId, confirm: z.literal(true) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id }) => api.request(`/inquiries/${id}`, { method: "DELETE" }),
  );
}

function registerSettingsTools(server) {
  registerTool(
    server,
    "get_site_settings",
    {
      title: "Get website settings",
      description:
        "Read global branding, homepage copy, contact details, default SEO and social profiles.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    () => api.request("/settings", {}, false),
  );

  registerTool(
    server,
    "update_site_settings",
    {
      title: "Update website settings",
      description:
        "Update global website content and SEO. Omitted fields retain their existing values.",
      inputSchema: z.object({
        brandName: z.string().optional(),
        tagline: z.string().optional(),
        heroEyebrow: z.string().optional(),
        heroTitle: z.string().optional(),
        heroDescription: z.string().optional(),
        briefingTitle: z.string().optional(),
        briefingDescription: z.string().optional(),
        officialSiteUrl: z.string().url().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        whatsappUrl: z.string().url().optional(),
        servicesTitle: z.string().optional(),
        servicesDescription: z.string().optional(),
        defaultSeo: z
          .object({
            title: z.string().max(60).optional(),
            description: z.string().max(160).optional(),
            ogImage: z.string().url().or(z.literal("")).optional(),
          })
          .optional(),
        socialLinks: z
          .array(
            z.object({
              label: z.string().trim().min(1),
              url: z.string().url(),
            }),
          )
          .optional(),
      }),
      annotations: { idempotentHint: true },
    },
    (payload) =>
      api.request("/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "update_crawler_settings",
    {
      title: "Update crawler and AI discovery settings",
      description:
        "Control robots.txt, sitemap.xml, llms.txt and ai.txt generation without replacing unrelated site settings.",
      inputSchema: z.object({
        robotsEnabled: z.boolean().optional(),
        allowSearchEngines: z.boolean().optional(),
        allowAiCrawlers: z.boolean().optional(),
        disallowPaths: z.array(z.string()).optional(),
        customRobotsNote: z.string().optional(),
        sitemapEnabled: z.boolean().optional(),
        sitemapIncludePosts: z.boolean().optional(),
        sitemapIncludeCategories: z.boolean().optional(),
        sitemapIncludeServices: z.boolean().optional(),
        sitemapIncludeNewsletter: z.boolean().optional(),
        sitemapMaxPosts: z.number().int().min(1).max(5000).optional(),
        llmsEnabled: z.boolean().optional(),
        llmsIntroduction: z.string().optional(),
        llmsInstructions: z.string().optional(),
        llmsIncludePosts: z.boolean().optional(),
        llmsIncludeCategories: z.boolean().optional(),
        llmsIncludeServices: z.boolean().optional(),
        aiTxtEnabled: z.boolean().optional(),
        aiAttributionRequired: z.boolean().optional(),
        aiTrainingAllowed: z.boolean().optional(),
        aiCustomPolicy: z.string().optional(),
      }),
      annotations: { idempotentHint: true },
    },
    async (payload) => {
      const settings = await api.request("/settings", {}, false);
      return api.request("/settings", {
        method: "PUT",
        body: JSON.stringify({
          crawlerSettings: {
            ...(settings.crawlerSettings || {}),
            ...payload,
          },
        }),
      });
    },
  );
}

function registerAutomationTools(server) {
  registerTool(
    server,
    "generate_ai_draft",
    {
      title: "Generate AI draft",
      description:
        "Ask the configured AI model for an SEO-ready first draft. Human fact-checking and editing remain mandatory.",
      inputSchema: z.object({
        topic: z.string().trim().min(5),
        category: mongoId,
      }),
      annotations: { idempotentHint: false },
    },
    (payload) =>
      api.request("/ai-agent/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "list_keyword_queue",
    {
      title: "List automation queue",
      description: "List pending and used keywords for content automation.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    () => api.request("/keyword-queue"),
  );

  registerTool(
    server,
    "add_keyword",
    {
      title: "Add keyword to automation queue",
      description:
        "Add a target keyword and category to the automatic generation queue.",
      inputSchema: z.object({
        keyword: z.string().trim().min(2),
        targetCategory: mongoId,
        priority: z.number().int().default(0),
      }),
      annotations: { idempotentHint: false },
    },
    (payload) =>
      api.request("/keyword-queue", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  );

  registerTool(
    server,
    "delete_keyword",
    {
      title: "Delete queued keyword",
      description:
        "Permanently remove a keyword queue item after explicit confirmation.",
      inputSchema: z.object({ id: mongoId, confirm: z.literal(true) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    ({ id }) => api.request(`/keyword-queue/${id}`, { method: "DELETE" }),
  );
}
