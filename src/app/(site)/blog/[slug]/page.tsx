// src/app/(site)/blog/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/consent/TrackView";
import { ShareButtons } from "@/components/property/ShareButtons";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { buildTableOfContents, getBlogPost, getRelatedPosts } from "@/lib/blog";
import { publicEnv } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { truncate } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article not found", robots: { index: false } };
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || truncate(post.body_html.replace(/<[^>]+>/g, " "));
  const image = post.og_image_url || post.featured_image_url;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      tags: post.tags,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) notFound();
  const post = await getBlogPost(slug);
  if (!post) notFound();
  const [related, settings] = await Promise.all([getRelatedPosts({ id: post.id, category_slug: post.category_slug, tags: post.tags }), getSettings()]);
  const { html, headings } = buildTableOfContents(sanitizeArticleHtml(post.body_html));
  const url = `${publicEnv.siteUrl}/blog/${post.slug}`;
  const showToc = headings.length >= 3;
  const updated = new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > 86_400_000;

  return (
    <>
      <TrackView event="blog_article_viewed" params={{ article: post.slug }} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt ?? undefined,
          image: post.featured_image_url ? [post.featured_image_url] : undefined,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          author: { "@type": "Person", name: post.author_name },
          publisher: { "@type": "Organization", name: settings.company.brand_name, url: publicEnv.siteUrl },
          mainEntityOfPage: url,
          keywords: post.tags.join(", ") || undefined,
        }}
      />
      <article className="container-page py-10">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, ...(post.category_slug ? [{ label: post.category_name ?? "", href: `/blog?category=${post.category_slug}` }] : []), { label: post.title }]} />
        <header className="mx-auto mt-8 max-w-3xl">
          {post.category_name && <p className="text-sm font-semibold text-gold-ink">{post.category_name}</p>}
          <h1 className="display mt-3 text-[2.25rem] leading-tight text-navy-900 md:text-[3rem]">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-slate">{post.excerpt}</p>}
          <p className="mt-5 text-sm text-slate">
            By <span className="font-semibold text-charcoal">{post.author_name}</span>. Published <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            {updated && (
              <>
                , updated <time dateTime={post.updated_at}>{formatDate(post.updated_at)}</time>
              </>
            )}
            . {post.reading_minutes} min read.
          </p>
        </header>

        {post.featured_image_url && (
          <img src={post.featured_image_url} alt={post.featured_image_alt ?? ""} className="mx-auto mt-8 aspect-[16/9] w-full max-w-5xl rounded-[var(--radius-card)] object-cover" fetchPriority="high" />
        )}

        <div className={`mx-auto mt-10 grid max-w-5xl gap-10 ${showToc ? "lg:grid-cols-[14rem_minmax(0,1fr)]" : ""}`}>
          {showToc && (
            <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-sm font-semibold text-slate">On this page</h2>
              <ol className="mt-3 space-y-2 border-l border-line text-sm">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? "pl-6" : "pl-3"}>
                    <a href={`#${h.id}`} className="text-navy-700 hover:underline">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className={showToc ? "" : "mx-auto w-full max-w-3xl"}>
            <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />
            {post.tags.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
                {post.tags.map((t) => (
                  <li key={t}>
                    <Link href={`/blog?tag=${encodeURIComponent(t)}`} className="inline-flex rounded-[3px] bg-sand px-2.5 py-1 text-sm text-navy-800 hover:bg-gold-soft">
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 border-t border-line pt-6">
              <ShareButtons url={url} title={post.title} />
            </div>
            <div className="mt-10 rounded-[var(--radius-card)] bg-navy-900 p-8 text-white on-dark">
              <h2 className="display text-[1.75rem]">Looking for property in Abuja?</h2>
              <p className="mt-2 text-navy-100">Search our listings or tell our team what you need.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/properties" variant="gold">
                  Explore Properties
                </ButtonLink>
                <ButtonLink href="/contact" variant="outline-light">
                  Speak to Our Team
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related" className="border-t border-line bg-white py-14">
          <div className="container-page">
            <h2 id="related" className="display text-[2rem] text-navy-900">
              Related articles
            </h2>
            <ul className="mt-8 grid gap-8 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <p className="text-sm text-slate">{formatDate(r.published_at)}</p>
                  <h3 className="mt-1 text-lg font-semibold leading-snug">
                    <Link href={`/blog/${r.slug}`} className="hover:underline">
                      {r.title}
                    </Link>
                  </h3>
                  {r.excerpt && <p className="mt-2 line-clamp-2 text-sm text-slate">{r.excerpt}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
