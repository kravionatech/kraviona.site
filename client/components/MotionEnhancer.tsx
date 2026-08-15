"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function MotionEnhancer() {
  const pathname = usePathname();
  const isArticle = pathname.startsWith("/blog/");

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.remove("motion-enabled");
      return;
    }

    root.classList.add("motion-enabled");
    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const observeItem = (item: Element) => {
      if (item instanceof HTMLElement && item.matches("[data-reveal]"))
        observer.observe(item);
      item
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((child) => observer.observe(child));
    };
    revealItems.forEach((item) => observer.observe(item));
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) =>
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) observeItem(node);
        }),
      );
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      root.style.setProperty("--article-progress", String(progress));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("motion-enabled");
      root.style.removeProperty("--article-progress");
    };
  }, [pathname]);

  return isArticle ? <div className="reading-progress" aria-hidden="true" /> : null;
}
