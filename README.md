# Kraviona

SEO-first publishing monorepo with an Express/MongoDB API, public Next.js site, admin Next.js app, and Claude-powered editorial agent.

## Local setup

1. Run `npm install` from this directory.
2. Copy `backend/.env.example` to `backend/.env`, and the two `.env.local.example` files to `.env.local` in their respective apps.
3. Start MongoDB and fill the required secrets.
4. Run `npm run dev`.

The public site runs on port 3000, admin on 3001, and API on 4000. Register the first user, then promote its `role` to `admin` directly in MongoDB to bootstrap administration.

## Deployment

Deploy `client` and `admin` as separate Vercel projects. Deploy `backend` to Railway with its environment variables. Set production `CLIENT_URL`, `ADMIN_URL`, and the two public API URL variables. The in-process cron uses Asia/Kolkata and defaults to `0 6 * * *`.

Automated posts publish unless `AUTO_PUBLISH=false`; manual AI generations always remain drafts. All comments enter moderation. Newsletter signups use double opt-in.

## Editorial Studio

Open `http://localhost:3001` and sign in with an administrator account. The Studio supports full story editing (semantic rich text, images, alt text, takeaways, FAQs, tags, author identity, SEO and social previews), category SEO, AI drafts and queue management, comment moderation, subscriber management, user roles, and global website settings.

Site settings control the public brand name, tagline, homepage hero, newsletter copy, default metadata, social image, and social profiles. Public pages read these settings dynamically. Configure `CLOUDINARY_URL` to enable direct image uploads; editors can always paste a hosted image URL as a fallback.

Services and project enquiries are also API-driven. Editors can publish, feature and reorder services, connect each one to its verified `kraviona.site` detail page, and manage incoming client briefs through the Studio. See [SITE_USAGE_GUIDE.md](./SITE_USAGE_GUIDE.md) for the complete operating and production setup guide.
# kraviona.site
