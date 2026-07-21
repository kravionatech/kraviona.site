import './globals.css';
import './compat.css';
import type { Metadata, Viewport } from 'next';
import { api } from '../lib/api';
import { absoluteUrl, jsonLd, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../lib/site';
import NewsletterForm from '../components/NewsletterForm';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Kraviona — Clear ideas for better work', template: '%s | Kraviona' },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'Kraviona Editorial Team', url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Technology and business',
  alternates: { canonical: '/', types: { 'application/rss+xml': '/feed.xml' } },
  openGraph: { type: 'website', locale: 'en_US', url: '/', siteName: SITE_NAME, title: 'Kraviona — Clear ideas for better work', description: SITE_DESCRIPTION, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Kraviona — Clear ideas for better work' }] },
  twitter: { card: 'summary_large_image', title: 'Kraviona — Clear ideas for better work', description: SITE_DESCRIPTION, images: ['/opengraph-image'] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  manifest: '/manifest.webmanifest'
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#101820', colorScheme: 'light' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let categories: any[] = []; try { categories = await api('/categories'); } catch {}
  const structuredData = [
    { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: absoluteUrl('/icon.svg'), width: 512, height: 512 }, description: SITE_DESCRIPTION },
    { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, alternateName: 'Kraviona Journal', url: SITE_URL, description: SITE_DESCRIPTION, publisher: { '@id': `${SITE_URL}/#organization` }, inLanguage: 'en', potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/blog?search={search_term_string}` }, 'query-input': 'required name=search_term_string' } }
  ];
  return <html lang="en"><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <div className="utility-bar"><div className="wrap"><span>Independent ideas for ambitious minds</span><a href="/newsletter">Weekly briefing <b>↗</b></a></div></div>
      <div className="wrap nav">
        <a className="brand" href="/" aria-label="Kraviona home">kraviona<span>.</span></a>
        <nav aria-label="Primary navigation"><a href="/blog">All stories</a>{categories.map(c => <a href={`/category/${c.slug}`} key={c._id}>{c.name}</a>)}</nav>
        <a className="header-cta" href="/newsletter">Get the briefing <span>→</span></a>
      </div>
      <nav className="mobile-topics wrap" aria-label="Topics"><a href="/blog">All stories</a>{categories.map(c => <a href={`/category/${c.slug}`} key={c._id}>{c.name}</a>)}</nav>
    </header>
    <main id="main-content">{children}</main>
    <footer className="site-footer">
      <div className="wrap footer-top"><div className="footer-pitch"><a className="brand brand--light" href="/">kraviona<span>.</span></a><h2>Think clearly.<br/>Build what lasts.</h2><p>{SITE_DESCRIPTION}</p></div><div><span className="footer-label">Explore</span><div className="footer-nav"><a href="/blog">All stories</a>{categories.map(c=><a href={`/category/${c.slug}`} key={c._id}>{c.name}</a>)}<a href="/feed.xml">RSS feed</a></div></div><div className="footer-signup"><span className="footer-label">One useful email a week</span><p>Original ideas and practical frameworks. No noise.</p><NewsletterForm compact/></div></div>
      <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} Kraviona</span><span>Independent publishing · Made for curious people</span><a href="/sitemap.xml">Sitemap</a></div>
    </footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}/>
  </body></html>;
}
