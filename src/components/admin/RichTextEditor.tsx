// src/components/admin/RichTextEditor.tsx
"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Undo2 } from "lucide-react";
import { useRef, useState } from "react";
import { finalizeUpload, IMAGE_TYPES, startResumableUpload } from "@/lib/upload-client";

export function RichTextEditor({ name, initialHtml, label }: { name: string; initialHtml: string; label: string }) {
  const [html, setHtml] = useState(initialHtml);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
      Link.configure({ openOnClick: false, autolink: true, protocols: ["https", "mailto", "tel"] }),
      Image.configure({ inline: false }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "tiptap-content prose-article min-h-[24rem] px-4 py-3",
        "aria-label": label,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: e }) => setHtml(e.getHTML()),
  });

  const btn = (active: boolean) =>
    clsx("inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-navy-800 hover:bg-sand disabled:opacity-40", active && "bg-navy-100");

  const addLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address (https://…)", prev ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else if (/^(https:\/\/|mailto:|tel:|\/)/.test(url)) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    else setError("Links must start with https://, mailto:, tel: or /");
  };

  const uploadImage = async (file: File) => {
    if (!editor) return;
    setError(null);
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Use a JPEG, PNG, WebP or AVIF image.");
      return;
    }
    setUploading(true);
    try {
      const h = await startResumableUpload(file, () => undefined);
      const raw = await h.promise;
      const res = await finalizeUpload({ rawPath: raw, kind: "blog-image" });
      const alt = window.prompt("Describe the image for screen readers (alt text)", "") ?? "";
      if (res.url) editor.chain().focus().setImage({ src: res.url, alt }).run();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="hidden" name={name} value={html} />
      <div className="overflow-hidden rounded-[var(--radius-control)] border border-line bg-white focus-within:border-navy-700">
        <div className="flex flex-wrap gap-0.5 border-b border-line bg-ivory p-1" role="toolbar" aria-label="Formatting">
          <button type="button" className={btn(!!editor?.isActive("heading", { level: 2 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading">
            <Heading2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(!!editor?.isActive("heading", { level: 3 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Subheading">
            <Heading3 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(!!editor?.isActive("bold"))} onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="Bold">
            <Bold className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(!!editor?.isActive("italic"))} onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="Italic">
            <Italic className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(!!editor?.isActive("bulletList"))} onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label="Bulleted list">
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(!!editor?.isActive("orderedList"))} onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label="Numbered list">
            <ListOrdered className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(!!editor?.isActive("blockquote"))} onClick={() => editor?.chain().focus().toggleBlockquote().run()} aria-label="Quote">
            <Quote className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(!!editor?.isActive("link"))} onClick={addLink} aria-label="Link">
            <Link2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(false)} onClick={() => editor?.chain().focus().setHorizontalRule().run()} aria-label="Divider">
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(false)} onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Insert image">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="mx-1 w-px bg-line" aria-hidden="true" />
          <button type="button" className={btn(false)} onClick={() => editor?.chain().focus().undo().run()} aria-label="Undo">
            <Undo2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={btn(false)} onClick={() => editor?.chain().focus().redo().run()} aria-label="Redo">
            <Redo2 className="h-4 w-4" aria-hidden="true" />
          </button>
          {uploading && <span className="ml-2 self-center text-xs text-slate">Uploading image</span>}
        </div>
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadImage(f);
          e.target.value = "";
        }}
      />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
