export type DisplayAdSize = '468x60' | '300x250' | '160x300' | '160x600' | '728x90' | '320x50';

interface DisplayAdProps { size: DisplayAdSize; className?: string; }

/**
 * Third-party provider scripts are intentionally disabled.
 * They caused client-side crashes and click hijacking on the host site.
 * The component remains so ad placement can be restored with a safe provider later.
 */
export default function DisplayAd(_: DisplayAdProps) {
  return null;
}
