import {api} from '../../lib/api';import {absoluteUrl,SITE_URL} from '../../lib/site';
export const dynamic='force-dynamic';
export async function GET(){
  let settings:any={};try{settings=await api('/settings')}catch{}
  const crawler=settings.crawlerSettings||{};if(crawler.aiTxtEnabled===false)return new Response('Not enabled\n',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  const body=[`Site: ${settings.brandName||'Kraviona'}`,`Canonical: ${SITE_URL}`,`Publisher: Kraviona Editorial Team`,`Content: ${crawler.llmsIntroduction||settings.defaultSeo?.description||'Independent editorial articles on technology, growth, work, and ideas.'}`,`AI-Crawlers: ${crawler.allowAiCrawlers===false?'Disallowed':'Allowed'}`,`AI-Training: ${crawler.aiTrainingAllowed===true?'Allowed':'Not allowed'}`,`Attribution: ${crawler.aiAttributionRequired===false?'Optional':'Required with canonical link to the source article'}`,`Policy: ${crawler.aiCustomPolicy||'Summarization and search indexing are allowed with source attribution.'}`,`LLM-Index: ${SITE_URL}/llms.txt`,`Sitemap: ${SITE_URL}/sitemap.xml`].join('\n');
  return new Response(`${body}\n`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
}
