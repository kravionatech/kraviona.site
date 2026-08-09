import { api } from '../../../lib/api';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE, jsonLd, plainText, SITE_DESCRIPTION, SITE_URL, truncate } from '../../../lib/site';
import { DisplayAd } from '../../../components/ads';
import './category.css';

async function getCategory(slug: string) { const cats = await api('/categories'); return cats.find((x: any) => x.slug === slug); }
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategory(slug);
    if (!category) return { title: 'Category not found', robots: { index: false, follow: false } };

    // A category name alone is not a useful search result title or description.
    // Preserve substantive editorial SEO copy from the CMS, otherwise use a precise fallback.
    const suppliedTitle = plainText(category.seo?.metaTitle || '').trim();
    const suppliedDescription = plainText(category.seo?.metaDescription || category.description || '').trim();
    const title = truncate(suppliedTitle.length >= 30 ? suppliedTitle : `${category.name} ideas and guides`, 60);
    const description = truncate(
      suppliedDescription.length >= 50
        ? suppliedDescription
        : `Explore Kraviona guides, explainers, and practical perspectives on ${category.name.toLowerCase()}.`,
      160
    );
    const canonical = `/category/${category.slug}`;
    const index = !category.seo?.isNoIndex;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { type: 'website', url: canonical, title, description, images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }] },
      twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_OG_IMAGE] },
      robots: { index, follow: true, googleBot: { index, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }
    };
  } catch {
    return { robots: { index: false, follow: false } };
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  let category: any, categories: any[] = [], data = {items:[] as any[],total:0};
  categories = await api('/categories');
  category = categories.find((x:any)=>x.slug===slug);
  if(!category) return notFound();
  data = await api(`/posts?category=${category._id}&limit=50`);
  const [featured,...stories]=data.items;
  const canonical=`${SITE_URL}/category/${slug}`;
  const ld=[{'@context':'https://schema.org','@type':'CollectionPage','@id':canonical,name:category.name,description:category.description,url:canonical,isPartOf:{'@id':`${SITE_URL}/#website`},mainEntity:{'@type':'ItemList',numberOfItems:data.items.length,itemListElement:data.items.map((p:any,i:number)=>({'@type':'ListItem',position:i+1,name:p.title,url:`${SITE_URL}/blog/${p.slug}`}))}},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE_URL},{'@type':'ListItem',position:2,name:'Journal',item:`${SITE_URL}/blog`},{'@type':'ListItem',position:3,name:category.name,item:canonical}]}];
  return <>
    <section className={`category-cover tone-${slug}`}>
      <div className="cover-orb"/><div className="wrap cover-content">
        <div className="cover-kicker"><a href="/blog">Journal</a><span>/</span><span>{category.name}</span></div>
        <div className="cover-grid"><h1>{category.name}</h1><div><p>{category.description || `The latest Kraviona thinking about ${category.name.toLowerCase()}.`}</p><span className="cover-count">{String(data.total).padStart(2,'0')} published {data.total===1?'story':'stories'}</span></div></div>
      </div>
    </section>
    <div className="wrap category-main">
      <div className="category-tabs"><span>Explore</span>{categories.map(c=><a className={c._id===category._id?'active':''} href={`/category/${c.slug}`} key={c._id}>{c.name}</a>)}</div>
      {featured ? <>
        <div className="category-label"><span>Featured in {category.name}</span><span>Latest story</span></div>
        <a className="lead-story" href={`/blog/${featured.slug}`}>
          <div className="lead-visual">{featured.featuredImage?.url&&<Image priority fill sizes="(max-width: 800px) 100vw, 58vw" src={featured.featuredImage.url} alt={featured.featuredImage.alt||featured.title}/>}<span className="image-index">01</span></div>
          <div className="lead-copy"><span className="tag">{category.name} / Editors’ pick</span><h2>{featured.title}</h2><p>{featured.quickAnswer}</p><div className="story-meta"><span>{Math.max(1,Math.ceil(featured.wordCount/220))} min read</span><b>Read the story ↗</b></div></div>
        </a>
        {stories.length>0&&<section className="more-stories"><div className="category-label"><span>More from {category.name}</span><span>{stories.length} {stories.length===1?'story':'stories'}</span></div><div className="story-list">{stories.map((p:any,i:number)=><a href={`/blog/${p.slug}`} className="story-row" key={p._id}><span className="story-number">{String(i+2).padStart(2,'0')}</span><div className="story-thumb">{p.featuredImage?.url&&<Image fill sizes="180px" src={p.featuredImage.url} alt={p.featuredImage.alt||p.title}/>}</div><div className="story-copy"><span className="tag">{category.name}</span><h3>{p.title}</h3><p>{p.quickAnswer}</p></div><span className="row-arrow">↗</span></a>)}</div></section>}
      </> : <div className="empty-state"><div className="eyebrow">Nothing published yet</div><h2>Our first {category.name} story is in progress.</h2><a className="btn" href="/blog">Browse all stories</a></div>}
      <section className="category-cta"><div><span className="eyebrow">Stay curious</span><h2>Ideas that respect your time.</h2></div><p>Get the strongest Kraviona story delivered once a week.</p><a className="btn" href="/newsletter">Join the briefing →</a></section>
    </div>
    <div className="ad-slot--compact"><DisplayAd size="300x250" /></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(ld)}}/>
  </>;
}
