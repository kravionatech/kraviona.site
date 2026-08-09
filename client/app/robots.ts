import type {MetadataRoute} from 'next';
import {api} from '../lib/api';
import {SITE_URL} from '../lib/site';

export const revalidate=3600;

export default async function robots():Promise<MetadataRoute.Robots>{
  let settings:any={};try{settings=await api('/settings')}catch{}
  const crawler=settings.crawlerSettings||{};
  const enabled=crawler.robotsEnabled!==false;
  const searchAllowed=enabled&&crawler.allowSearchEngines!==false;
  const aiAllowed=enabled&&crawler.allowAiCrawlers!==false;
  const disallow=[...new Set([...(crawler.disallowPaths||['/newsletter/confirm','/api','/admin']),'/ad'])].map((path:string)=>path.startsWith('/')?path:`/${path}`);
  return {
    rules:[
      {userAgent:'*',...(searchAllowed?{allow:'/',disallow}:{disallow:'/'})},
      {userAgent:['GPTBot','ClaudeBot','PerplexityBot','Google-Extended','CCBot'],...(aiAllowed?{allow:['/','/blog/','/category/','/services']}:{disallow:'/'})}
    ],
    sitemap:crawler.sitemapEnabled===false?undefined:`${SITE_URL}/sitemap.xml`,
    host:SITE_URL
  };
}
