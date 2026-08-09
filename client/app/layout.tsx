import './globals.css';
import './compat.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { api } from '../lib/api';
import { absoluteUrl, DEFAULT_OG_IMAGE, jsonLd, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../lib/site';
import ClientNavigation from '../components/ClientNavigation';

const baseMetadata: Metadata = { metadataBase: new URL(SITE_URL), applicationName: SITE_NAME, authors: [{ name: 'Kraviona Editorial Team', url: SITE_URL }], creator: SITE_NAME, publisher: SITE_NAME, category: 'Technology news and analysis', alternates: { types: { 'application/rss+xml': `${SITE_URL}/feed.xml` } }, robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }, verification: { google: process.env.GOOGLE_SITE_VERIFICATION || '-XV8p9zE9MYruAbDWo-gSDEYRFLrSB200khCkukUysg' }, icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' }, manifest: '/manifest.webmanifest', formatDetection: { email: false, address: false, telephone: false }, referrer: 'origin-when-cross-origin' };

export async function generateMetadata(): Promise<Metadata> {
  let settings: any = {};
  try { settings = await api('/settings'); } catch {}
  const title = settings.defaultSeo?.title || 'Kraviona — Tech News, AI & Web Development Insights';
  const description = settings.defaultSeo?.description || 'Independent tech journalism covering AI, blockchain, cybersecurity, and web development. Deeply researched guides for developers and founders.';
  const image = settings.defaultSeo?.ogImage || DEFAULT_OG_IMAGE;
  return { ...baseMetadata, title: { default: title, template: `%s | ${settings.brandName || SITE_NAME}` }, description, openGraph: { type: 'website', locale: 'en_IN', url: '/', siteName: settings.brandName || SITE_NAME, title, description, images: [{ url: image, width: 1200, height: 630, alt: title }] }, twitter: { card: 'summary_large_image', title, description, images: [image] } };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#264b51', colorScheme: 'light' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let categories: any[] = [], settings: any = {};
  try { [categories, settings] = await Promise.all([api('/categories'), api('/settings')]); } catch {}
  const brand = settings.brandName || SITE_NAME;
  const tagline = settings.tagline || 'Independent news for curious minds';
  const description = settings.defaultSeo?.description || SITE_DESCRIPTION;
  const email = settings.contactEmail || 'kravionatech@gmail.com';
  const social = (settings.socialLinks || []).map((item: any) => absoluteUrl(item.url)).filter(Boolean);
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: brand, url: SITE_URL, logo: { '@type': 'ImageObject', '@id': `${SITE_URL}/#logo`, url: absoluteUrl('/icon.svg'), contentUrl: absoluteUrl('/icon.svg'), width: 512, height: 512, caption: brand }, description, email, telephone: settings.contactPhone, sameAs: [...new Set(social)], contactPoint: { '@type': 'ContactPoint', contactType: 'editorial contact', email, telephone: settings.contactPhone, availableLanguage: ['English', 'Hindi'], url: `${SITE_URL}/services#contact` } },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: brand, alternateName: `${brand} Journal`, url: SITE_URL, description, publisher: { '@id': `${SITE_URL}/#organization` }, inLanguage: 'en-IN', potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/blog?search={search_term_string}` }, 'query-input': 'required name=search_term_string' } }
  ] };
  return <html lang="en-IN"><body>
    <Script async src="https://www.googletagmanager.com/gtag/js?id=G-RW2R0MNJK5" strategy="afterInteractive" />
    <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-RW2R0MNJK5');`}</Script>
    <Script async src="https://pl30712675.effectivecpmnetwork.com/3c/dd/f0/3cddf0828907257998b47b67c7158afd.js" strategy="afterInteractive" />
    <Script async src="https://pl30712676.effectivecpmnetwork.com/b6/b6/1e/b6b61e3f833b7f4241d59ddef8fe7bb4.js" strategy="afterInteractive" />
    <ClientNavigation /><a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <div className="utility-bar"><div className="wrap"><span>{tagline}</span></div></div>
      <div className="wrap nav"><a className="brand" href="/" aria-label={`${brand} home`}>{brand.toLowerCase()}<span>.</span></a><nav aria-label="Primary navigation"><a href="/blog">All stories</a>{categories.slice(0, 3).map(category => <a href={`/category/${category.slug}`} key={category._id}>{category.name}</a>)}<a href="/services">Services</a></nav><a className="header-cta" href="/services#contact">Work with us <span>→</span></a></div>
      <nav className="mobile-topics wrap" aria-label="Topics"><a href="/blog">All stories</a>{categories.map(category => <a href={`/category/${category.slug}`} key={category._id}>{category.name}</a>)}<a href="/services">Services</a></nav>
    </header>
    <main id="main-content">{children}</main>
    <footer className="site-footer"><div className="wrap footer-top"><div className="footer-pitch"><a className="brand brand--light" href="/">{brand.toLowerCase()}<span>.</span></a><p>{description}</p></div><div><span className="footer-label">Read</span><div className="footer-nav"><a href="/blog">All stories</a>{categories.slice(0, 3).map(category => <a href={`/category/${category.slug}`} key={category._id}>{category.name}</a>)}<a href="/feed.xml">RSS feed</a></div></div><div className="footer-company"><span className="footer-label">Build with Kraviona</span><h3>Need a faster product or stronger growth engine?</h3><p>Talk directly with the Kraviona team.</p><div className="footer-company__links"><a href="/services#contact">Start a project →</a><a href={`mailto:${email}`}>{email}</a></div></div></div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} {brand}</span><span>Independent reporting and practical technology analysis.</span><a href="/sitemap.xml">Sitemap</a></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
  </body></html>;
}
