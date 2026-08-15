"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

export default function Navbar({
  brand,
  categories,
}: {
  brand: string;
  categories: Category[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 12);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Latest", live: true },
    ...categories.map((category) => ({
      href: `/category/${category.slug}`,
      label: category.name,
    })),
    { href: "/newsletter", label: "Chain Brief" },
  ];

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="utility-bar">
        <div className="wrap">
          <span><b aria-hidden="true">●</b> Live blockchain intelligence</span>
          <span className="utility-edition">Markets · Protocols · Security · Policy</span>
        </div>
      </div>

      <div className="wrap nav news-masthead">
        <div className="news-desk-meta">
          <span>Independent newsroom</span>
          <b>India / Global</b>
        </div>
        <Link className="brand" href="/" prefetch aria-label={`${brand} home`}>
          {brand.toLowerCase()}<span>.</span>
        </Link>
        <div className="news-masthead__actions">
          <Link
            className="header-search"
            href="/blog#journal-search"
            prefetch
            aria-label="Search Kraviona"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <span>Search</span>
          </Link>
          <Link className="header-cta" href="/newsletter" prefetch>
            Get the brief <span aria-hidden="true">→</span>
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`news-primary-wrap${menuOpen ? " is-open" : ""}`}>
        <nav id="mobile-navigation" className="news-primary-nav wrap" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <Link
              href={link.href}
              key={`${link.href}-${link.label}`}
              prefetch
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.live && <b>Live</b>}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
