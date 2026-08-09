'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);
const API = (process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api' : 'https://api.kraviona.site/api')).replace(/\/$/, '');

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxWords?: number;
}

export default function TiptapEditor({ content, onChange, placeholder = 'Start writing your article…', maxWords = 2500 }: TiptapEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false), [uploading, setUploading] = useState(false), [error, setError] = useState('');
  const editor = useEditor({
    immediatelyRender: false,
    content,
    extensions: [StarterKit.configure({ codeBlock: false }), Underline, Typography, Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }), Image, Placeholder.configure({ placeholder }), CharacterCount, CodeBlockLowlight.configure({ lowlight }), TextAlign.configure({ types: ['heading', 'paragraph'] }), Highlight],
    editorProps: { attributes: { class: 'canvas', 'aria-label': 'Article content' } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML())
  });
  useEffect(() => { if (editor && content !== editor.getHTML()) editor.commands.setContent(content || '', { emitUpdate: false }); }, [content, editor]);
  if (!editor) return <div className="canvas">Loading rich editor…</div>;
  const words = editor.storage.characterCount.words();
  const link = () => { const current = editor.getAttributes('link').href || ''; const url = window.prompt('Destination URL (leave empty to remove)', current); if (url === null) return; if (!url.trim()) return void editor.chain().focus().extendMarkRange('link').unsetLink().run(); try { editor.chain().focus().extendMarkRange('link').setLink({ href: new URL(url, 'https://kraviona.site').href }).run(); } catch { setError('Enter a valid link URL.'); } };
  const upload = (file?: File) => { if (!file) return; if (!file.type.startsWith('image/') || file.size > 7 * 1024 * 1024) return setError('Choose a JPG, PNG, WebP or AVIF image under 7 MB.'); setUploading(true); setError(''); const reader = new FileReader(); reader.onload = async () => { try { const response = await fetch(`${API}/media/upload`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUri: reader.result, folder: 'kraviona/guest-posts' }) }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error || 'Image upload failed.'); editor.chain().focus().setImage({ src: data.url, alt: file.name }).run(); } catch (caught: any) { setError(caught.message); } finally { setUploading(false); } }; reader.readAsDataURL(file); };
  const tool = (label: string, action: () => void, active = false) => <button type="button" className={active ? 'active' : ''} onClick={action}>{label}</button>;
  return <div className="rich-editor tiptap-editor">
    <div className="toolbar" role="toolbar" aria-label="Rich text formatting">
      {!preview && <>{tool('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}{tool('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}{tool('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}{tool('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}{tool('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}{tool('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}{tool('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}{tool('Quote', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}{tool('Code', () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}{tool('Link', link, editor.isActive('link'))}{tool(uploading ? 'Uploading…' : 'Image', () => fileRef.current?.click())}{tool('Highlight', () => editor.chain().focus().toggleHighlight().run(), editor.isActive('highlight'))}{tool('Undo', () => editor.chain().focus().undo().run())}{tool('Redo', () => editor.chain().focus().redo().run())}</>}
      <button type="button" className="preview-toggle" onClick={() => { setPreview(value => !value); editor.setEditable(preview); }}>{preview ? 'Continue editing' : 'Preview'}</button>
      <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => upload(event.target.files?.[0])}/>
    </div>
    <EditorContent editor={editor}/>
    <div className={`editor-footer ${words >= maxWords ? 'danger-text' : ''}`}><span>{words} / {maxWords} words</span><span>{preview ? 'Read-only preview' : 'Autosynced'}</span></div>
    {error && <p className="notice error" role="alert">{error}</p>}
  </div>;
}
