const origin = (process.env.KRAVIONA_API_URL || 'http://localhost:4000').replace(/\/$/, '').replace(/\/api$/, '');
export class KravionaApi {
  cookie = '';
  async login() {
    const email = process.env.KRAVIONA_ADMIN_EMAIL, password = process.env.KRAVIONA_ADMIN_PASSWORD;
    if (!email || !password) throw new Error('Set KRAVIONA_ADMIN_EMAIL and KRAVIONA_ADMIN_PASSWORD');
    const response = await fetch(`${origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Login failed (${response.status})`);
    if (data.user?.role !== 'admin') throw new Error('Configured account is not an administrator');
    const cookies = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''];
    this.cookie = cookies.map(value => value.split(';')[0]).filter(Boolean).join('; ');
  }
  async request(path, options = {}, authenticated = true, retry = true) {
    if (authenticated && !this.cookie) await this.login();
    const response = await fetch(`${origin}/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(authenticated && this.cookie ? { Cookie: this.cookie } : {}), ...options.headers } });
    if (response.status === 401 && authenticated && retry) { this.cookie = ''; await this.login(); return this.request(path, options, authenticated, false); }
    const data = response.status === 204 ? { ok: true } : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Kraviona API ${response.status}`);
    return data;
  }
  health = async () => { const r=await fetch(`${origin}/health`);if(!r.ok)throw new Error(`Health check failed (${r.status})`);return r.json(); };
}
export const api = new KravionaApi();
