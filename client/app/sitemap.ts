import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    const [posts, categories] = await Promise.all([
      api("/posts?limit=5000"),
      api("/categories"),
    ]);

    if (posts?.items?.length) {
      urls.push(
        ...posts.items
          .filter((post: any) => !post.seo?.isNoIndex)
          .map((post: any) => ({
            url: `${SITE_URL}/blog/${post.slug}`,
            lastModified: new Date(post.updatedAt || post.createdAt),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          }))
      );
    }

    if (categories?.length) {
      urls.push(
        ...categories
          .filter((category: any) => !category.seo?.isNoIndex)
          .map((category: any) => ({
            url: `${SITE_URL}/category/${category.slug}`,
            lastModified: new Date(category.updatedAt || category.createdAt),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          }))
      );
    }
  } catch (error) {
    console.error("Sitemap Error:", error);
  }

  return urls;
}