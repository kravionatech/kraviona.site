'use client';

interface DirectLinkAdProps {
  title?: string;
  description?: string;
  buttonText?: string;
  className?: string;
  variant?: 'card' | 'banner' | 'button' | 'sidebar';
}

export default function DirectLinkAd({
  title = 'Featured Recommendation',
  description = 'Discover top curated offers, tools, and insights from our verified network partners.',
  buttonText = 'Explore Offer ↗',
  className = '',
  variant = 'card',
}: DirectLinkAdProps) {
  const adUrl = 'https://www.effectivecpmnetwork.com/rpn69gan?key=2b06f18d099a81d3a10cf358d860c9a5';

  if (variant === 'button') {
    return (
      <a
        href={adUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`ad-direct-button ${className}`}
      >
        <span>{buttonText}</span>
      </a>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`ad-direct-sidebar ${className}`}>
        <span className="ad-unit__label">Promoted</span>
        <h4>{title}</h4>
        <p>{description}</p>
        <a
          href={adUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ad-direct-sidebar__link"
        >
          {buttonText}
        </a>
      </div>
    );
  }

  return (
    <div className={`ad-unit ad-unit--direct-card ad-unit--variant-${variant} ${className}`}>
      <div className="ad-unit__label">Sponsored Link</div>
      <div className="ad-direct-card__body">
        <div className="ad-direct-card__info">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <a
          href={adUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ad-direct-card__cta"
        >
          {buttonText}
        </a>
      </div>
    </div>
  );
}
