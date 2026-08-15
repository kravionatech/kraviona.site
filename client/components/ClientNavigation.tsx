"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const documentRoutes = new Set([
  "/feed.xml",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/ai.txt",
  "/news-sitemap.xml",
]);

export default function ClientNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const prefetched = useRef(new Set<string>());

  useEffect(() => {
    setNavigating(false);
    document.documentElement.classList.remove("route-pending");
  }, [pathname, searchParams]);

  useEffect(() => {
    let fallbackTimer = 0;
    const internalUrl = (anchor: HTMLAnchorElement) => {
      const raw = anchor.getAttribute("href");
      if (
        !raw ||
        raw.startsWith("#") ||
        raw.startsWith("mailto:") ||
        raw.startsWith("tel:") ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return null;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || documentRoutes.has(url.pathname))
        return null;
      return url;
    };

    function warmRoute(event: Event) {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!target) return;
      const url = internalUrl(target);
      if (!url) return;
      const route = `${url.pathname}${url.search}`;
      if (prefetched.current.has(route)) return;
      prefetched.current.add(route);
      router.prefetch(route);
    }

    function navigate(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!target) return;
      const url = internalUrl(target);
      if (!url) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        if (url.hash) return;
        event.preventDefault();
        return;
      }
      event.preventDefault();
      setNavigating(true);
      document.documentElement.classList.add("route-pending");
      window.clearTimeout(fallbackTimer);
      fallbackTimer = window.setTimeout(() => {
        setNavigating(false);
        document.documentElement.classList.remove("route-pending");
      }, 8000);
      router.push(`${url.pathname}${url.search}${url.hash}`);
    }

    const idle = window.setTimeout(() => {
      ["/", "/blog", "/newsletter"].forEach((route) => {
        prefetched.current.add(route);
        router.prefetch(route);
      });
    }, 800);
    document.addEventListener("click", navigate);
    document.addEventListener("pointerover", warmRoute, { passive: true });
    document.addEventListener("focusin", warmRoute);
    document.addEventListener("touchstart", warmRoute, { passive: true });
    return () => {
      window.clearTimeout(idle);
      window.clearTimeout(fallbackTimer);
      document.removeEventListener("click", navigate);
      document.removeEventListener("pointerover", warmRoute);
      document.removeEventListener("focusin", warmRoute);
      document.removeEventListener("touchstart", warmRoute);
    };
  }, [router]);
  return (
    <div
      className={`route-loader${navigating ? " is-active" : ""}`}
      role="status"
      aria-live="polite"
      aria-hidden={!navigating}
    >
      <div className="route-loader__bar" />
      <div className="route-loader__label">
        <span /><span /><span /> Loading next block
      </div>
    </div>
  );
}
