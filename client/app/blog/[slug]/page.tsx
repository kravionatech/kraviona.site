import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { api, ApiError } from '../../../lib/api';
import { absoluteUrl, DEFAULT_OG_IMAGE, formatDate, jsonLd, plainText, readingTime, SITE_NAME, SITE_URL, truncate } from '../../../lib/site';
import PostCard from '../../../components/PostCard';
import Comments from './comments';
import { LeaderboardAd, ContainerAd, DirectLinkAd } from '../../../components/ads';


export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;try{const p=await api(`/posts/${slug}`);const title=truncate(p.seo?.metaTitle||p.title,60);const description=truncate(p.seo?.metaDescription||p.quickAnswer||p.content,160);const canonical=`/blog/${p.slug}`;const image=p.seo?.ogImage||p.featuredImage?.url||DEFAULT_OG_IMAGE;const authorName=p.author?.name||'Kraviona Editorial Team';return{title,description,alternates:{canonical},keywords:p.tags,authors:[{name:authorName,url:SITE_URL}],openGraph:{type:'article',url:canonical,siteName:SITE_NAME,title,description,publishedTime:p.publishedAt,modifiedTime:p.updatedAt,authors:[authorName],section:p.category?.name,tags:p.tags,images:[{url:image,width:1200,height:630,alt:p.featuredImage?.alt||p.title}]},twitter:{card:'summary_large_image',title,description,images:[image]},robots:{index:!p.seo?.isNoIndex,follow:true,googleBot:{index:!p.seo?.isNoIndex,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}}}}catch{return{title:'Article not found',robots:{index:false,follow:false}}}}

export default async function PostPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;let p:any;try{p=await api(`/posts/${slug}`)}catch(error){if(error instanceof ApiError&&error.status===404)return notFound();throw error}
  let related:any[]=[];if(p.category?._id)try{const d=await api(`/posts?category=${p.category._id}&limit=4`);related=d.items.filter((x:any)=>x._id!==p._id).slice(0,3)}catch{}
  const canonical=absoluteUrl(`/blog/${p.slug}`);const description=truncate(p.seo?.metaDescription||p.quickAnswer||p.content,160);const image=absoluteUrl(p.seo?.ogImage||p.featuredImage?.url||DEFAULT_OG_IMAGE);const effectiveWordCount=p.wordCount||plainText(p.content||'').split(/\s+/).filter(Boolean).length;
  const authorName=p.author?.name||'Kraviona Editorial Team';const authorIsTeam=/team|editorial|kraviona/i.test(authorName);
  const author={'@type':authorIsTeam?'Organization':'Person',name:authorName,url:SITE_URL,...(p.author?.sameAs?.length?{sameAs:p.author.sameAs}: {})};
  const ld={'@context':'https://schema.org','@graph':[{'@type':'BlogPosting','@id':`${canonical}#article`,url:canonical,mainEntityOfPage:{'@type':'WebPage','@id':canonical},headline:p.title,description,image:{'@type':'ImageObject',url:image,contentUrl:image,caption:p.featuredImage?.alt||p.title},thumbnailUrl:image,datePublished:p.publishedAt,dateModified:p.updatedAt||p.publishedAt,wordCount:effectiveWordCount,articleSection:p.category?.name,keywords:p.tags?.join(', '),inLanguage:'en-IN',author,publisher:{'@id':`${SITE_URL}/#organization`},isPartOf:{'@id':`${SITE_URL}/#website`}}, {'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE_URL},{'@type':'ListItem',position:2,name:'Journal',item:`${SITE_URL}/blog`},...(p.category?.slug?[{'@type':'ListItem',position:3,name:p.category.name,item:`${SITE_URL}/category/${p.category.slug}`}]:[]),{'@type':'ListItem',position:p.category?.slug?4:3,name:p.title,item:canonical}]},...(p.faqs?.length?[{'@type':'FAQPage','@id':`${canonical}#faq`,mainEntity:p.faqs.map((f:any)=>({'@type':'Question',name:plainText(f.question),acceptedAnswer:{'@type':'Answer',text:plainText(f.answer)}}))}]:[])]};
  return <article className="article-shell">
    <div className="wrap"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog">Journal</a>{p.category?.slug&&<><span>/</span><a href={`/category/${p.category.slug}`}>{p.category.name}</a></>}</nav>
      <header className="article-header"><div className="eyebrow">{p.category?.name||'Kraviona journal'}</div><h1>{p.title}</h1><p className="article-deck">{p.quickAnswer}</p><div className="byline"><span>By <strong>{p.author?.name||'Kraviona Editorial Team'}</strong></span><span>Published <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>{p.updatedAt!==p.publishedAt&&<> · Updated <time dateTime={p.updatedAt}>{formatDate(p.updatedAt)}</time></>}</span><span>{readingTime(effectiveWordCount)} min read · {effectiveWordCount} words</span></div></header>
      {p.featuredImage?.url&&<figure className="article-hero-image"><Image src={p.featuredImage.url} alt={p.featuredImage.alt||p.title} fill priority sizes="(max-width: 1280px) 100vw, 1240px"/></figure>}
      <div className="article-layout">
        <aside className="article-sidebar" aria-label="Article summary">
          <div className="quick-answer"><span>In one sentence</span><p>{p.quickAnswer}</p></div>
          {p.keyTakeaways?.length>0&&<div className="takeaway-box"><span>Key takeaways</span><ul>{p.keyTakeaways.map((x:string)=><li key={x}>{x}</li>)}</ul></div>}
          <DirectLinkAd variant="sidebar" title="Recommended Tool" description="Explore verified technical solutions and partner offers." buttonText="Discover Offer ↗" />
        </aside>
        <div>
          <div className="article-body" dangerouslySetInnerHTML={{__html:p.content}}/>
          <ContainerAd />
        </div>
      </div>
      <LeaderboardAd />
      {p.faqs?.length>0&&<section className="faq-section" aria-labelledby="faq-heading"><div className="eyebrow">Common questions</div><h2 id="faq-heading">Frequently asked questions</h2>{p.faqs.map((f:any)=><div className="faq-item" key={f.question}><h3>{f.question}</h3><p>{f.answer}</p></div>)}</section>}
      <Comments post={p._id}/>
      {related.length>0&&<section className="related-section" aria-labelledby="related-heading"><div className="section-heading"><div><div className="eyebrow">Continue reading</div><h2 id="related-heading">Related stories</h2></div><a className="text-link" href={p.category?.slug?`/category/${p.category.slug}`:'/blog'}>More in {p.category?.name||'the journal'} →</a></div><div className="story-grid">{related.map((x:any,i:number)=><PostCard post={x} index={i+1} key={x._id}/>)}</div></section>}

    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(ld)}}/>
  </article>;
}
