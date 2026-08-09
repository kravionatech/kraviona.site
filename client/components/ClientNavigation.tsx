"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const documentRoutes = new Set([
  "/feed.xml",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/ai.txt",
]);

export default function ClientNavigation() {
  const router = useRouter();
  useEffect(() => {
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
      if (
        !target ||
        target.hasAttribute("download") ||
        (target.target && target.target !== "_self")
      )
        return;
      const raw = target.getAttribute("href");
      if (
        !raw ||
        raw.startsWith("#") ||
        raw.startsWith("mailto:") ||
        raw.startsWith("tel:")
      )
        return;
      const url = new URL(target.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        documentRoutes.has(url.pathname)
      )
        return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        if (url.hash) return;
        event.preventDefault();
        return;
      }
      event.preventDefault();
      router.push(`${url.pathname}${url.search}${url.hash}`);
    }
    document.addEventListener("click", navigate);
    return () => document.removeEventListener("click", navigate);
  }, [router]);
  return null;
}
