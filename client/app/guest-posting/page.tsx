import type { Metadata } from "next";
import EditorAccountForm from "../../components/EditorAccountForm";
import { jsonLd, SITE_URL } from "../../lib/site";
export const metadata: Metadata = {
  title: "Free Guest Posting for Technology, AI & Business Writers",
  description:
    "Publish an original guest post on Kraviona free until 7 November 2026. Contribute useful articles about technology, AI, cybersecurity, web development, SEO and modern business.",
  keywords: [
    "free guest posting",
    "technology guest post",
    "write for us technology",
    "AI guest post",
    "business guest blogging",
  ],
  alternates: { canonical: "/guest-posting" },
  openGraph: {
    type: "website",
    url: "/guest-posting",
    title: "Write for Kraviona — Free Guest Posting",
    description:
      "Apply for a Kraviona editor account and publish original technology, AI and business articles free during our 90-day contributor programme.",
  },
  robots: { index: true, follow: true },
};
export default function GuestPosting() {
  const editorUrl =
    process.env.NEXT_PUBLIC_EDITOR_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3002"
      : "https://editor.kraviona.site");
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Free guest posting on Kraviona",
    url: `${SITE_URL}/guest-posting`,
    description:
      "Contributor guidelines and editor account application for original technology, AI, cybersecurity, web development, SEO and business articles.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "Service",
      name: "Kraviona contributor programme",
      provider: { "@id": `${SITE_URL}/#organization` },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        validThrough: "2026-11-07",
        availability: "https://schema.org/InStock",
      },
    },
  };
  return (
    <>
      <section className="guest-hero">
        <div className="wrap">
          <div className="eyebrow">
            90-day contributor programme · Ends 7 November 2026
          </div>
          <h1>Free guest posting for writers with useful ideas.</h1>
          <p>
            Build your author presence by publishing original, practical writing
            for Kraviona’s technology and business audience. There is no
            submission or publishing fee during this limited programme.
          </p>
          <div className="guest-hero-actions">
            <a className="header-cta" href="#apply">
              Apply to write <span>→</span>
            </a>
            <a className="text-link" href={editorUrl}>
              Editor login →
            </a>
          </div>
        </div>
      </section>
      <section className="wrap guest-grid">
        <article>
          <h2>Write for Kraviona</h2>
          <p>
            Kraviona welcomes clear, experience-led articles that help readers
            understand technology, apply AI responsibly, build better digital
            products and grow durable businesses. We value evidence, useful
            examples and original thinking over promotional copy.
          </p>
          <h2>Topics we accept</h2>
          <ul>
            <li>
              Artificial intelligence, automation and practical AI workflows.
            </li>
            <li>Web development, software engineering and product design.</li>
            <li>Cybersecurity, privacy, blockchain and emerging technology.</li>
            <li>
              SEO, digital strategy, entrepreneurship and modern business.
            </li>
            <li>
              Original tutorials, case studies, explainers and informed
              analysis.
            </li>
          </ul>
          <h2>Guest post guidelines</h2>
          <ul>
            <li>
              Submit at least 300 words; detailed articles between 800 and 1,800
              words usually perform best.
            </li>
            <li>
              Use descriptive headings, accurate sources and examples that
              support the reader.
            </li>
            <li>
              Content must be original, human-reviewed and not published
              elsewhere.
            </li>
            <li>
              No gambling, adult, illegal, misleading or low-quality promotional
              links.
            </li>
            <li>
              External links must stay within the allowance assigned to your
              approved account.
            </li>
          </ul>
        </article>
        <aside className="guest-card">
          <span className="eyebrow">How publishing works</span>
          <ol>
            <li>Apply for a free editor account.</li>
            <li>
              An administrator verifies your account and backlink allowance.
            </li>
            <li>Write with Kraviona’s full rich-text and SEO editor.</li>
            <li>
              Articles that pass the built-in requirements publish directly to
              the journal.
            </li>
          </ol>
          <div className="campaign-deadline">
            <b>Free until 7 Nov 2026</b>
            <span>No submission fee · No publishing fee</span>
          </div>
          <a className="text-link" href="#apply">
            Start your application →
          </a>
        </aside>
      </section>
      <section className="wrap guest-benefits">
        <div>
          <b>01</b>
          <h3>Author visibility</h3>
          <p>
            Publish under your name and share a live Kraviona article with your
            audience.
          </p>
        </div>
        <div>
          <b>02</b>
          <h3>Professional editor</h3>
          <p>
            Format headings, images, links, FAQs, takeaways and search metadata
            in one workspace.
          </p>
        </div>
        <div>
          <b>03</b>
          <h3>Relevant audience</h3>
          <p>
            Reach readers interested in technology, AI, digital growth and
            modern business.
          </p>
        </div>
      </section>
      <section className="wrap guest-account" id="apply">
        <EditorAccountForm />
      </section>
      <section className="wrap guest-note">
        <h2>Quality comes before promotion.</h2>
        <p>
          Free guest posting does not remove Kraviona’s content standards.
          Accounts or articles containing copied, deceptive, purely promotional
          or unsafe material may be rejected, suspended or removed.
        </p>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
    </>
  );
}
