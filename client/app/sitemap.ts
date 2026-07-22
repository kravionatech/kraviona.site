import type {MetadataRoute} from 'next';
import {api} from '../lib/api';
import {SITE_URL} from '../lib/site';

export const dynamic='force-dynamic';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  try{
    const settings=await api('/settings');const crawler=settings.crawlerSettings||{};
    if(crawler.sitemapEnabled===false)return [];
    const max=Math.min(Math.max(Number(crawler.sitemapMaxPosts)||500,1),5000);
    const [posts,categories]=await Promise.all([crawler.sitemapIncludePosts===false?{items:[]}:api(`/posts?limit=${max}`),crawler.sitemapIncludeCategories===false?[]:api('/categories')]);
    const pages:MetadataRoute.Sitemap=[
      {url:SITE_URL,lastModified:settings.updatedAt||new Date(),changeFrequency:'daily',priority:1},
      {url:`${SITE_URL}/blog`,lastModified:posts.items[0]?.updatedAt||settings.updatedAt||new Date(),changeFrequency:'daily',priority:.9}
    ];
    if(crawler.sitemapIncludeServices!==false)pages.push({url:`${SITE_URL}/services`,lastModified:settings.updatedAt,changeFrequency:'monthly',priority:.85});
    if(crawler.sitemapIncludeNewsletter!==false)pages.push({url:`${SITE_URL}/newsletter`,lastModified:settings.updatedAt,changeFrequency:'monthly',priority:.6});
    pages.push(...posts.items.filter((post:any)=>!post.seo?.isNoIndex).map((post:any)=>({url:`${SITE_URL}/blog/${post.slug}`,lastModified:post.updatedAt,changeFrequency:'weekly' as const,priority:.8})));
    pages.push(...categories.filter((category:any)=>!category.seo?.isNoIndex).map((category:any)=>({url:`${SITE_URL}/category/${category.slug}`,lastModified:category.updatedAt,changeFrequency:'weekly' as const,priority:.7})));
    return pages;
  }catch{return[{url:SITE_URL,changeFrequency:'daily',priority:1}]}
}
