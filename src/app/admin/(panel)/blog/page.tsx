// src/app/admin/(panel)/blog/page.tsx
import Link from "next/link";
import { AdminPageHeader, adminBtnPrimary, EmptyState, Notice, Pill, statusTone, Table, Td, Th } from "@/components/admin/ui";
import { can, requirePermission } from "@/lib/auth/staff";
import { formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Blog" };

function isLive(p: { status: string; published_at: string | null }) {
  return (p.status === "published" || p.status === "scheduled") && Boolean(p.published_at) && new Date(p.published_at as string).getTime() <= Date.now();
}

export default async function AdminBlogPage({ searchParams }: Props) {
  const staff = await requirePermission("blog.view");
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, published_at, updated_at, author_name, blog_categories(name)")
    .order("updated_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as { id: string; title: string; slug: string; status: string; published_at: string | null; updated_at: string; author_name: string | null; blog_categories: { name: string } | null }[];

  return (
    <>
      <AdminPageHeader
        title="Blog and insights"
        actions={
          can(staff, "blog.write") ? (
            <Link href="/admin/blog/new" className={adminBtnPrimary}>
              New article
            </Link>
          ) : undefined
        }
      />
      {sp.deleted === "1" && (
        <div className="mb-4">
          <Notice tone="success">Article deleted.</Notice>
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState title="No articles yet">Guides on buying, renting and land documentation help visitors and search engines find you.</EmptyState>
      ) : (
        <Table caption="Articles">
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Publish date</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const live = isLive(p);
              return (
                <tr key={p.id} className="hover:bg-ivory">
                  <Td>
                    <Link href={`/admin/blog/${p.id}`} className="font-semibold text-navy-900 hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate">{p.author_name ?? ""}</p>
                  </Td>
                  <Td className="text-slate">{p.blog_categories?.name ?? "None"}</Td>
                  <Td>
                    <Pill tone={statusTone(live ? "published" : p.status)}>{live ? "live" : p.status}</Pill>
                  </Td>
                  <Td className="whitespace-nowrap text-slate">{p.published_at ? formatDateTime(p.published_at) : "Not set"}</Td>
                  <Td className="whitespace-nowrap text-slate">{formatDateTime(p.updated_at)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
