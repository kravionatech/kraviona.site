import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "../../lib/api";
import PostCard from "../../components/PostCard";
import { DEFAULT_OG_IMAGE, jsonLd, SITE_URL } from "../../lib/site";
import { DisplayAd } from "../../components/ads";
import "./blog-v2.css";

type Query = { page?: string; search?: string };
const journalTitle = "Blockchain & Web3 News and Analysis | Kraviona";
const journalDescription =
  "Latest blockchain and Web3 news covering crypto markets, DeFi, protocols, digital assets, regulation and security.";

function pageNumber(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 1 ? page : 1;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Query>;
}): Promise<Metadata> {
  const query = await searchParams;
  const page = pageNumber(query.page);
  const search = (query.search || "").trim();
  const canonical = search
    ? "/blog"
    : page > 1
      ? `/blog?page=${page}`
      : "/blog";
  const title = search
    ? `Search results for “${search}”`
    : page > 1
      ? `${journalTitle} — Page ${page}`
      : journalTitle;
  const description = search
    ? `Search Kraviona blockchain stories for ${search}.`
    : journalDescription;
  return {
    title,
    description,
    alternates: { canonical },
    robots: search
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const query = await searchParams;
  const page = pageNumber(query.page);
  const search = (query.search || "").trim();
  const [data, categories] = await Promise.all([
    api(`/posts?page=${page}&limit=12&search=${encodeURIComponent(search)}`),
    api("/categories"),
  ]);
  if (!search && page > 1 && (!data.items?.length || page > data.pages))
    notFound();

  const items: any[] = data.items || [];
  const showEditorialLead = !search && page === 1 && items.length > 0;
  const lead = showEditorialLead ? items[0] : null;
  const secondary = showEditorialLead ? items.slice(1, 3) : [];
  const latest = showEditorialLead ? items.slice(3) : items;
  const canonical =
    page > 1 ? `${SITE_URL}/blog?page=${page}` : `${SITE_URL}/blog`;
  const ld = search
    ? null
    : [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": canonical,
          url: canonical,
          name: journalTitle,
          description: journalDescription,
          isPartOf: { "@id": `${SITE_URL}/#website` },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((post: any, index: number) => ({
              "@type": "ListItem",
              position: (page - 1) * 12 + index + 1,
              url: `${SITE_URL}/blog/${post.slug}`,
              name: post.title,
            })),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: "Blockchain news",
              item: `${SITE_URL}/blog`,
            },
          ],
        },
      ];

  return (
    <>
      <section className="journal-cover">
        <div className="journal-cover__network" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
        <div className="wrap journal-cover__inner">
          <div className="journal-cover__status">
            <span /> Coverage desk / Blockchain & Web3
          </div>
          <div className="journal-cover__grid">
            <h1>
              {search
                ? `Results for “${search}”`
                : "Blockchain news. Verified, not amplified."}
            </h1>
            <div className="journal-cover__aside">
              <p>
                Independent reporting and analysis for people building,
                investing and working across the decentralized economy.
              </p>
              <form className="journal-search" role="search">
                <label className="sr-only" htmlFor="journal-search">
                  Search blockchain news
                </label>
                <input
                  id="journal-search"
                  name="search"
                  defaultValue={search}
                  placeholder="Search protocols, markets, policy…"
                />
                <button aria-label="Search">Search ↗</button>
              </form>
            </div>
          </div>
          <div className="journal-stats" aria-label="Newsroom overview">
            <span><b>{String(data.total).padStart(2, "0")}</b> Published stories</span>
            <span><b>{String(categories.length).padStart(2, "0")}</b> Coverage desks</span>
            <span><b>01</b> Weekly chain brief</span>
          </div>
        </div>
      </section>

      <nav className="wrap topic-strip journal-topics" aria-label="Blockchain topics">
        <span>Browse topics</span>
        {categories.map((category: any) => (
          <a href={`/category/${category.slug}`} key={category._id}>
            {category.name} →
          </a>
        ))}
      </nav>

      <section className="wrap journal-content">
        {showEditorialLead && lead ? (
          <>
            <div className="journal-section-head" data-reveal="copy">
              <div><span>01 / Lead coverage</span><h2>Top of the chain</h2></div>
              <p>The developments and analysis leading today’s Web3 conversation.</p>
            </div>
            <div className="journal-feature-layout">
              <PostCard post={lead} featured index={1} />
              {secondary.length > 0 && (
                <div className="journal-feature-rail">
                  <div className="journal-rail-label"><span>Also on the desk</span><b>{secondary.length}</b></div>
                  {secondary.map((post, index) => (
                    <PostCard post={post} index={index + 2} key={post._id} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="journal-section-head" data-reveal="copy">
            <div>
              <span>{search ? "Search / Archive" : `Archive / Page ${page}`}</span>
              <h2>{search ? "Search results" : "More from the ledger"}</h2>
            </div>
            {search && <a className="text-link" href="/blog">Clear search ×</a>}
          </div>
        )}

        {latest.length > 0 && (
          <section className="journal-latest" aria-labelledby="journal-latest-title">
            {showEditorialLead && (
              <div className="journal-section-head journal-section-head--compact" data-reveal="copy">
                <div><span>02 / Latest dispatches</span><h2 id="journal-latest-title">Keep reading</h2></div>
                <p>Fresh reporting across markets, protocols, security and policy.</p>
              </div>
            )}
            <div className="story-grid journal-list">
              {latest.map((post: any, index: number) => (
                <PostCard
                  post={post}
                  index={showEditorialLead ? index + 4 : (page - 1) * 12 + index + 1}
                  key={post._id}
                />
              ))}
            </div>
          </section>
        )}

        {!items.length && (
          <div className="empty-state journal-empty">
            <div className="eyebrow">No matches</div>
            <h2>Try a broader search.</h2>
            <p>Explore all stories or choose a blockchain topic above.</p>
            <a className="btn" href="/blog">View all stories</a>
          </div>
        )}

        {data.pages > 1 && (
          <nav className="pagination" aria-label="Newsroom pages">
            {page > 1 && (
              <a rel="prev" href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}>
                ← Previous
              </a>
            )}
            <span>Page {page} of {data.pages}</span>
            {page < data.pages && <a rel="next" href={`/blog?page=${page + 1}`}>Next →</a>}
          </nav>
        )}
      </section>

      <div className="wrap ad-slot--compact"><DisplayAd size="728x90" /></div>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />}
    </>
  );
}
