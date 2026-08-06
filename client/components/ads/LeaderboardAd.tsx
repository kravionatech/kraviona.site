'use client';

import { useEffect, useRef } from 'react';

interface LeaderboardAdProps {
  className?: string;
}

export default function LeaderboardAd({ className = '' }: LeaderboardAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous contents if re-rendered
    containerRef.current.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '90px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';

    containerRef.current.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; }
            </style>
          </head>
          <body>
            <script type="text/javascript">
              atOptions = {
                'key' : '8ba69159b1df1d66276e471747058bac',
                'format' : 'iframe',
                'height' : 90,
                'width' : 728,
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="https://www.highperformanceformat.com/8ba69159b1df1d66276e471747058bac/invoke.js"></script>
          </body>
        </html>
      `);
      iframeDoc.close();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className={`ad-unit ad-unit--leaderboard ${className}`}>
      <div className="ad-unit__label">Advertisement</div>
      <div ref={containerRef} className="ad-unit__container ad-unit__container--728x90" />
    </div>
  );
}
