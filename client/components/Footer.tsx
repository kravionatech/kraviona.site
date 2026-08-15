import Link from "next/link";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

export default function Footer({
  brand,
  description,
  email,
  categories,
}: {
  brand: string;
  description: string;
  email: string;
  categories: Category[];
}) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-top">
        <div className="footer-pitch">
          <Link className="brand brand--light" href="/" prefetch>{brand.toLowerCase()}<span>.</span></Link>
          <p>{description}</p>
        </div>
        <div>
          <span className="footer-label">Follow the chain</span>
          <nav className="footer-nav" aria-label="Footer navigation">
            <Link href="/blog" prefetch>Latest news</Link>
            {categories.slice(0, 4).map((category) => (
              <Link href={`/category/${category.slug}`} key={category._id} prefetch>{category.name}</Link>
            ))}
            <a href="/feed.xml">RSS feed</a>
          </nav>
        </div>
        <div className="footer-company">
          <span className="footer-label">The Chain Brief</span>
          <h3>Track Web3 without living in the feed.</h3>
          <p>One focused blockchain intelligence briefing every week.</p>
          <div className="footer-company__links">
            <Link href="/newsletter" prefetch>Join the briefing →</Link>
            <a href={`mailto:${email}`}>{email}</a>
          </div>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} {brand}</span>
        <span>Independent blockchain and Web3 reporting.</span>
        <a href="/sitemap.xml">Sitemap</a>
      </div>
    </footer>
  );
}
