'use client';
import { useState } from 'react';
import { call } from '../../lib/api';

export default function Login() {
  const [msg, setMsg] = useState(''); const [loading, setLoading] = useState(false);
  return <form className="panel form admin-login" onSubmit={async e => {
    e.preventDefault(); setLoading(true); setMsg('');
    try {
      const data = await call('/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
      if (!['admin', 'editor'].includes(data.user.role)) { setMsg('This account does not have editorial access.'); return; }
      const session = await call('/auth/me');
      if (!['admin', 'editor'].includes(session.user?.role)) throw new Error('Editorial session could not be verified.');
      location.replace(data.user.role === 'admin' ? '/dashboard' : '/guest-posts');
    } catch (x: any) { setMsg(x.message); } finally { setLoading(false); }
  }}><div className="brand" style={{ color: '#181c19', margin: '0 0 34px' }}>kraviona.<small>Editorial studio</small></div><h1>Welcome back</h1><p className="muted">Workspace for Kraviona administrators and guest-post editors.</p><input name="email" type="email" required autoComplete="email" placeholder="Work email"/><input name="password" type="password" required autoComplete="current-password" placeholder="Password"/><button disabled={loading}>{loading ? 'Verifying…' : 'Enter studio'}</button><p role="status">{msg}</p></form>;
}
