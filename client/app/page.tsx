import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { api } from "../lib/api";
import PostCard from "../components/PostCard";
import NewsletterForm from "../components/NewsletterForm";
import Hero from "../components/Hero";
import { DEFAULT_OG_IMAGE, jsonLd, SITE_URL } from "../lib/site";

const homeTitle = "Kraviona — Blockchain & Web3 News, Research and Analysis";
const homeDescription =
  "Independent blockchain and Web3 news covering crypto markets, protocols, DeFi, regulation, security and the infrastructure shaping the open internet.";

export async function generateMetadata(): Promise<Metadata> {
  let settings: any = {};
  try { settings = await api("/settings"); } catch {}
  const title = settings.defaultSeo?.title || homeTitle;
  const description = settings.defaultSeo?.description || homeDescription;
  const image = settings.defaultSeo?.ogImage || DEFAULT_OG_IMAGE;
  return {
    title: { absolute: title },
    description,
    keywords: [
      "blockchain news",
      "Web3 news",
      "crypto market analysis",
      "DeFi",
      "blockchain security",
      "digital assets",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const coverage = [
  {
    eyebrow: "Markets & DeFi",
    title: "Follow capital as it moves on-chain.",
    description: "Stablecoins, tokenized assets, decentralized exchanges and the market structure behind digital value.",
    href: "/category/markets-defi",
    image: "/images/web3/defi-liquidity.webp",
    alt: "Transparent on-chain liquidity vaults connected by illuminated market flows",
  },
  {
    eyebrow: "Security",
    title: "Understand the risks before the headlines.",
    description: "Protocol exploits, custody, audits and the engineering decisions that make decentralized systems resilient.",
    href: "/category/security",
    image: "/images/web3/protocol-security.webp",
    alt: "Cryptographic core protected by a distributed blockchain validator network",
  },
];

export default async function Home() {
  let posts: any[] = [], categories: any[] = [], settings: any = {};
  try {
    const [postData, categoryData, siteSettings] = await Promise.all([api("/posts?limit=10"), api("/categories"), api("/settings")]);
    posts = postData.items || [];
    categories = categoryData || [];
    settings = siteSettings || {};
  } catch {}
  const [featured, ...rest] = posts;
  const side = rest.slice(0, 2);
  const more = rest.slice(2);
  const resolvedDescription = settings.defaultSeo?.description || homeDescription;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/#home`,
    url: SITE_URL,
    name: homeTitle,
    description: resolvedDescription,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: ["Blockchain", "Web3", "Decentralized finance", "Digital assets"],
    inLanguage: "en-IN",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <>
      <Hero
        eyebrow={settings.heroEyebrow}
        title={settings.heroTitle}
        description={settings.heroDescription}
      />

      <div className="chain-ticker" aria-label="Coverage areas">
        <div className="wrap chain-ticker__track">
          <span>Coverage</span><b>Protocol upgrades</b><i /><b>Digital assets</b><i /><b>DeFi markets</b><i /><b>Web3 security</b><i /><b>Policy & regulation</b>
        </div>
      </div>

      {categories.length > 0 && (
        <nav className="wrap topic-strip" aria-label="Blockchain topics">
          <span>Explore the chain</span>
          {categories.map((category) => <Link href={`/category/${category.slug}`} prefetch key={category._id}>{category.name} →</Link>)}
        </nav>
      )}

      <section className="wrap" aria-labelledby="featured-title">
        <div className="section-heading" data-reveal="copy">
          <div><div className="eyebrow">Latest intelligence</div><h2 id="featured-title">What matters on-chain now</h2></div>
          <p>Reported developments and durable analysis for builders, investors and readers navigating decentralized technology.</p>
        </div>
        {featured ? (
          <div className="feature-layout">
            <PostCard post={featured} featured index={1} />
            <div className="feature-stack">{side.map((post, index) => <PostCard post={post} index={index + 2} key={post._id} />)}</div>
          </div>
        ) : (
          <div className="empty-state chain-empty">
            <div className="eyebrow">Newsroom syncing</div><h2>The next block of reporting is being verified.</h2>
            <p>Join the Chain Brief and get our first dispatch.</p><a className="signal-button" href="/newsletter">Join the briefing →</a>
          </div>
        )}
      </section>

      <section className="coverage-section" aria-labelledby="coverage-title">
        <div className="wrap">
          <div className="section-heading section-heading--light" data-reveal="copy">
            <div><div className="eyebrow">Focused coverage</div><h2 id="coverage-title">Go beyond the token price.</h2></div>
            <p>Kraviona explains the systems, incentives and risks behind the market—not just the movement on a chart.</p>
          </div>
          <div className="coverage-grid">
            {coverage.map((item, index) => (
              <a className="coverage-card" href={item.href} key={item.title} data-reveal="card">
                <div className="coverage-card__image">
                  <Image src={item.image} alt={item.alt} fill sizes="(max-width: 760px) 100vw, 50vw" />
                  <span>0{index + 1}</span>
                </div>
                <div className="coverage-card__copy"><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.description}</p><b>Explore coverage ↗</b></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {more.length > 0 && (
        <section className="wrap" aria-labelledby="latest-title">
          <div className="section-heading" data-reveal="copy">
            <div><div className="eyebrow">More from the ledger</div><h2 id="latest-title">Latest Web3 stories</h2></div>
            <a className="text-link" href="/blog">View all news →</a>
          </div>
          <div className="story-grid">{more.map((post, index) => <PostCard post={post} index={index + 4} key={post._id} />)}</div>
        </section>
      )}

      <section className="newsletter-band">
        <div className="wrap newsletter-band__inner" data-reveal="copy">
          <div className="newsletter-band__copy">
            <div className="eyebrow">The Chain Brief</div><h2>{settings.briefingTitle || "Web3 signal, delivered weekly."}</h2>
            <p>{settings.briefingDescription || "The consequential blockchain news, one sharp analysis and the protocol shifts worth watching—readable in five minutes."}</p>
            <div className="briefing-points"><span>Independent reporting</span><span>5-minute read</span><span>Zero token promotion</span></div>
          </div>
          <div className="newsletter-card"><span className="newsletter-card__label">Join the on-chain briefing</span><NewsletterForm compact /><p>One useful dispatch each week. Unsubscribe anytime.</p></div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
    </>
  );
}
