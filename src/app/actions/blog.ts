// src/app/actions/blog.ts
"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { assertPermission, PermissionError } from "@/lib/auth/staff";
import { readingMinutes, slugify } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { createServerSupabase } from "@/lib/supabase/server";
import { blogSchema } from "@/lib/validation/admin";
import { fieldErrors } from "@/lib/validation/public-forms";

export interface BlogFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function savePost(_prev: BlogFormState, form: FormData): Promise<BlogFormState> {
  const id = String(form.get("id") ?? "") || null;
  let staff;
  try {
    staff = await assertPermission("blog.write");
  } catch (e) {
    return { status: "error", message: e instanceof PermissionError ? e.message : "Not allowed." };
  }
  const raw = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = blogSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", message: "Some fields need attention.", fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  if ((input.status === "published" || input.status === "scheduled") && !staff.permissions.has("blog.publish")) {
    return { status: "error", message: "Your role can save drafts but not publish. Ask an editor to publish." };
  }

  const body = sanitizeArticleHtml(input.body_html);
  let publishedAt: string | null = input.published_at ? new Date(`${input.published_at}:00+01:00`).toISOString() : null;
  if (input.status === "published" && !publishedAt) publishedAt = new Date().toISOString();
  if (input.status === "scheduled" && publishedAt && new Date(publishedAt) <= new Date()) {
    return { status: "error", fieldErrors: { published_at: "Choose a future time, or publish now" } };
  }

  const supabase = await createServerSupabase();
  let slug = input.slug ?? slugify(input.title);
  if (!input.slug) {
    const { data: clash } = await supabase.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (clash && clash.id !== id) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const row = {
    title: input.title,
    slug,
    excerpt: input.excerpt,
    body_html: body,
    featured_image_url: input.featured_image_url,
    featured_image_alt: input.featured_image_alt,
    og_image_url: input.og_image_url,
    author_name: input.author_name,
    category_id: input.category_id,
    tags: input.tags,
    status: input.status,
    published_at: publishedAt,
    reading_minutes: readingMinutes(body),
    seo_title: input.seo_title,
    seo_description: input.seo_description,
  };

  let postId = id;
  if (id) {
    const { error } = await supabase.from("blog_posts").update(row).eq("id", id);
    if (error) return { status: "error", message: error.code === "23505" ? "That slug is already used." : error.code === "42501" ? error.message : "Could not save the article." };
  } else {
    const { data, error } = await supabase.from("blog_posts").insert({ ...row, author_id: staff.userId }).select("id").single();
    if (error) return { status: "error", message: error.code === "23505" ? "That slug is already used." : error.code === "42501" ? error.message : "Could not save the article." };
    postId = data.id;
  }

  revalidateTag("blog", { expire: 0 });
  if (!id) redirect(`/admin/blog/${postId}?created=1`);
  return { status: "success", message: input.status === "published" ? "Published." : input.status === "scheduled" ? "Scheduled." : "Saved." };
}

export async function deletePost(id: string) {
  await assertPermission("blog.publish");
  const supabase = await createServerSupabase();
  await supabase.from("blog_posts").delete().eq("id", id);
  revalidateTag("blog", { expire: 0 });
  redirect("/admin/blog?deleted=1");
}
