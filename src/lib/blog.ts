// src/lib/blog.ts
import "server-only";
import { cachedQuery as unstable_cache } from "@/lib/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicSupabase } from "@/lib/supabase/server";
import type { PublicBlogPost } from "@/types/domain";

export const BLOG_PAGE_SIZE = 9;

const LIST_COLUMNS =
  "id, title, slug, excerpt, featured_image_url, featured_image_alt, author_name, category_name, category_slug, tags, published_at, updated_at, reading_minutes";

export type BlogListItem = Omit<PublicBlogPost, "body_html" | "og_image_url" | "seo_title" | "seo_description" | "category_id">;

export const getBlogPosts = unstable_cache(
  async (opts: { page?: number; category?: string; tag?: string; q?: string; limit?: number } = {}) => {
    if (!isSupabaseConfigured()) return { items: [] as BlogListItem[], total: 0, pageCount: 0 };
    const supabase = createPublicSupabase();
    const limit = opts.limit ?? BLOG_PAGE_SIZE;
    const page = opts.page ?? 1;
    let query = supabase.from("public_blog_posts").select(LIST_COLUMNS, { count: "exact" });
    if (opts.category) query = query.eq("category_slug", opts.category);
    if (opts.tag) query = query.contains("tags", [opts.tag]);
    if (opts.q) query = query.textSearch("search_vector", opts.q, { type: "websearch", config: "english" });
    query = query.order("published_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
    const { data, count, error } = await query;
    if (error) return { items: [] as BlogListItem[], total: 0, pageCount: 0 };
    return {
      items: (data ?? []) as unknown as BlogListItem[],
      total: count ?? 0,
      pageCount: Math.ceil((count ?? 0) / limit),
    };
  },
  ["blog-posts"],
  { tags: ["blog"], revalidate: 300 },
);

export const getBlogPost = unstable_cache(
  async (slug: string): Promise<PublicBlogPost | null> => {
    if (!isSupabaseConfigured()) return null;
    const supabase = createPublicSupabase();
    const { data } = await supabase.from("public_blog_posts").select("*").eq("slug", slug).maybeSingle();
    return (data as unknown as PublicBlogPost) ?? null;
  },
  ["blog-post"],
  { tags: ["blog"], revalidate: 300 },
);

export const getRelatedPosts = unstable_cache(
  async (post: { id: string; category_slug: string | null; tags: string[] }, limit = 3): Promise<BlogListItem[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    let query = supabase.from("public_blog_posts").select(LIST_COLUMNS).neq("id", post.id);
    if (post.category_slug) query = query.eq("category_slug", post.category_slug);
    const { data } = await query.order("published_at", { ascending: false }).limit(limit);
    const items = (data ?? []) as unknown as BlogListItem[];
    if (items.length >= limit) return items;
    const more = await supabase
      .from("public_blog_posts")
      .select(LIST_COLUMNS)
      .not("id", "in", `(${[post.id, ...items.map((i) => i.id)].join(",")})`)
      .order("published_at", { ascending: false })
      .limit(limit - items.length);
    return [...items, ...((more.data ?? []) as unknown as BlogListItem[])];
  },
  ["related-posts"],
  { tags: ["blog"], revalidate: 300 },
);

export const getBlogCategories = unstable_cache(
  async (): Promise<{ id: string; name: string; slug: string }[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    const { data } = await supabase.from("blog_categories").select("id, name, slug").order("sort_order");
    return (data ?? []) as { id: string; name: string; slug: string }[];
  },
  ["blog-categories"],
  { tags: ["blog"], revalidate: 3600 },
);

export const getSitemapPosts = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string }[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    const { data } = await supabase.from("public_blog_posts").select("slug, updated_at").limit(5000);
    return (data ?? []) as { slug: string; updated_at: string }[];
  },
  ["sitemap-posts"],
  { tags: ["blog"], revalidate: 3600 },
);

export function buildTableOfContents(html: string) {
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  const used = new Set<string>();
  const withIds = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_m, level: string, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
    let id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "section";
    let n = 2;
    while (used.has(id)) id = `${id}-${n++}`;
    used.add(id);
    headings.push({ id, text, level: Number(level) as 2 | 3 });
    const cleanAttrs = attrs.replace(/\sid="[^"]*"/i, "");
    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
  });
  return { html: withIds, headings };
}
