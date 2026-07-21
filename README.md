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
# kraviona.site
