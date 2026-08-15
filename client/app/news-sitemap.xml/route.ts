import { api } from "../../lib/api";
import { SITE_NAME, SITE_URL } from "../../lib/site";

export const revalidate = 900;

function xml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let posts: any[] = [];
  try {
    posts = (await api("/posts?limit=100")).items || [];
  } catch {}
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const recent = posts.filter((post) => {
    const published = new Date(post.publishedAt).getTime();
    return Number.isFinite(published) && published >= cutoff;
  });
  const urls = recent
    .map(
      (post) => `  <url>
    <loc>${xml(`${SITE_URL}/blog/${post.slug}`)}</loc>
    <news:news>
      <news:publication><news:name>${xml(SITE_NAME)}</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${xml(new Date(post.publishedAt).toISOString())}</news:publication_date>
      <news:title>${xml(post.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
