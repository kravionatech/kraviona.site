import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '../../lib/api';
import PostCard from '../../components/PostCard';
import { DEFAULT_OG_IMAGE, jsonLd, SITE_DESCRIPTION, SITE_URL } from '../../lib/site';
import './blog-v2.css';

type Query={page?:string;search?:string};
function pageNumber(value?: string) { const page = Number(value); return Number.isSafeInteger(page) && page > 1 ? page : 1; }
export async function generateMetadata({searchParams}:{searchParams:Promise<Query>}):Promise<Metadata>{const q=await searchParams;const page=pageNumber(q.page);const search=(q.search||'').trim();const canonical=search?'/blog':page>1?`/blog?page=${page}`:'/blog';const title=search?`Search results for “${search}”`:(page>1?`Journal — Page ${page}`:'Journal');const socialTitle=page>1?`Kraviona Journal — Page ${page}`:'The Kraviona Journal';const description=search?`Search Kraviona stories for ${search}.`:'Independent essays and practical guides on technology, growth, ideas, and modern work.';return{title,description,alternates:{canonical},robots:search?{index:false,follow:true}:{index:true,follow:true},openGraph:{type:'website',url:canonical,title:socialTitle,description,images:[{url:DEFAULT_OG_IMAGE,width:1200,height:630,alt:socialTitle}]},twitter:{card:'summary_large_image',title:socialTitle,description,images:[DEFAULT_OG_IMAGE]}}}

export default async function Blog({ searchParams }: { searchParams: Promise<Query> }) {
  const q=await searchParams;const page=pageNumber(q.page);const search=(q.search||'').trim();
  const [data,categories]=await Promise.all([api(`/posts?page=${page}&limit=12&search=${encodeURIComponent(search)}`),api('/categories')]);
  if(!search&&page>1&&(!data.items?.length||page>data.pages)) notFound();
  const canonical=page>1?`${SITE_URL}/blog?page=${page}`:`${SITE_URL}/blog`;
  const ld=search?null:[{'@context':'https://schema.org','@type':'CollectionPage','@id':canonical,url:canonical,name:'The Kraviona Journal',description:SITE_DESCRIPTION,isPartOf:{'@id':`${SITE_URL}/#website`},mainEntity:{'@type':'ItemList',numberOfItems:data.items.length,itemListElement:data.items.map((p:any,i:number)=>({'@type':'ListItem',position:(page-1)*12+i+1,url:`${SITE_URL}/blog/${p.slug}`,name:p.title}))}},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE_URL},{'@type':'ListItem',position:2,name:'Journal',item:`${SITE_URL}/blog`}]}];
  return <>
    <section className="journal-cover"><div className="wrap"><div className="eyebrow">The Kraviona journal</div><div className="journal-cover__grid"><h1>{search?`Results for “${search}”`:'Ideas with a longer shelf life.'}</h1><div><p>Independent essays and practical frameworks for clearer thinking and better work.</p><form className="journal-search" role="search"><label className="sr-only" htmlFor="journal-search">Search the journal</label><input id="journal-search" name="search" defaultValue={search} placeholder="Search topics, ideas, guides…"/><button>Search</button></form></div></div></div></section>
    <div className="wrap topic-strip"><span>Browse topics</span>{categories.map((c:any)=><a href={`/category/${c.slug}`} key={c._id}>{c.name} →</a>)}</div>
    <section className="wrap"><div className="section-heading"><div><div className="eyebrow">{data.total} {data.total===1?'story':'stories'}</div><h2>{search?'Search results':page>1?`All stories · Page ${page}`:'All stories'}</h2></div>{search&&<a className="text-link" href="/blog">Clear search ×</a>}</div>
      {data.items.length?<div className="story-grid journal-list">{data.items.map((p:any,i:number)=><PostCard post={p} index={(page-1)*12+i+1} key={p._id}/>)}</div>:<div className="empty-state"><div className="eyebrow">No matches</div><h2>Try a broader search.</h2><p>Explore all stories or choose a topic above.</p><a className="btn" href="/blog">View all stories</a></div>}
      {data.pages>1&&<nav className="pagination" aria-label="Journal pages">{page>1&&<a rel="prev" href={page===2?'/blog':`/blog?page=${page-1}`}>← Previous</a>}<span>Page {page} of {data.pages}</span>{page<data.pages&&<a rel="next" href={`/blog?page=${page+1}`}>Next →</a>}</nav>}
    </section>
    {ld&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(ld)}}/>}
  </>;
}
