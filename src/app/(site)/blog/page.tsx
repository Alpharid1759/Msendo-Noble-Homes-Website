// src/app/(site)/blog/page.tsx
import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { Pagination } from "@/components/site/Pagination";
import { getBlogCategories, getBlogPosts } from "@/lib/blog";
import { formatDate } from "@/lib/format";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Boolean(one(sp.category) || one(sp.tag) || one(sp.q) || one(sp.page));
  return {
    title: "Property Insights and Guides",
    description: "Guides to buying, renting, land documentation, property management and investment in Abuja from Msendo Noble Homes.",
    alternates: { canonical: "/blog" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogIndex({ searchParams }: Props) {
  const sp = await searchParams;
  const category = one(sp.category)?.match(/^[a-z0-9-]{1,80}$/)?.[0];
  const tag = one(sp.tag)?.slice(0, 40);
  const q = one(sp.q)?.slice(0, 100);
  const page = Math.max(1, Math.min(200, Number(one(sp.page)) || 1));
  const [posts, categories] = await Promise.all([getBlogPosts({ page, category, tag, q }), getBlogCategories()]);

  const qs = (overrides: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const all: Record<string, string | number | undefined> = { category, tag, q, ...overrides };
    for (const [k, v] of Object.entries(all)) if (v !== undefined && v !== "" && !(k === "page" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  return (
    <>
      <PageHeader
        title="Insights and guides"
        crumbs={[{ label: "Blog" }]}
        intro={<p>Practical guidance on buying, renting, land documentation, property management and investing in Abuja.</p>}
      />
      <div className="container-page py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Article categories" className="-mx-1 overflow-x-auto">
            <ul className="flex min-w-max gap-1 px-1">
              <li>
                <Link href="/blog" aria-current={!category ? "page" : undefined} className={clsx("inline-flex min-h-10 items-center rounded-[var(--radius-control)] px-3 text-sm font-semibold", !category ? "bg-navy-800 text-white" : "text-accent hover:bg-sand")}>
                  All
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/blog?category=${c.slug}`}
                    aria-current={category === c.slug ? "page" : undefined}
                    className={clsx("inline-flex min-h-10 items-center rounded-[var(--radius-control)] px-3 text-sm font-semibold", category === c.slug ? "bg-navy-800 text-white" : "text-accent hover:bg-sand")}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <form action="/blog" method="get" role="search" className="flex gap-2">
            {category && <input type="hidden" name="category" value={category} />}
            <label htmlFor="blog-q" className="sr-only">
              Search articles
            </label>
            <input id="blog-q" name="q" type="search" defaultValue={q} placeholder="Search articles" className="field-input h-10 min-h-10 w-56" />
            <button type="submit" className="min-h-10 rounded-[var(--radius-control)] bg-navy-800 px-4 text-sm font-semibold text-white">
              Search
            </button>
          </form>
        </div>

        {tag && (
          <p className="mt-6 text-sm">
            Showing articles tagged <strong>{tag}</strong>.{" "}
            <Link href={qs({ tag: undefined, page: undefined })} className="font-semibold text-accent underline">
              Clear tag
            </Link>
          </p>
        )}

        {posts.items.length === 0 ? (
          <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-navy-200 bg-surface p-10 text-center">
            <h2 className="text-lg font-semibold">{q || category || tag ? "No articles match" : "Articles are on the way"}</h2>
            <p className="mt-2 text-slate">
              {q || category || tag ? "Try another search or category." : "Subscribe to the newsletter in the footer to hear when we publish."}
            </p>
          </div>
        ) : (
          <ul className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {posts.items.map((post, i) => (
              <li key={post.id}>
                <article>
                  {post.featured_image_url ? (
                    <img src={post.featured_image_url} alt={post.featured_image_alt ?? ""} loading={i < 3 ? "eager" : "lazy"} className="aspect-[3/2] w-full rounded-[var(--radius-card)] object-cover" />
                  ) : (
                    <div className="aspect-[3/2] w-full rounded-[var(--radius-card)] bg-navy-900" aria-hidden="true" />
                  )}
                  <p className="mt-4 text-sm text-slate">
                    {post.category_name ?? "Insights"}, {formatDate(post.published_at)}, {post.reading_minutes} min read
                  </p>
                  <h2 className="mt-1 text-xl font-semibold leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && <p className="mt-2 line-clamp-3 leading-relaxed text-slate">{post.excerpt}</p>}
                </article>
              </li>
            ))}
          </ul>
        )}

        <Pagination page={page} pageCount={posts.pageCount} hrefFor={(p) => qs({ page: p })} />
      </div>
    </>
  );
}
