import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};
export default function NotFound() {
  return (
    <section className="form-page">
      <div className="form">
        <div className="eyebrow">404 · Off the map</div>
        <h1>This page has moved on.</h1>
        <p>
          The blockchain story you were looking for may have a new address. Try the newsroom
          instead.
        </p>
        <a className="btn" href="/blog">
          Browse all stories →
        </a>
      </div>
    </section>
  );
}
