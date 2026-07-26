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

export class ApiError extends Error {
  constructor(public status: number, path: string) {
    super(`API ${status}: ${path}`);
    this.name = 'ApiError';
  }
}

export async function api(path:string, options:RequestInit={}){
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const method = (options.method || 'GET').toUpperCase();
  const attempts = method === 'GET' ? 2 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const r = await fetch(`${API}${normalizedPath}`, {
        ...options,
        ...(method === 'GET' ? { next: { revalidate: 300 } } : { cache: 'no-store' }),
        signal: options.signal || AbortSignal.timeout(12000),
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });
      if (!r.ok) {
        const error = new ApiError(r.status, normalizedPath);
        if (r.status >= 500 && attempt + 1 < attempts) {
          lastError = error;
          continue;
        }
        throw error;
      }
      return r.json();
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError || attempt + 1 >= attempts) throw error;
    }
  }

  throw lastError;
}
