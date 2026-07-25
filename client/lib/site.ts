function normalizeUrl(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, '');
  return `https://${trimmed.replace(/\/$/, '')}`;
}

export const SITE_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || process.env.APP_URL,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://kraviona.site'
);
export const SITE_NAME = 'Kraviona';
export const SITE_DESCRIPTION = 'Independent, deeply researched ideas on technology, growth, modern work, and building durable businesses.';

export function absoluteUrl(path = '/') { return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`; }
export function readingTime(words = 0) { return Math.max(1, Math.ceil(words / 220)); }
export function formatDate(value?: string) { return value ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : ''; }
export function jsonLd(data: unknown) { return JSON.stringify(data).replace(/</g, '\\u003c'); }
export function plainText(html = '') { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
