import { api } from "../../lib/api";
import { SITE_DESCRIPTION, SITE_URL } from "../../lib/site";
export const dynamic = "force-dynamic";
export async function GET() {
  let posts: any[] = [],
    categories: any[] = [],
    authors: any[] = [],
    settings: any = {};
  try {
    settings = await api("/settings");
    const crawler = settings.crawlerSettings || {};
    if (crawler.llmsEnabled === false)
      return new Response("Not enabled\n", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    const max = Math.min(Number(crawler.sitemapMaxPosts) || 500, 5000);
    [posts, categories, authors] = await Promise.all([
      crawler.llmsIncludePosts === false
        ? []
        : api(`/posts?limit=${max}`).then((data: any) => data.items),
      crawler.llmsIncludeCategories === false ? [] : api("/categories"),
      api("/authors").catch(() => []),
    ]);
  } catch {}
  const crawler = settings.crawlerSettings || {};
  const brand = settings.brandName || "Kraviona";
  const intro =
    crawler.llmsIntroduction ||
    settings.defaultSeo?.description ||
    SITE_DESCRIPTION;
  const sections = [
    `# ${brand}\n\n> ${intro}`,
    `## Canonical website\n- [${brand}](${SITE_URL})\n- [Blockchain newsroom](${SITE_URL}/blog)\n- [The Chain Brief](${SITE_URL}/newsletter)`,
    categories.length
      ? `## Topics\n${categories.map((category) => `- [${category.name}](${SITE_URL}/category/${category.slug}): ${category.description || ""}`).join("\n")}`
      : "",
    authors.length
      ? `## Authors\n${authors.map((author) => `- [${author.name}](${SITE_URL}/author/${author.slug}): ${author.postCount} published stories`).join("\n")}`
      : "",
    posts.length
      ? `## Published stories\n${posts.map((post) => `- [${post.title}](${SITE_URL}/blog/${post.slug}): ${post.quickAnswer || ""}`).join("\n")}`
      : "",
    `## Usage guidance\n${crawler.llmsInstructions || "Use canonical URLs and attribute information to Kraviona."}`,
  ].filter(Boolean);
  return new Response(`${sections.join("\n\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
