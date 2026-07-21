import { api } from '../../lib/api';
import Image from 'next/image';
import './blog.css';
export const metadata = { title: 'Journal', description: 'Browse practical guides and original research from Kraviona.' };

export default async function Blog({ searchParams }: { searchParams: Promise<{ page?: string, search?: string }> }) {
  const s = await searchParams;
  const [data, categories] = await Promise.all([api(`/posts?page=${s.page || 1}&search=${encodeURIComponent(s.search || '')}`), api('/categories')]);
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://kraviona.site';
  const ld = [{ '@context': 'https://schema.org', '@type': 'Blog', name: 'Kraviona Journal', url: `${site}/blog` }, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: site }, { '@type': 'ListItem', position: 2, name: 'Journal', item: `${site}/blog` }] }];
  return <div className="wrap">
    <section className="hero journal-hero"><div className="eyebrow">The Kraviona journal</div><h1>{s.search ? `Ideas about “${s.search}”` : 'Useful depth, minus the noise.'}</h1><div className="journal-intro"><p className="lead">Independent essays, practical frameworks, and clear perspectives on technology, growth, work, and ideas.</p><form className="search-box"><input name="search" defaultValue={s.search} placeholder="Search the journal"/><button aria-label="Search">Search →</button></form></div></section>
    <div className="topic-rail"><span>Browse topics</span>{categories.map((c:any)=><a href={`/category/${c.slug}`} key={c._id}>{c.name} <b>→</b></a>)}</div>
    <div className="section-head"><div><div className="eyebrow">{data.total} essays</div><h2>{s.search ? 'Search results' : 'All stories'}</h2></div></div>
    <div className="grid journal-grid">{data.items.map((p: any) => <a className="card" key={p._id} href={`/blog/${p.slug}`}>{p.featuredImage?.url && <Image unoptimized width={800} height={500} src={p.featuredImage.url} alt={p.featuredImage.alt || p.title}/>}<div className="card-body"><span className="tag">{p.category?.name || 'Journal'}</span><h2>{p.title}</h2><p>{p.quickAnswer}</p><span className="meta">{Math.max(1, Math.ceil(p.wordCount / 220))} min read · Read story →</span></div></a>)}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}/>
  </div>;
}
