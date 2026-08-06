'use client';

import { useEffect, useRef } from 'react';

interface ContainerAdProps {
  className?: string;
}

export default function ContainerAd({ className = '' }: ContainerAdProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerId = 'container-152e5ed513be2fb7fe5cb438c57d5af2';

  useEffect(() => {
    if (!wrapperRef.current) return;

    // Remove existing target container element if re-rendering
    wrapperRef.current.innerHTML = '';

    // Create container div expected by EffectiveCPM script
    const containerDiv = document.createElement('div');
    containerDiv.id = containerId;
    wrapperRef.current.appendChild(containerDiv);

    // Create & append external invoke.js script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl30709183.effectivecpmnetwork.com/152e5ed513be2fb7fe5cb438c57d5af2/invoke.js';

    wrapperRef.current.appendChild(script);

    return () => {
      if (wrapperRef.current) {
        wrapperRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className={`ad-unit ad-unit--container ${className}`}>
      <div className="ad-unit__label">Sponsored Content</div>
      <div ref={wrapperRef} className="ad-unit__container" />
    </div>
  );
}
