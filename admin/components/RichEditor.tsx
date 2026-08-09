"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import { common, createLowlight } from "lowlight";
import { call } from "../lib/api";

const lowlight = createLowlight(common);

export default function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    content: value,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Typography,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Start writing your story…" }),
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: { class: "editor-canvas", "aria-label": "Article body" },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML())
      editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="editor-canvas">Loading editor…</div>;

  const link = () => {
    const previous = editor.getAttributes("link").href || "";
    const url = window.prompt(
      "Destination URL (leave empty to remove)",
      previous,
    );
    if (url === null) return;
    if (!url.trim())
      return void editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .unsetLink()
        .run();
    try {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: new URL(url, "https://kraviona.site").href })
        .run();
    } catch {
      setError("Enter a valid link URL.");
    }
  };
  const upload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setError("Choose a valid image file.");
    if (file.size > 7 * 1024 * 1024)
      return setError("Image must be smaller than 7 MB.");
    setUploading(true);
    setError("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await call("/media/upload", {
          method: "POST",
          body: JSON.stringify({
            dataUri: reader.result,
            folder: "kraviona/posts",
          }),
        });
        editor
          .chain()
          .focus()
          .setImage({ src: result.url, alt: file.name })
          .run();
      } catch (caught: any) {
        setError(caught.message);
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };
  const button = (
    label: string,
    action: () => void,
    active = false,
    disabled = false,
  ) => (
    <button
      type="button"
      className={active ? "active" : ""}
      disabled={disabled}
      onClick={action}
    >
      {label}
    </button>
  );
  const words = editor.storage.characterCount.words();

  return (
    <div className="rich-editor tiptap-editor">
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Formatting tools"
      >
        {button(
          "B",
          () => editor.chain().focus().toggleBold().run(),
          editor.isActive("bold"),
        )}
        {button(
          "I",
          () => editor.chain().focus().toggleItalic().run(),
          editor.isActive("italic"),
        )}
        {button(
          "U",
          () => editor.chain().focus().toggleUnderline().run(),
          editor.isActive("underline"),
        )}
        {button(
          "S",
          () => editor.chain().focus().toggleStrike().run(),
          editor.isActive("strike"),
        )}
        {button(
          "H1",
          () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          editor.isActive("heading", { level: 1 }),
        )}
        {button(
          "H2",
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive("heading", { level: 2 }),
        )}
        {button(
          "H3",
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          editor.isActive("heading", { level: 3 }),
        )}
        {button(
          "• List",
          () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive("bulletList"),
        )}
        {button(
          "1. List",
          () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive("orderedList"),
        )}
        {button(
          "Quote",
          () => editor.chain().focus().toggleBlockquote().run(),
          editor.isActive("blockquote"),
        )}
        {button(
          "Code",
          () => editor.chain().focus().toggleCodeBlock().run(),
          editor.isActive("codeBlock"),
        )}
        {button("Link", link, editor.isActive("link"))}
        {button(
          uploading ? "Uploading…" : "Image",
          () => fileRef.current?.click(),
          false,
          uploading,
        )}
        {button("Table", () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        )}
        {button(
          "Left",
          () => editor.chain().focus().setTextAlign("left").run(),
          editor.isActive({ textAlign: "left" }),
        )}
        {button(
          "Center",
          () => editor.chain().focus().setTextAlign("center").run(),
          editor.isActive({ textAlign: "center" }),
        )}
        {button(
          "Right",
          () => editor.chain().focus().setTextAlign("right").run(),
          editor.isActive({ textAlign: "right" }),
        )}
        {button(
          "Highlight",
          () => editor.chain().focus().toggleHighlight().run(),
          editor.isActive("highlight"),
        )}
        {button(
          "Undo",
          () => editor.chain().focus().undo().run(),
          false,
          !editor.can().undo(),
        )}
        {button(
          "Redo",
          () => editor.chain().focus().redo().run(),
          false,
          !editor.can().redo(),
        )}
        <span className="editor-word-count">{words} words</span>
        <input
          ref={fileRef}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </div>
      <EditorContent editor={editor} />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
