import type { Metadata } from 'next';
import { api } from '../lib/api';
import PostCard from '../components/PostCard';
import NewsletterForm from '../components/NewsletterForm';
import { DEFAULT_OG_IMAGE, jsonLd, SITE_DESCRIPTION, SITE_URL } from '../lib/site';

const homeTitle='Kraviona — Clear ideas for better work';
export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { type:'website',url:'/',title:homeTitle,description:SITE_DESCRIPTION,images:[{url:DEFAULT_OG_IMAGE,width:1200,height:630,alt:homeTitle}] },
  twitter: { card:'summary_large_image',title:homeTitle,description:SITE_DESCRIPTION,images:[DEFAULT_OG_IMAGE] }
};

export default async function Home() {
  let posts: any[] = [], categories: any[] = [], services:any[]=[], settings:any={};
  try { const [postData, categoryData, serviceData, siteSettings] = await Promise.all([api('/posts?limit=10'), api('/categories'),api('/services'),api('/settings')]); posts=postData.items;categories=categoryData;services=serviceData;settings=siteSettings; } catch {}
  const [featured, ...rest] = posts; const side = rest.slice(0,2); const more=rest.slice(2);
  const ld={ '@context':'https://schema.org','@type':'CollectionPage','@id':`${SITE_URL}/#home`,url:SITE_URL,name:homeTitle,description:SITE_DESCRIPTION,isPartOf:{'@id':`${SITE_URL}/#website`},inLanguage:'en-IN',mainEntity:{'@type':'ItemList',numberOfItems:posts.length,itemListElement:posts.map((p,i)=>({'@type':'ListItem',position:i+1,url:`${SITE_URL}/blog/${p.slug}`,name:p.title}))} };
  return <>
    <section className="home-hero wrap"><div className="home-hero__top"><div><div className="eyebrow">{settings.heroEyebrow||'Independent editorial · Est. 2026'}</div><h1>{settings.heroTitle||'Think clearly. Build what lasts.'}</h1><p className="lead">{settings.heroDescription||'Deeply researched ideas on technology, growth, and modern work—for people who prefer signal over noise.'}</p></div><aside className="home-hero__aside"><span>This week at {settings.brandName||'Kraviona'}</span><strong>One strong idea is worth a hundred shallow takes.</strong><p>Read deliberately. Apply what matters. Ignore the rest.</p><a className="text-link" href="/blog">Enter the journal →</a></aside></div></section>
    <div className="wrap topic-strip"><span>Explore topics</span>{categories.map(c=><a href={`/category/${c.slug}`} key={c._id}>{c.name} →</a>)}</div>
    <section className="wrap" aria-labelledby="featured-title"><div className="section-heading"><div><div className="eyebrow">Editor’s selection</div><h2 id="featured-title">Worth your attention</h2></div><p>Original reporting, useful frameworks, and ideas designed to stay valuable beyond today’s feed.</p></div>
      {featured?<div className="feature-layout"><PostCard post={featured} featured index={1}/><div className="feature-stack">{side.map((p,i)=><PostCard post={p} index={i+2} key={p._id}/>)}</div></div>:<div className="empty-state"><h2>Our first stories are on the way.</h2><p>Join the briefing to hear when they arrive.</p></div>}
    </section>
    {more.length>0&&<section className="wrap" aria-labelledby="latest-title"><div className="section-heading"><div><div className="eyebrow">Latest stories</div><h2 id="latest-title">Keep exploring</h2></div><a className="text-link" href="/blog">See the full journal →</a></div><div className="story-grid">{more.map((p,i)=><PostCard post={p} index={i+4} key={p._id}/>)}</div></section>}
    {services.length>0&&<section className="home-services"><div className="wrap"><div className="section-heading section-heading--light"><div><div className="eyebrow">Work with Kraviona</div><h2>Ideas are useful. Execution creates value.</h2></div><p>{settings.servicesDescription||'Product engineering, technical SEO and AI systems for teams ready to move.'}</p></div><div className="home-service-grid">{services.filter(service=>service.featured).slice(0,3).map((service,index)=><a href="/services#contact" className="home-service" key={service._id}><span>0{index+1} · {service.eyebrow}</span><h3>{service.title}</h3><p>{service.summary}</p><b>Discuss this service →</b></a>)}</div><div className="home-services__footer"><span>Commercial services are delivered by Kraviona Tech Solutions.</span><div><a href="/services">See all services →</a><a href={settings.officialSiteUrl||'https://www.kraviona.com'} target="_blank" rel="noopener noreferrer">Official kraviona.com ↗</a></div></div></div></section>}
    <section className="newsletter-band"><div className="wrap newsletter-band__inner"><div className="newsletter-band__copy"><div className="eyebrow">The weekly briefing</div><h2>{settings.briefingTitle||'Your inbox deserves better ideas.'}</h2><p>{settings.briefingDescription||'One original essay or practical framework every week. Thoughtful, concise, and worth keeping.'}</p><div className="briefing-points"><span>Original thinking</span><span>5-minute read</span><span>No inbox noise</span></div></div><div className="newsletter-card"><span className="newsletter-card__label">Join thoughtful builders and curious minds</span><NewsletterForm compact/><p>One useful note, delivered weekly. Leave whenever you want.</p></div></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(ld)}}/>
  </>;
}
