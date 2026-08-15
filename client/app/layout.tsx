import "./globals.css";
import "./compat.css";
import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { api } from "../lib/api";
import { absoluteUrl, DEFAULT_OG_IMAGE, jsonLd, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/site";
import ClientNavigation from "../components/ClientNavigation";
import Footer from "../components/Footer";
import MotionEnhancer from "../components/MotionEnhancer";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-space-grotesk" });

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

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#07090f", colorScheme: "dark" };

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
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-RW2R0MNJK5" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-RW2R0MNJK5');`}</Script>
        <Suspense fallback={null}><ClientNavigation /></Suspense>
        <MotionEnhancer />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Navbar brand={brand} categories={categories} />
        <main id="main-content"><PageTransition>{children}</PageTransition></main>
        <Footer brand={brand} description={description} email={email} categories={categories} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      </body>
    </html>
  );
}
