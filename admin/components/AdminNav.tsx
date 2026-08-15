"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { call } from "../lib/api";
const adminLinks = [
  ["⌂", "Overview", "/dashboard"],
  ["✎", "Stories", "/posts"],
  ["✦", "AI workspace", "/ai-agent"],
  ["#", "Categories", "/categories"],
  ["◇", "Services", "/services"],
  ["↗", "Client enquiries", "/inquiries"],
  ["◌", "Moderation", "/comments"],
  ["◎", "Audience", "/subscribers"],
  ["GE", "Search & GEO", "/crawlers"],
  ["♙", "Users", "/users"],
  ["⚙", "Site settings", "/settings"],
];
export default function AdminNav() {
  const path = usePathname(),
    router = useRouter(),
    [role, setRole] = useState(""),
    [navigating, setNavigating] = useState(false);
  useEffect(() => {
    call("/auth/me")
      .then((x) => setRole(x.user.role))
      .catch(() => {});
  }, []);
  useEffect(() => setNavigating(false), [path]);
  useEffect(() => {
    const warmed = new Set<string>();
    const routeFor = (event: Event) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return null;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return null;
      return href;
    };
    const warm = (event: Event) => {
      const href = routeFor(event);
      if (!href || warmed.has(href)) return;
      warmed.add(href);
      router.prefetch(href);
    };
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;
      const href = routeFor(event);
      if (!href || href === `${location.pathname}${location.search}`) return;
      event.preventDefault();
      setNavigating(true);
      router.push(href);
    };
    document.addEventListener("click", navigate);
    document.addEventListener("pointerover", warm, { passive: true });
    document.addEventListener("focusin", warm);
    return () => {
      document.removeEventListener("click", navigate);
      document.removeEventListener("pointerover", warm);
      document.removeEventListener("focusin", warm);
    };
  }, [router]);
  const links =
    role === "editor"
      ? [["✎", "My guest posts", "/guest-posts"]]
      : [...adminLinks, ["✎", "Guest posting", "/guest-posts"]];
  return (
    <>
      <div className={`admin-route-loader${navigating ? " is-active" : ""}`} role="status" aria-live="polite" aria-hidden={!navigating}>
        <span />
        <small>Opening workspace…</small>
      </div>
      <nav className="menu" aria-label="Studio navigation">
        {links.map((x) => (
          <a
            className={
              path === x[2] || path.startsWith(x[2] + "/") ? "active" : ""
            }
            href={x[2]}
            key={x[2]}
          >
            <i>{x[0]}</i>
            {x[1]}
          </a>
        ))}
      </nav>
      <button
        className="logout-btn"
        onClick={async () => {
          await call("/auth/logout", { method: "POST" });
          location.href = "/login";
        }}
      >
        Sign out
      </button>
    </>
  );
}
