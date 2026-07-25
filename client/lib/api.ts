function normalizeApiUrl(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed.replace(/\/$/, '');
  return `https://${trimmed.replace(/\/$/, '')}`;
}

export const API = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL,
  process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api' : 'https://api.kraviona.site/api'
);

export async function api(path:string, options:RequestInit={}){
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const r = await fetch(`${API}${normalizedPath}`, {
    ...options,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}
