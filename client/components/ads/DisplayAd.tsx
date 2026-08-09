export type DisplayAdSize = '468x60' | '300x250' | '160x300' | '160x600' | '728x90' | '320x50';

const units: Record<DisplayAdSize, { key: string; width: number; height: number }> = {
  '468x60': { key: 'a3da8d93ced1904911334e3b64f16662', width: 468, height: 60 },
  '300x250': { key: '5e779c24fe6f6e12e48dfef48c8ffd6b', width: 300, height: 250 },
  '160x300': { key: 'c13505ff9221c6a5136edca665dd34b5', width: 160, height: 300 },
  '160x600': { key: '94821387308662eedb4a42c5a1a183ef', width: 160, height: 600 },
  '728x90': { key: '8ba69159b1df1d66276e471747058bac', width: 728, height: 90 },
  '320x50': { key: 'aa7f0b2beddfd3e937d6455b0cd5bcbf', width: 320, height: 50 }
};

interface DisplayAdProps { size: DisplayAdSize; className?: string; }

function adDocument(unit: { key: string; width: number; height: number }) {
  return `<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script>window.atOptions={key:'${unit.key}',format:'iframe',height:${unit.height},width:${unit.width},params:{}};<\/script><script src="https://www.highperformanceformat.com/${unit.key}/invoke.js"><\/script></body></html>`;
}

/**
 * Provider code runs in a unique-origin sandbox. It cannot read, redirect, or
 * register click handlers on the Kraviona page.
 */
export default function DisplayAd({ size, className = '' }: DisplayAdProps) {
  const unit = units[size];
  return <section className={`ad-unit ad-unit--${size} ${className}`} aria-label="Advertisement">
    <span className="ad-unit__label">Advertisement</span>
    <iframe title="Advertisement" loading="lazy" scrolling="no" sandbox="allow-scripts" srcDoc={adDocument(unit)} style={{ display: 'block', width: unit.width, maxWidth: '100%', height: unit.height, border: 0, overflow: 'hidden', background: 'transparent' }} />
  </section>;
}
