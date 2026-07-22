# Kraviona platform usage guide

This repository contains four connected applications:

- Public website: `http://localhost:3000`
- Editorial admin: `http://localhost:3001`
- Backend API: `http://localhost:4000/api`
- MCP server: started by an MCP host over stdio

## Start the platform

From the repository root:

```bash
npm install
npm run dev
```

MongoDB must be available and the environment files must be configured first. Check API health at `http://localhost:4000/health`.

## Publish and update articles

1. Open the admin at `http://localhost:3001` and sign in with an admin account.
2. Open **Stories** and select **New story**.
3. Add the title, category, article body, quick answer, takeaways, FAQs, image and alt text.
4. Review the SEO title, description and Google preview.
5. Keep the article as **Draft** while editing, then change it to **Published** and save.
6. Use **View live** to verify the public page.

Categories are dynamic. Create or edit them under **Categories**; public navigation and category landing pages update from the API.

## Manage services and client leads

1. Open **Services** in the admin.
2. Create or edit a service, its deliverables, display order and official `kraviona.com` detail URL.
3. Enable **Feature this service on the homepage** for up to three priority services.
4. Set the status to **Published** to show it publicly.
5. Visitors can submit a project brief at `/services#contact`.
6. Open **Client enquiries** to view the brief, email/phone, selected service and budget.
7. Move each enquiry through `new`, `contacted`, `qualified` and `closed`; use notes for private follow-up context.

The public form is validated, rate-limited and protected with a honeypot field. Enquiries are stored in MongoDB and are never exposed by a public read endpoint.

## Update company and contact information

Open **Site settings** in the admin. You can change:

- Official company website
- Contact email and phone
- WhatsApp URL
- Services headline and introduction
- Homepage and newsletter copy
- Default SEO metadata and social profiles

The public header and footer identify [kraviona.com](https://www.kraviona.com/) as the official Kraviona Tech Solutions website. Service cards link to verified official service pages, and the footer includes a permanent official-site trust link.

## Use the MCP server

Add the following to your MCP host configuration, replacing the credentials:

```json
{
  "mcpServers": {
    "kraviona": {
      "command": "node",
      "args": ["/home/amar/Desktop/kravionasite/mcp-server/src/index.js"],
      "env": {
        "KRAVIONA_API_URL": "http://localhost:4000",
        "KRAVIONA_ADMIN_EMAIL": "your-admin@example.com",
        "KRAVIONA_ADMIN_PASSWORD": "your-password"
      }
    }
  }
}
```

The MCP exposes 21 tools for posts, categories, services, enquiries, crawler controls, site settings, AI drafts and the keyword queue. Test it while the backend is running:

```bash
npm run test:mcp
```

## Manage robots, sitemap and AI discovery

Open **Crawlers & AI** in the admin. This screen controls four live, database-driven files:

- `robots.txt`: search-engine access, AI crawler access and disallowed paths
- `sitemap.xml`: automatic published post/category URLs and page inclusion switches
- `llms.txt`: AI-readable site introduction, citation instructions, services, categories and current articles
- `ai.txt`: crawler permission, training permission, attribution requirement and custom usage policy

Use the four preview cards in the admin to inspect the generated output after saving. These routes are server-rendered dynamically and do not require a new frontend build when their settings or published content changes. The MCP exposes the same controls through `update_crawler_settings`.

## Production domain and CORS setup

Recommended production layout:

- Public website: `https://kraviona.site`
- Admin: `https://studio.kraviona.site`
- API: `https://api.kraviona.site`
- Official company: `https://www.kraviona.com`

Backend variables:

```text
NODE_ENV=production
CLIENT_URL=https://kraviona.site
ADMIN_URL=https://studio.kraviona.site
CORS_ORIGINS=https://kraviona.site,https://www.kraviona.site,https://kraviona.com,https://www.kraviona.com,https://studio.kraviona.site
ADMIN_EMAIL=your-production-admin@example.com
ADMIN_PASSWORD=use-a-unique-password-with-at-least-12-characters
ADMIN_NAME=Kraviona Administrator
```

On startup the backend creates this administrator only when it does not already exist. Repeated deployments do not create duplicates. You can also run `npm run bootstrap:admin` from the backend service shell to verify or create the configured account manually.

Public frontend variables:

```text
NEXT_PUBLIC_API_URL=https://api.kraviona.site/api
NEXT_PUBLIC_SITE_URL=https://kraviona.site
```

Admin variables:

```text
NEXT_PUBLIC_API_URL=https://api.kraviona.site/api
NEXT_PUBLIC_CLIENT_URL=https://kraviona.site
```

The API permits the Kraviona production domains, configured extra origins, and local origins only outside production. Credentialed admin requests and preflight requests are enabled. Do not use `*` with credentialed CORS.

## Before deployment

- Use strong JWT secrets and a production MongoDB connection.
- Configure Cloudinary for image uploads, Resend for newsletters and Anthropic for AI drafts.
- Create an admin account and remove any demo credentials.
- Confirm all production environment URLs use HTTPS.
- Run `npm run build`, `npm test`, and `npm run test:mcp`.
- Submit `/sitemap.xml` in Google Search Console after launch.
