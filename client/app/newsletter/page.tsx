import type { Metadata } from "next";
import NewsletterForm from "../../components/NewsletterForm";
import { DEFAULT_OG_IMAGE, jsonLd, SITE_URL } from "../../lib/site";
import "./newsletter.css";

const newsletterTitle = "The Chain Brief — Kraviona's Web3 Newsletter";
const newsletterDescription =
  "The essential blockchain and Web3 news, protocol shifts and market analysis, delivered once a week without the noise.";
export const metadata: Metadata = {
  title: "The Chain Brief — Web3 Newsletter",
  description: newsletterDescription,
  alternates: { canonical: "/newsletter" },
  openGraph: {
    type: "website",
    url: "/newsletter",
    title: newsletterTitle,
    description: newsletterDescription,
    images: [
      { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: newsletterTitle },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: newsletterTitle,
    description: newsletterDescription,
    images: [DEFAULT_OG_IMAGE],
  },
};
export default function Newsletter() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "The Chain Brief",
    url: `${SITE_URL}/newsletter`,
    description:
      "A weekly blockchain and Web3 intelligence briefing from Kraviona.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
  return (
    <div className="newsletter-page">
      <section className="wrap newsletter-hero">
        <div>
          <div className="eyebrow">One verified dispatch · Every week</div>
          <h1>Stay on-chain without chasing the feed.</h1>
          <p className="lead">
            The consequential blockchain news, market context and protocol
            shifts—reported clearly and delivered in one focused briefing.
          </p>
          <NewsletterForm />
        </div>
        <aside className="newsletter-preview">
          <div className="preview-top">
            <span>THE CHAIN BRIEF</span>
            <span>ISSUE 024</span>
          </div>
          <div className="preview-body">
            <span className="kicker">This week on-chain</span>
            <h2>What changed, why it matters, what comes next.</h2>
            <p>
              A five-minute read for a market that never stops moving.
            </p>
            <div className="preview-lines">
              <i />
              <i />
              <i />
            </div>
          </div>
        </aside>
      </section>
      <section className="newsletter-values">
        <div className="wrap">
          <div>
            <b>01</b>
            <h3>Verified</h3>
            <p>Source-led reporting—not recycled social media speculation.</p>
          </div>
          <div>
            <b>02</b>
            <h3>Contextual</h3>
            <p>Every development is connected to the protocol and market underneath it.</p>
          </div>
          <div>
            <b>03</b>
            <h3>Respectful</h3>
            <p>One email a week. Clear analysis. Zero token promotion.</p>
          </div>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(ld) }}
      />
    </div>
  );
}
