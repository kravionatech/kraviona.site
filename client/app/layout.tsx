import "./globals.css";
import "./compat.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { api } from "../lib/api";
import { absoluteUrl, DEFAULT_OG_IMAGE, jsonLd, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/site";
import ClientNavigation from "../components/ClientNavigation";
import MotionEnhancer from "../components/MotionEnhancer";

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  authors: [{ name: "Kraviona Editorial Team", url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Blockchain and Web3 news",
  alternates: { types: { "application/rss+xml": `${SITE_URL}/feed.xml` } },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || "-XV8p9zE9MYruAbDWo-gSDEYRFLrSB200khCkukUysg" },
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  formatDetection: { email: false, address: false, telephone: false },
  referrer: "origin-when-cross-origin",
};

export async function generateMetadata(): Promise<Metadata> {
  let settings: any = {};
  try { settings = await api("/settings"); } catch {}
  const title = "Kraviona — Blockchain & Web3 News and Analysis";
  const description = SITE_DESCRIPTION;
  const image = settings.defaultSeo?.ogImage || DEFAULT_OG_IMAGE;
  return {
    ...baseMetadata,
    title: { default: title, template: `%s | ${settings.brandName || SITE_NAME}` },
    description,
    openGraph: { type: "website", locale: "en_IN", url: "/", siteName: settings.brandName || SITE_NAME, title, description, images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#050816", colorScheme: "dark light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let categories: any[] = [], settings: any = {};
  try { [categories, settings] = await Promise.all([api("/categories"), api("/settings")]); } catch {}
  const brand = settings.brandName || SITE_NAME;
  const description = SITE_DESCRIPTION;
  const email = settings.contactEmail || "kravionatech@gmail.com";
  const social = (settings.socialLinks || []).map((item: any) => absoluteUrl(item.url)).filter(Boolean);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsMediaOrganization",
        "@id": `${SITE_URL}/#organization`,
        name: brand,
        url: SITE_URL,
        logo: { "@type": "ImageObject", "@id": `${SITE_URL}/#logo`, url: absoluteUrl("/icon.svg"), contentUrl: absoluteUrl("/icon.svg"), width: 512, height: 512, caption: brand },
        description,
        email,
        sameAs: [...new Set(social)],
        ethicsPolicy: `${SITE_URL}/llms.txt`,
        contactPoint: { "@type": "ContactPoint", contactType: "newsroom", email, availableLanguage: ["English"], url: `${SITE_URL}/newsletter` },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: brand,
        alternateName: `${brand} Blockchain News`,
        url: SITE_URL,
        description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-IN",
        potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/blog?search={search_term_string}` }, "query-input": "required name=search_term_string" },
      },
    ],
  };
  return (
    <html lang="en-IN">
      <body>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-RW2R0MNJK5" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-RW2R0MNJK5');`}</Script>
        <Suspense fallback={null}><ClientNavigation /></Suspense>
        <MotionEnhancer />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="utility-bar"><div className="wrap"><span><b>●</b> Live blockchain intelligence</span><span className="utility-edition">Markets · Protocols · Security · Policy</span></div></div>
          <div className="wrap nav news-masthead">
            <div className="news-desk-meta"><span>Independent newsroom</span><b>India / Global</b></div>
            <a className="brand" href="/" aria-label={`${brand} home`}>{brand.toLowerCase()}<span>.</span></a>
            <div className="news-masthead__actions"><a className="header-search" href="/blog#journal-search">Search</a><a className="header-cta" href="/newsletter">Get the brief <span>→</span></a></div>
          </div>
          <div className="news-primary-wrap">
          <nav className="news-primary-nav wrap" aria-label="Primary navigation">
            <a href="/">Home</a>
            <a href="/blog"><b>Live</b> Latest</a>
            {categories.map((category) => <a href={`/category/${category.slug}`} key={category._id}>{category.name}</a>)}
            <a href="/newsletter">Chain Brief</a>
          </nav>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <div className="wrap footer-top">
            <div className="footer-pitch">
              <a className="brand brand--light" href="/">{brand.toLowerCase()}<span>.</span></a>
              <p>{description}</p>
            </div>
            <div>
              <span className="footer-label">Follow the chain</span>
              <div className="footer-nav">
                <a href="/blog">Latest news</a>
                {categories.slice(0, 4).map((category) => <a href={`/category/${category.slug}`} key={category._id}>{category.name}</a>)}
                <a href="/feed.xml">RSS feed</a>
              </div>
            </div>
            <div className="footer-company">
              <span className="footer-label">The Chain Brief</span>
              <h3>Track Web3 without living in the feed.</h3>
              <p>One focused blockchain intelligence briefing every week.</p>
              <div className="footer-company__links"><a href="/newsletter">Join the briefing →</a><a href={`mailto:${email}`}>{email}</a></div>
            </div>
          </div>
          <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} {brand}</span><span>Independent blockchain and Web3 reporting.</span><a href="/sitemap.xml">Sitemap</a></div>
        </footer>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      </body>
    </html>
  );
}
