'use client';

import { useEffect, useRef, useState } from 'react';

const API = (process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api' : 'https://api.kraviona.site/api')).replace(/\/$/, '');
const emptyForm = { title: '', category: '', content: '', excerpt: '' };

async function call(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

function countExternalLinks(html: string) {
  return [...String(html || '').matchAll(/<a\b[^>]*\bhref=["']((?:https?:)?\/\/[^"']+)["']/gi)]
    .map(match => match[1])
    .filter(url => { try { return !new URL(url, 'https://editor.kraviona.site').hostname.endsWith('kraviona.site'); } catch { return false; } }).length;
}

export default function Editor() {
  const [me, setMe] = useState<any>(), [posts, setPosts] = useState<any[]>([]), [cats, setCats] = useState<any[]>([]);
  const [message, setMessage] = useState(''), [form, setForm] = useState(emptyForm), [login, setLogin] = useState(false), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const current = await call('/auth/me');
    if (current.user.role !== 'editor') throw new Error('This portal is for approved editor accounts only.');
    setMe(current.user);
    const [ownPosts, categories] = await Promise.all([call('/guest-posts?status=all'), call('/categories')]);
    setPosts(ownPosts); setCats(categories);
  };

  useEffect(() => { load().catch(() => setLogin(true)).finally(() => setLoading(false)); }, []);

  const execute = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setForm(current => ({ ...current, content: editorRef.current?.innerHTML || '' }));
  };

  const save = async (status: 'draft' | 'submitted') => {
    const count = countExternalLinks(form.content), limit = me?.backlinkLimit || 0;
    if (count > limit) { setMessage(`This article has ${count} external links, but your approved limit is ${limit}. Remove ${count - limit} link(s) or ask an administrator to increase your allowance.`); return; }
    setSaving(true); setMessage('');
    try {
      await call('/guest-posts', { method: 'POST', body: JSON.stringify({ ...form, authorName: me.name, authorEmail: me.email, status }) });
      setMessage(status === 'submitted' ? 'Submitted for editorial review.' : 'Draft saved.'); setForm(emptyForm); if (editorRef.current) editorRef.current.innerHTML = ''; await load();
    } catch (error: any) { setMessage(error.message); } finally { setSaving(false); }
  };

  if (loading) return <main className="shell"><p className="muted">Loading editor…</p></main>;
  if (login) return <main className="shell login"><div className="brand">kraviona<span>.</span> editor</div><div className="panel"><h1>Editor login</h1><p className="muted">Only administrator-approved editors can enter this portal.</p><form onSubmit={async event => { event.preventDefault(); setMessage(''); try { await call('/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); await load(); setLogin(false); } catch (error: any) { setLogin(true); setMessage(error.message); } }}><input name="email" type="email" placeholder="Email" required/><input name="password" type="password" placeholder="Password" required/><button>Sign in</button><p className="warn" role="status">{message}</p></form><p className="muted">Need access? Request an account at <a href="https://kraviona.site/guest-posting">kraviona.site/guest-posting</a>.</p></div></main>;

  const count = countExternalLinks(form.content), limit = me?.backlinkLimit || 0;
  return <main className="shell"><div className="brand">kraviona<span>.</span> editor</div><div className="top"><div><h1>My articles</h1><p className="muted">Only your own drafts and submissions are shown here.</p></div><button className="ghost" onClick={async () => { await call('/auth/logout', { method: 'POST' }); setMe(undefined); setLogin(true); }}>Sign out</button></div><div className="grid"><section className="panel"><h2>Write article</h2><input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Article title"/><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}><option value="">Choose a category</option>{cats.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}</select><input value={form.excerpt} onChange={event => setForm({ ...form, excerpt: event.target.value })} placeholder="Short summary"/><div className="toolbar"><button type="button" onClick={() => execute('bold')}>Bold</button><button type="button" onClick={() => execute('italic')}>Italic</button><button type="button" onClick={() => execute('formatBlock', '<h2>')}>Heading</button><button type="button" onClick={() => execute('insertUnorderedList')}>List</button><button type="button" onClick={() => { const url = prompt('Paste the full link URL'); if (url) execute('createLink', url); }}>Add link</button></div><div className="canvas" ref={editorRef} contentEditable suppressContentEditableWarning onInput={event => setForm({ ...form, content: event.currentTarget.innerHTML })}/><p className={count >= limit && limit > 0 ? 'warn' : ''}>External links: {count} / approved allowance: {limit}{count === limit && limit > 0 ? ' — allowance reached.' : ''}</p><div><button disabled={saving} onClick={() => save('draft')}>Save draft</button><button className="ghost" disabled={saving} onClick={() => save('submitted')}>{saving ? 'Saving…' : 'Submit for review'}</button></div><p role="status">{message}</p></section><aside className="panel"><h2>Your editor allowance</h2><p><b>{limit}</b> external link{limit === 1 ? '' : 's'} per article.</p><p className="muted">The administrator controls this allowance. You cannot raise it from the editor portal.</p></aside></div><section className="panel"><h2>My submissions</h2>{posts.map(post => <div className="row" key={post._id}><div><b>{post.title}</b><br/><span className="muted">{post.category?.name || 'No category'} · {post.backlinkCount || 0} external links · {new Date(post.createdAt).toLocaleDateString()}</span></div><span className="status">{post.status}</span></div>)}{!posts.length && <p className="muted">No articles yet.</p>}</section></main>;
}
