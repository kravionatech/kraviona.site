interface ContainerAdProps { className?: string; }

export default function ContainerAd({ className = '' }: ContainerAdProps) {
  return <section className={`ad-unit ad-unit--container ${className}`} aria-label="Sponsored content"><span className="ad-unit__label">Sponsored content</span><iframe title="Sponsored content" loading="lazy" scrolling="no" sandbox="allow-scripts allow-same-origin" src="/ad/native" width="360" height="280" /></section>;
}
