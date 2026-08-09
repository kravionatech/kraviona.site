import { api } from "../../lib/api";
import { plainText, SITE_DESCRIPTION, SITE_URL } from "../../lib/site";
const esc = (s = "") =>
  s.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c] || c,
  );
export async function GET() {
  let posts: any[] = [];
  try {
    posts = (await api("/posts?limit=50")).items;
  } catch {}
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Kraviona</title><link>${SITE_URL}</link><description>${esc(SITE_DESCRIPTION)}</description><language>en</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${posts.map((p) => `<item><title>${esc(p.title)}</title><link>${SITE_URL}/blog/${p.slug}</link><guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate><description>${esc(p.quickAnswer || plainText(p.content).slice(0, 240))}</description></item>`).join("")}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
