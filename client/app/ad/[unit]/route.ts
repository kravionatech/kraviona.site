import { NextRequest } from 'next/server';

const units = {
  '468x60': { key: 'a3da8d93ced1904911334e3b64f16662', width: 468, height: 60 },
  '300x250': { key: '5e779c24fe6f6e12e48dfef48c8ffd6b', width: 300, height: 250 },
  '160x300': { key: 'c13505ff9221c6a5136edca665dd34b5', width: 160, height: 300 },
  '160x600': { key: '94821387308662eedb4a42c5a1a183ef', width: 160, height: 600 },
  '728x90': { key: '8ba69159b1df1d66276e471747058bac', width: 728, height: 90 },
  '320x50': { key: 'aa7f0b2beddfd3e937d6455b0cd5bcbf', width: 320, height: 50 },
  native: null
} as const;

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ unit: string }> }) {
  const { unit: name } = await params;
  const unit = units[name as keyof typeof units];
  if (unit === undefined) return new Response('Not found', { status: 404 });
  const body = unit
    ? `<script>window.atOptions={key:'${unit.key}',format:'iframe',height:${unit.height},width:${unit.width},params:{}};<\/script><script src="https://www.highperformanceformat.com/${unit.key}/invoke.js"><\/script>`
    : '<div id="container-152e5ed513be2fb7fe5cb438c57d5af2"></div><script async data-cfasync="false" src="https://pl30709183.effectivecpmnetwork.com/152e5ed513be2fb7fe5cb438c57d5af2/invoke.js"><\/script>';
  return new Response(`<!doctype html><html><head><meta name="robots" content="noindex,nofollow"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}body{display:flex;justify-content:center;align-items:flex-start}</style></head><body>${body}</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'private, no-store' } });
}
