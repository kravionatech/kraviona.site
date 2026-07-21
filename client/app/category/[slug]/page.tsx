import { api } from '../../../lib/api';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import './category.css';

async function getCategory(slug: string) { const cats = await api('/categories'); return cats.find((x: any) => x.slug === slug); }
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }): Promise<Metadata> { const {slug}=await params;try{const c=await getCategory(slug);if(!c)return{};return{title:c.seo?.metaTitle||c.name,description:c.seo?.metaDescription||c.description,alternates:{canonical:c.seo?.canonicalUrl}}}catch{return{}} }

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  let category: any, categories: any[] = [], data = {items:[] as any[],total:0};
  try { categories = await api('/categories'); category = categories.find((x:any)=>x.slug===slug); if(!category) return notFound(); data = await api(`/posts?category=${category._id}&limit=50`); } catch { return notFound(); }
  const [featured,...stories]=data.items;
  const site=process.env.NEXT_PUBLIC_SITE_URL||'https://kraviona.site';
  const ld={'@context':'https://schema.org','@type':'CollectionPage',name:category.name,description:category.description,url:`${site}/category/${slug}`};
  return <>
    <section className={`category-cover tone-${slug}`}>
      <div className="cover-orb"/><div className="wrap cover-content">
        <div className="cover-kicker"><a href="/blog">Journal</a><span>/</span><span>{category.name}</span></div>
        <div className="cover-grid"><h1>{category.name}</h1><div><p>{category.description || `The latest Kraviona thinking about ${category.name.toLowerCase()}.`}</p><span className="cover-count">{String(data.total).padStart(2,'0')} published {data.total===1?'story':'stories'}</span></div></div>
      </div>
    </section>
    <main className="wrap category-main">
      <div className="category-tabs"><span>Explore</span>{categories.map(c=><a className={c._id===category._id?'active':''} href={`/category/${c.slug}`} key={c._id}>{c.name}</a>)}</div>
      {featured ? <>
        <div className="category-label"><span>Featured in {category.name}</span><span>Latest story</span></div>
        <a className="lead-story" href={`/blog/${featured.slug}`}>
          <div className="lead-visual">{featured.featuredImage?.url&&<Image unoptimized priority fill sizes="(max-width: 800px) 100vw, 58vw" src={featured.featuredImage.url} alt={featured.featuredImage.alt||featured.title}/>}<span className="image-index">01</span></div>
          <div className="lead-copy"><span className="tag">{category.name} / Editors’ pick</span><h2>{featured.title}</h2><p>{featured.quickAnswer}</p><div className="story-meta"><span>{Math.max(1,Math.ceil(featured.wordCount/220))} min read</span><b>Read the story ↗</b></div></div>
        </a>
        {stories.length>0&&<section className="more-stories"><div className="category-label"><span>More from {category.name}</span><span>{stories.length} {stories.length===1?'story':'stories'}</span></div><div className="story-list">{stories.map((p:any,i:number)=><a href={`/blog/${p.slug}`} className="story-row" key={p._id}><span className="story-number">{String(i+2).padStart(2,'0')}</span><div className="story-thumb">{p.featuredImage?.url&&<Image unoptimized fill sizes="180px" src={p.featuredImage.url} alt={p.featuredImage.alt||p.title}/>}</div><div className="story-copy"><span className="tag">{category.name}</span><h3>{p.title}</h3><p>{p.quickAnswer}</p></div><span className="row-arrow">↗</span></a>)}</div></section>}
      </> : <div className="empty-state"><div className="eyebrow">Nothing published yet</div><h2>Our first {category.name} story is in progress.</h2><a className="btn" href="/blog">Browse all stories</a></div>}
      <section className="category-cta"><div><span className="eyebrow">Stay curious</span><h2>Ideas that respect your time.</h2></div><p>Get the strongest Kraviona story delivered once a week.</p><a className="btn" href="/newsletter">Join the briefing →</a></section>
    </main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld)}}/>
  </>;
}
