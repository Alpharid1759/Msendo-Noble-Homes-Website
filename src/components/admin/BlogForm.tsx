// src/components/admin/BlogForm.tsx
"use client";

import clsx from "clsx";
import { useActionState, useState } from "react";
import { savePost, type BlogFormState } from "@/app/actions/blog";
import { slugify } from "@/lib/format";
import { lagosParts } from "@/lib/inspection-rules";
import { finalizeUpload, IMAGE_TYPES, startResumableUpload } from "@/lib/upload-client";
import { RichTextEditor } from "./RichTextEditor";
import { adminBtnPrimary } from "./ui";

export interface EditablePost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body_html: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  og_image_url: string | null;
  author_name: string | null;
  category_id: string | null;
  tags: string[];
  status: "draft" | "scheduled" | "published" | "archived";
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const p = lagosParts(new Date(iso));
  return `${p.date}T${p.time}`;
}

export function BlogForm({
  post,
  categories,
  canPublish,
  defaultAuthor,
}: {
  post: EditablePost | null;
  categories: { id: string; name: string }[];
  canPublish: boolean;
  defaultAuthor: string;
}) {
  const [state, action, pending] = useActionState<BlogFormState, FormData>(savePost, { status: "idle" });
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [image, setImage] = useState(post?.featured_image_url ?? "");
  const [imgBusy, setImgBusy] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const e = state.fieldErrors ?? {};

  const statuses = canPublish ? (["draft", "scheduled", "published", "archived"] as const) : (["draft"] as const);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]" noValidate>
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="min-w-0 space-y-5">
        {state.status !== "idle" && state.message && (
          <p role={state.status === "error" ? "alert" : "status"} className={clsx("rounded-[var(--radius-control)] px-4 py-3 text-sm", state.status === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success")}>
            {state.message}
          </p>
        )}
        <div>
          <label htmlFor="title" className="field-label">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(ev) => {
              setTitle(ev.target.value);
              if (!slugTouched) setSlug(slugify(ev.target.value));
            }}
            maxLength={200}
            className="field-input text-lg"
            aria-invalid={e.title ? true : undefined}
          />
          {e.title && <p className="field-error">{e.title}</p>}
        </div>
        <div>
          <label htmlFor="slug" className="field-label">
            Web address
          </label>
          <div className="flex items-center gap-1 text-sm text-slate">
            <span>/blog/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(ev) => {
                setSlugTouched(true);
                setSlug(ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              className="field-input"
            />
          </div>
          {e.slug && <p className="field-error">{e.slug}</p>}
        </div>
        <div>
          <label htmlFor="excerpt" className="field-label">
            Summary
          </label>
          <textarea id="excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} rows={2} maxLength={300} className="field-input" />
          <p className="field-hint">Shown on article cards and as the default search description.</p>
        </div>
        <div>
          <p className="field-label" id="body-label">
            Article
          </p>
          <RichTextEditor name="body_html" initialHtml={post?.body_html ?? ""} label="Article body" />
          <p className="field-hint">Use headings to structure longer articles; a table of contents is added automatically when there are three or more.</p>
        </div>
        <fieldset className="space-y-4 rounded-[var(--radius-card)] border border-line bg-white p-5">
          <legend className="px-1 text-sm font-semibold">Search engines and sharing</legend>
          <div>
            <label htmlFor="seo_title" className="field-label">
              SEO title
            </label>
            <input id="seo_title" name="seo_title" defaultValue={post?.seo_title ?? ""} maxLength={70} className="field-input" />
          </div>
          <div>
            <label htmlFor="seo_description" className="field-label">
              Meta description
            </label>
            <textarea id="seo_description" name="seo_description" defaultValue={post?.seo_description ?? ""} rows={2} maxLength={170} className="field-input" />
          </div>
          <div>
            <label htmlFor="og_image_url" className="field-label">
              Social sharing image URL
            </label>
            <input id="og_image_url" name="og_image_url" defaultValue={post?.og_image_url ?? ""} className="field-input" placeholder="Defaults to the featured image" />
          </div>
        </fieldset>
      </div>

      <aside className="space-y-5">
        <div className="space-y-4 rounded-[var(--radius-card)] border border-line bg-white p-5">
          <div>
            <label htmlFor="status" className="field-label">
              Status
            </label>
            <select id="status" name="status" value={status} onChange={(ev) => setStatus(ev.target.value as typeof status)} className="field-input">
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "draft" ? "Draft" : s === "scheduled" ? "Scheduled" : s === "published" ? "Published" : "Archived"}
                </option>
              ))}
            </select>
            {!canPublish && <p className="field-hint">An editor with publishing rights will publish this article.</p>}
          </div>
          {(status === "scheduled" || status === "published") && (
            <div>
              <label htmlFor="published_at" className="field-label">
                {status === "scheduled" ? "Publish on (Abuja time)" : "Publication date"}
              </label>
              <input id="published_at" name="published_at" type="datetime-local" defaultValue={toLocalInput(post?.published_at ?? null)} className="field-input" />
              {e.published_at && <p className="field-error">{e.published_at}</p>}
            </div>
          )}
          <button type="submit" className={`${adminBtnPrimary} w-full`} disabled={pending}>
            {pending ? "Saving" : status === "published" ? "Save and publish" : status === "scheduled" ? "Schedule" : "Save draft"}
          </button>
        </div>

        <div className="space-y-4 rounded-[var(--radius-card)] border border-line bg-white p-5">
          <div>
            <label htmlFor="category_id" className="field-label">
              Category
            </label>
            <select id="category_id" name="category_id" defaultValue={post?.category_id ?? ""} className="field-input">
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tags" className="field-label">
              Tags
            </label>
            <input id="tags" name="tags" defaultValue={post?.tags.join(", ") ?? ""} className="field-input" placeholder="land, maitama, buying" />
            <p className="field-hint">Separate with commas.</p>
          </div>
          <div>
            <label htmlFor="author_name" className="field-label">
              Author name
            </label>
            <input id="author_name" name="author_name" defaultValue={post?.author_name ?? defaultAuthor} className="field-input" />
          </div>
        </div>

        <div className="space-y-3 rounded-[var(--radius-card)] border border-line bg-white p-5">
          <p className="field-label">Featured image</p>
          <input type="hidden" name="featured_image_url" value={image} />
          {image ? <img src={image} alt="" className="aspect-[3/2] w-full rounded-[3px] object-cover" /> : <div className="flex aspect-[3/2] items-center justify-center rounded-[3px] bg-sand text-sm text-slate">No image</div>}
          <label className="block">
            <span className="sr-only">Upload featured image</span>
            <input
              type="file"
              accept={IMAGE_TYPES.join(",")}
              disabled={imgBusy}
              className="block w-full text-sm"
              onChange={async (ev) => {
                const f = ev.target.files?.[0];
                if (!f) return;
                setImgBusy(true);
                setImgError(null);
                try {
                  const h = await startResumableUpload(f, () => undefined);
                  const raw = await h.promise;
                  const res = await finalizeUpload({ rawPath: raw, kind: "blog-image" });
                  if (res.url) setImage(res.url);
                } catch (err) {
                  setImgError(err instanceof Error ? err.message : "Upload failed");
                } finally {
                  setImgBusy(false);
                }
              }}
            />
          </label>
          {imgBusy && <p className="text-xs text-slate">Uploading and optimising</p>}
          {imgError && <p className="field-error">{imgError}</p>}
          {image && (
            <button type="button" className="text-sm font-semibold text-danger" onClick={() => setImage("")}>
              Remove image
            </button>
          )}
          <div>
            <label htmlFor="featured_image_alt" className="field-label">
              Image description (alt text)
            </label>
            <input id="featured_image_alt" name="featured_image_alt" defaultValue={post?.featured_image_alt ?? ""} maxLength={200} className="field-input" />
          </div>
        </div>
      </aside>
    </form>
  );
}
