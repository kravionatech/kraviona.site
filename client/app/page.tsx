import { api } from '../lib/api';
import Image from 'next/image';

export default async function Home() {
  let data = { items: [] as any[] }; let categories: any[] = [];
  try { [data, categories] = await Promise.all([api('/posts?limit=10'), api('/categories')]); } catch {}
  return <>
    <section className="hero hero-home wrap"><div><div className="eyebrow">Independent ideas for ambitious minds</div><h1>Clarity for the work that matters.</h1><p className="lead">Sharp thinking on technology, modern growth, and building durable businesses—researched deeply and written for humans.</p></div><aside className="hero-note"><strong>The weekly Kraviona briefing</strong>One considered email. Original ideas, useful frameworks, no recycled noise.<br/><br/><a className="btn" href="/newsletter">Read it free →</a></aside></section>
    <section className="wrap">
      <div className="topic-rail"><span>Explore by topic</span>{categories.map(c => <a href={`/category/${c.slug}`} key={c._id}>{c.name} <b>→</b></a>)}</div>
      <div className="section-head"><div><div className="eyebrow">The latest</div><h2>Ideas worth your attention</h2></div><a className="text-link" href="/blog">View the complete journal →</a></div>
      {data.items.length ? <div className="grid">{data.items.map((p: any) => <a className="card" key={p._id} href={`/blog/${p.slug}`}>{p.featuredImage?.url && <Image unoptimized width={1000} height={600} src={p.featuredImage.url} alt={p.featuredImage.alt || p.title}/>}<div className="card-body"><span className="tag">{p.category?.name || 'Field notes'}</span><h2>{p.title}</h2><p>{p.quickAnswer}</p><p className="meta">{new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {Math.max(1, Math.ceil(p.wordCount / 220))} min read</p></div></a>)}</div> : <div className="empty-state"><h2>New ideas are on the way.</h2><p>Join the briefing to receive the first one.</p></div>}
    </section>
    <section className="briefing-band"><div className="wrap briefing-inner"><div><div className="eyebrow">The Kraviona briefing</div><h2>One useful idea every week.</h2></div><p>Original essays and practical frameworks for people building thoughtful work. No feeds, no noise.</p><a className="btn light-btn" href="/newsletter">Join the briefing →</a></div></section>
  </>;
}
