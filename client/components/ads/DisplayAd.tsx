export type DisplayAdSize = '468x60' | '300x250' | '160x300' | '160x600' | '728x90' | '320x50';

const units: Record<DisplayAdSize, { width: number; height: number }> = {
  '468x60': { width: 468, height: 60 }, '300x250': { width: 300, height: 250 }, '160x300': { width: 160, height: 300 }, '160x600': { width: 160, height: 600 }, '728x90': { width: 728, height: 90 }, '320x50': { width: 320, height: 50 }
};

interface DisplayAdProps { size: DisplayAdSize; className?: string; }

export default function DisplayAd({ size, className = '' }: DisplayAdProps) {
  const unit = units[size];
  return <section className={`ad-unit ad-unit--${size} ${className}`} aria-label="Advertisement"><span className="ad-unit__label">Advertisement</span><iframe title="Advertisement" loading="lazy" scrolling="no" sandbox="allow-scripts" src={`/ad/${size}`} width={unit.width} height={unit.height} /></section>;
}
