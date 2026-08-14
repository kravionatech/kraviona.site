import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

function validDate(value?: string) {
  const date = value ? new Date(value) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
}

async function getAllPosts(maxPosts: number) {
  const limit = Math.min(100, maxPosts);
  const first = await api(`/posts?page=1&limit=${limit}`);
  const posts = [...(first.items || [])];
  const pages = Math.min(first.pages || 1, Math.ceil(maxPosts / limit));

  if (pages > 1) {
    const remaining = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        api(`/posts?page=${index + 2}&limit=${limit}`),
      ),
    );
    remaining.forEach((page) => posts.push(...(page.items || [])));
  }

  return posts.slice(0, maxPosts);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let settings: any = {};
  let posts: any[] = [];
  let categories: any[] = [];

  try {
    settings = await api("/settings");
    const crawler = settings.crawlerSettings || {};
    const maxPosts = Math.min(
      5000,
      Math.max(1, crawler.sitemapMaxPosts || 500),
    );
    [posts, categories] = await Promise.all([
      crawler.sitemapIncludePosts === false ? [] : getAllPosts(maxPosts),
      crawler.sitemapIncludeCategories === false ? [] : api("/categories"),
    ]);
  } catch (error) {
    console.error("Sitemap data error:", error);
  }

  const latestPostDate = posts
    .map((post) => validDate(post.updatedAt || post.publishedAt))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const settingsDate = validDate(settings.updatedAt);
  const siteDate = latestPostDate || settingsDate;
  const crawler = settings.crawlerSettings || {};

  const urls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: siteDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: latestPostDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  if (crawler.sitemapIncludeNewsletter !== false) {
    urls.push({
      url: `${SITE_URL}/newsletter`,
      lastModified: settingsDate,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  urls.push(
    ...posts
      .filter((post) => post.slug && !post.seo?.isNoIndex)
      .map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: validDate(post.updatedAt || post.publishedAt),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    ...categories
      .filter((category) => category.slug && !category.seo?.isNoIndex)
      .map((category) => ({
        url: `${SITE_URL}/category/${category.slug}`,
        lastModified: validDate(category.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
  );

  return urls;
}
