import type { Metadata } from 'next';
import { api } from '../lib/api';
import PostCard from '../components/PostCard';
import NewsletterForm from '../components/NewsletterForm';
import { jsonLd, SITE_DESCRIPTION, SITE_URL } from '../lib/site';

export const metadata: Metadata = { title: { absolute: 'Kraviona — Clear ideas for better work' }, description: SITE_DESCRIPTION, alternates: { canonical: '/' } };

export default async function Home() {
  let posts: any[] = [], categories: any[] = [];
  try { const [postData, categoryData] = await Promise.all([api('/posts?limit=10'), api('/categories')]); posts=postData.items;categories=categoryData; } catch {}
  const [featured, ...rest] = posts; const side = rest.slice(0,2); const more=rest.slice(2);
  const ld={ '@context':'https://schema.org','@type':'CollectionPage','@id':`${SITE_URL}/#home`,url:SITE_URL,name:'Kraviona — Clear ideas for better work',description:SITE_DESCRIPTION,isPartOf:{'@id':`${SITE_URL}/#website`},mainEntity:{'@type':'ItemList',numberOfItems:posts.length,itemListElement:posts.map((p,i)=>({'@type':'ListItem',position:i+1,url:`${SITE_URL}/blog/${p.slug}`,name:p.title}))} };
  return <>
    <section className="home-hero wrap"><div className="home-hero__top"><div><div className="eyebrow">Independent editorial · Est. 2026</div><h1>Think clearly.<br/>Build what lasts.</h1><p className="lead">Deeply researched ideas on technology, growth, and modern work—for people who prefer signal over noise.</p></div><aside className="home-hero__aside"><span>This week at Kraviona</span><strong>One strong idea is worth a hundred shallow takes.</strong><p>Read deliberately. Apply what matters. Ignore the rest.</p><a className="text-link" href="/blog">Enter the journal →</a></aside></div></section>
    <div className="wrap topic-strip"><span>Explore topics</span>{categories.map(c=><a href={`/category/${c.slug}`} key={c._id}>{c.name} →</a>)}</div>
    <section className="wrap" aria-labelledby="featured-title"><div className="section-heading"><div><div className="eyebrow">Editor’s selection</div><h2 id="featured-title">Worth your attention</h2></div><p>Original reporting, useful frameworks, and ideas designed to stay valuable beyond today’s feed.</p></div>
      {featured?<div className="feature-layout"><PostCard post={featured} featured index={1}/><div className="feature-stack">{side.map((p,i)=><PostCard post={p} index={i+2} key={p._id}/>)}</div></div>:<div className="empty-state"><h2>Our first stories are on the way.</h2><p>Join the briefing to hear when they arrive.</p></div>}
    </section>
    {more.length>0&&<section className="wrap" aria-labelledby="latest-title"><div className="section-heading"><div><div className="eyebrow">Latest stories</div><h2 id="latest-title">Keep exploring</h2></div><a className="text-link" href="/blog">See the full journal →</a></div><div className="story-grid">{more.map((p,i)=><PostCard post={p} index={i+4} key={p._id}/>)}</div></section>}
    <section className="newsletter-band"><div className="wrap newsletter-band__inner"><div><div className="eyebrow">The weekly briefing</div><h2>Your inbox deserves better ideas.</h2></div><p>One original essay or practical framework every week. Thoughtful, concise, and worth keeping.</p><NewsletterForm compact/></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(ld)}}/>
  </>;
}
