interface ContainerAdProps { className?: string; }

const nativeAdDocument = '<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><div id="container-152e5ed513be2fb7fe5cb438c57d5af2"></div><script async data-cfasync="false" src="https://pl30709183.effectivecpmnetwork.com/152e5ed513be2fb7fe5cb438c57d5af2/invoke.js"><\/script></body></html>';

export default function ContainerAd({ className = '' }: ContainerAdProps) {
  return <section className={`ad-unit ad-unit--container ${className}`} aria-label="Sponsored content">
    <span className="ad-unit__label">Sponsored content</span>
    <iframe title="Sponsored content" loading="lazy" scrolling="no" sandbox="allow-scripts" srcDoc={nativeAdDocument} style={{ display: 'block', width: '100%', maxWidth: 360, height: 280, margin: '0 auto', border: 0, overflow: 'hidden', background: 'transparent' }} />
  </section>;
}
