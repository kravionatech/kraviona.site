import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostCard from "../../../components/PostCard";
import { api } from "../../../lib/api";
import { jsonLd, SITE_NAME, SITE_URL, truncate } from "../../../lib/site";

async function getAuthor(slug: string) {
  const authors = await api("/authors");
  return authors.find((author: any) => author.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const author = await getAuthor(slug);
    if (!author) return { title: "Author not found", robots: { index: false } };
    const title = `${author.name} — Author at ${SITE_NAME}`;
    const description = truncate(
      `${author.name} reports on blockchain and Web3 for ${SITE_NAME}. Explore ${author.postCount} published articles, analysis, and explainers.`,
      160,
    );
    return {
      title,
      description,
      alternates: { canonical: `/author/${author.slug}` },
      openGraph: { type: "profile", url: `/author/${author.slug}`, title, description },
    };
  } catch {
    return { title: "Author", robots: { index: false } };
  }
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let author: any;
  let posts: any[] = [];
  try {
    [author, posts] = await Promise.all([
      getAuthor(slug),
      api(`/posts?author=${encodeURIComponent(slug)}&limit=100`).then(
        (data: any) => data.items || [],
      ),
    ]);
  } catch {}
  if (!author) return notFound();

  const canonical = `${SITE_URL}/author/${author.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${canonical}#profile`,
    url: canonical,
    mainEntity: {
      "@type": /team|editorial|kraviona/i.test(author.name)
        ? "Organization"
        : "Person",
      "@id": `${canonical}#author`,
      name: author.name,
      url: canonical,
      sameAs: author.sameAs || [],
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
  };

  return (
    <>
      <section className="author-hero">
        <div className="wrap author-hero__inner">
          <div className="author-mark" aria-hidden="true">
            {author.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <span className="eyebrow">Kraviona contributor</span>
            <h1>{author.name}</h1>
            <p>
              Evidence-led blockchain and Web3 reporting. {author.postCount} published {author.postCount === 1 ? "story" : "stories"}.
            </p>
            {author.sameAs?.length > 0 && (
              <div className="author-links">
                {author.sameAs.map((url: string) => (
                  <a href={url} rel="me noopener" target="_blank" key={url}>Verified profile ↗</a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="wrap author-archive" aria-labelledby="author-stories">
        <div className="section-heading" data-reveal="copy">
          <div><div className="eyebrow">Author archive</div><h2 id="author-stories">Latest reporting</h2></div>
          <a className="text-link" href="/blog">All stories →</a>
        </div>
        <div className="story-grid">
          {posts.map((post, index) => <PostCard post={post} index={index + 1} key={post._id} />)}
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
    </>
  );
}
