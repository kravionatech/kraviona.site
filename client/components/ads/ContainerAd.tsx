'use client';

import { useEffect, useRef } from 'react';

interface ContainerAdProps { className?: string; }

/** Keeps the provider's native container script out of the site document. */
export default function ContainerAd({ className = '' }: ContainerAdProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren();

    const iframe = document.createElement('iframe');
    iframe.title = 'Sponsored content';
    iframe.loading = 'lazy';
    iframe.scrolling = 'no';
    iframe.sandbox.add('allow-scripts', 'allow-popups');
    iframe.style.cssText = 'display:block;width:100%;max-width:360px;height:280px;border:0;overflow:hidden;background:transparent;';
    host.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write('<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><div id="container-152e5ed513be2fb7fe5cb438c57d5af2"></div><script async data-cfasync="false" src="https://pl30709183.effectivecpmnetwork.com/152e5ed513be2fb7fe5cb438c57d5af2/invoke.js"><\\/script></body></html>');
      doc.close();
    }
    return () => host.replaceChildren();
  }, []);

  return <section className={`ad-unit ad-unit--container ${className}`} aria-label="Sponsored content"><span className="ad-unit__label">Sponsored content</span><div ref={hostRef} className="ad-unit__container" /></section>;
}
