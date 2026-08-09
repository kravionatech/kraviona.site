import type { Metadata } from "next";
import { api } from "../../lib/api";
import {
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  jsonLd,
  SITE_URL,
} from "../../lib/site";
import InquiryForm from "../../components/InquiryForm";
import { DisplayAd } from "../../components/ads";

const servicesTitle = "Build and grow with Kraviona";
const servicesDescription =
  "Work with Kraviona on product development, technical SEO, web performance, backend systems and AI automation.";
export const metadata: Metadata = {
  title: "Services",
  description: servicesDescription,
  alternates: { canonical: "/services" },
  openGraph: {
    type: "website",
    url: "/services",
    title: servicesTitle,
    description: servicesDescription,
    images: [
      { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: servicesTitle },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: servicesTitle,
    description: servicesDescription,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function ServicesPage() {
  let services: any[] = [],
    settings: any = {};
  try {
    [services, settings] = await Promise.all([
      api("/services"),
      api("/settings"),
    ]);
  } catch {}
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/services#page`,
        url: absoluteUrl("/services"),
        name: "Kraviona services",
        description: settings.servicesDescription || servicesDescription,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-IN",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: services.length,
          itemListElement: services.map((service, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Service",
              name: service.title,
              description: service.summary,
              provider: { "@id": `${SITE_URL}/#organization` },
              areaServed: "Worldwide",
              url: `${SITE_URL}/services#contact`,
            },
          })),
        },
      },
      {
        "@type": "ContactPage",
        "@id": `${SITE_URL}/services#contact`,
        url: `${SITE_URL}/services#contact`,
        name: "Contact Kraviona",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
  return (
    <>
      <section className="services-hero wrap">
        <div>
          <span className="eyebrow">Strategy · Engineering · Growth</span>
          <h1>
            {settings.servicesTitle || "From ideas to measurable outcomes."}
          </h1>
          <p className="lead">
            {settings.servicesDescription ||
              "Kraviona helps teams build faster products, stronger search visibility, and practical AI workflows."}
          </p>
          <div className="services-hero__actions">
            <a className="button" href="#contact">
              Discuss your project →
            </a>
          </div>
        </div>
        <aside>
          <span>Independent expertise</span>
          <strong>Kraviona</strong>
          <p>
            Direct strategy, engineering, and growth support for teams that need
            practical outcomes.
          </p>
          <a href="#contact">Start a conversation →</a>
        </aside>
      </section>
      <section className="services-list wrap" aria-labelledby="services-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">How we can help</div>
            <h2 id="services-title">Focused expertise. Clear delivery.</h2>
          </div>
          <p>
            Start with the business outcome. We will recommend the smallest
            dependable solution that gets you there.
          </p>
        </div>
        <div className="service-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service._id}>
              <div className="service-card__number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <span className="eyebrow">{service.eyebrow}</span>
              <h3>{service.title}</h3>
              <p>{service.summary}</p>
              <ul>
                {service.deliverables?.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a href="#contact">Start a conversation →</a>
            </article>
          ))}
        </div>
      </section>
      <section className="contact-section" id="contact">
        <div className="wrap contact-layout">
          <div>
            <span className="eyebrow">Start a project</span>
            <h2>Tell us what better looks like.</h2>
            <p>
              Share a short brief and the team will respond with relevant
              questions, a practical next step, and an honest view of scope.
            </p>
            <div className="direct-contact">
              <a
                href={`mailto:${settings.contactEmail || "kravionatech@gmail.com"}`}
              >
                {settings.contactEmail || "kravionatech@gmail.com"}
              </a>
              <a
                href={settings.whatsappUrl || "https://wa.me/919608553167"}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp {settings.contactPhone || "+91 96085 53167"} ↗
              </a>
            </div>
          </div>
          <InquiryForm services={services} />
        </div>
      </section>
      <div className="wrap ad-slot--compact">
        <DisplayAd size="468x60" />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
    </>
  );
}
