// src/app/admin/(panel)/blog/[id]/preview/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminBtnSecondary, Notice } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/staff";
import { buildTableOfContents } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { createServerSupabase } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Preview article" };

export default async function PreviewPostPage({ params }: Props) {
  await requirePermission("blog.view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createServerSupabase();
  const { data: post } = await supabase.from("blog_posts").select("*, blog_categories(name)").eq("id", id).maybeSingle();
  if (!post) notFound();
  const { html } = buildTableOfContents(sanitizeArticleHtml(post.body_html));
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Notice tone="warning">Preview. Status: {post.status}.</Notice>
        <Link href={`/admin/blog/${id}`} className={adminBtnSecondary}>
          Back to editing
        </Link>
      </div>
      <article className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-10">
        {post.blog_categories?.name && <p className="text-sm font-semibold text-gold-ink">{post.blog_categories.name}</p>}
        <h1 className="display mt-2 text-[2.5rem] leading-tight text-navy-900">{post.title}</h1>
        {post.excerpt && <p className="mt-3 text-lg text-slate">{post.excerpt}</p>}
        <p className="mt-3 text-sm text-slate">
          {post.author_name}
          {post.published_at ? `, ${formatDate(post.published_at)}` : ""}, {post.reading_minutes} min read
        </p>
        {post.featured_image_url && <img src={post.featured_image_url} alt={post.featured_image_alt ?? ""} className="mt-6 aspect-[16/9] w-full rounded-[var(--radius-card)] object-cover" />}
        <div className="prose-article mt-8" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  );
}
