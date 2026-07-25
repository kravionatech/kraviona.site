import './globals.css';import './compat.css';import type {Metadata,Viewport} from 'next';import Script from 'next/script';import {api} from '../lib/api';import {absoluteUrl,jsonLd,SITE_DESCRIPTION,SITE_NAME,SITE_URL} from '../lib/site';import ClientNavigation from '../components/ClientNavigation';
const baseMetadata:Metadata={metadataBase:new URL(SITE_URL),applicationName:SITE_NAME,authors:[{name:'Kraviona Editorial Team',url:SITE_URL}],creator:SITE_NAME,publisher:SITE_NAME,category:'Technology and business',alternates:{canonical:'/',types:{'application/rss+xml':'/feed.xml'}},robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},verification:{google:process.env.GOOGLE_SITE_VERIFICATION||'-XV8p9zE9MYruAbDWo-gSDEYRFLrSB200khCkukUysg'},icons:{icon:'/icon.svg',apple:'/icon.svg'},manifest:'/manifest.webmanifest'};
export async function generateMetadata():Promise<Metadata>{let s:any={};try{s=await api('/settings')}catch{}const title=s.defaultSeo?.title||'Kraviona — Clear ideas for better work';const description=s.defaultSeo?.description||SITE_DESCRIPTION;const image=s.defaultSeo?.ogImage||'/opengraph-image';return{...baseMetadata,title:{default:title,template:`%s | ${s.brandName||SITE_NAME}`},description,openGraph:{type:'website',locale:'en_US',url:'/',siteName:s.brandName||SITE_NAME,title,description,images:[{url:image,width:1200,height:630,alt:title}]},twitter:{card:'summary_large_image',title,description,images:[image]}}}
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#264b51',colorScheme:'light'};
export default async function RootLayout({children}:{children:React.ReactNode}){
  let categories:any[]=[],settings:any={};
  try{[categories,settings]=await Promise.all([api('/categories'),api('/settings')])}catch{}
  const brand=settings.brandName||SITE_NAME;
  const tagline=settings.tagline||'Independent ideas for ambitious minds';
  const description=settings.defaultSeo?.description||SITE_DESCRIPTION;
  const official=settings.officialSiteUrl||'https://www.kraviona.com';
  const email=settings.contactEmail||'kravionatech@gmail.com';
  const social=[...(settings.socialLinks||[]).map((x:any)=>x.url).filter(Boolean),official];
  const structuredData=[
    {'@context':'https://schema.org','@type':'Organization','@id':`${SITE_URL}/#organization`,name:brand,url:SITE_URL,logo:{'@type':'ImageObject',url:absoluteUrl('/icon.svg'),width:512,height:512},description,email,telephone:settings.contactPhone,sameAs:[...new Set(social)],contactPoint:{'@type':'ContactPoint',contactType:'sales',email,telephone:settings.contactPhone,availableLanguage:['English','Hindi'],url:`${SITE_URL}/services#contact`}},
    {'@context':'https://schema.org','@type':'WebSite','@id':`${SITE_URL}/#website`,name:brand,alternateName:`${brand} Journal`,url:SITE_URL,description,publisher:{'@id':`${SITE_URL}/#organization`},inLanguage:'en',potentialAction:{'@type':'SearchAction',target:{'@type':'EntryPoint',urlTemplate:`${SITE_URL}/blog?search={search_term_string}`},'query-input':'required name=search_term_string'}}
  ];
  return <html lang="en"><body>
    <Script async src="https://www.googletagmanager.com/gtag/js?id=G-RW2R0MNJK5" strategy="afterInteractive"/>
    <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-RW2R0MNJK5');
    `}</Script>
    <ClientNavigation/><a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <div className="utility-bar"><div className="wrap"><span>{tagline}</span><a href={official} target="_blank" rel="noopener noreferrer">Official Kraviona site <b>↗</b></a></div></div>
      <div className="wrap nav"><a className="brand" href="/" aria-label={`${brand} home`}>{brand.toLowerCase()}<span>.</span></a><nav aria-label="Primary navigation"><a href="/blog">All stories</a>{categories.slice(0,3).map(c=><a href={`/category/${c.slug}`} key={c._id}>{c.name}</a>)}<a href="/services">Services</a></nav><a className="header-cta" href="/services#contact">Work with us <span>→</span></a></div>
      <nav className="mobile-topics wrap" aria-label="Topics"><a href="/blog">All stories</a>{categories.map(c=><a href={`/category/${c.slug}`} key={c._id}>{c.name}</a>)}<a href="/services">Services</a></nav>
    </header>
    <main id="main-content">{children}</main>
    <footer className="site-footer">
      <div className="wrap footer-top">
        <div className="footer-pitch"><a className="brand brand--light" href="/">{brand.toLowerCase()}<span>.</span></a><p>{description}</p><a className="official-badge" href={official} target="_blank" rel="noopener noreferrer"><b>Verified company website</b><span>kraviona.com ↗</span></a></div>
        <div><span className="footer-label">Read</span><div className="footer-nav"><a href="/blog">All stories</a>{categories.slice(0,3).map(c=><a href={`/category/${c.slug}`} key={c._id}>{c.name}</a>)}<a href="/feed.xml">RSS feed</a></div></div>
        <div className="footer-company"><span className="footer-label">Build with Kraviona</span><h3>Need a faster product or stronger growth engine?</h3><p>Talk directly with the team behind Kraviona.</p><div className="footer-company__links"><a href="/services#contact">Start a project →</a><a href={`mailto:${email}`}>{email}</a><a href={official} target="_blank" rel="noopener noreferrer">Official company site ↗</a></div></div>
      </div>
      <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} {brand}</span><span>Ideas by Kraviona · Services by Kraviona Tech Solutions</span><a href="/sitemap.xml">Sitemap</a></div>
    </footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(structuredData)}}/>
  </body></html>;
}
