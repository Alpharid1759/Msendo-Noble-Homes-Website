// src/app/admin/(panel)/blog/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePost } from "@/app/actions/blog";
import { BlogForm, type EditablePost } from "@/components/admin/BlogForm";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { AdminPageHeader, adminBtnDanger, adminBtnSecondary, Notice } from "@/components/admin/ui";
import { can, requirePermission } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Edit article" };

export default async function EditPostPage({ params, searchParams }: Props) {
  const staff = await requirePermission("blog.view");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createServerSupabase();
  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("blog_categories").select("id, name").order("sort_order"),
  ]);
  if (!post) notFound();
  const live = (post.status === "published" || post.status === "scheduled") && post.published_at && new Date(post.published_at) <= new Date();

  return (
    <>
      <AdminPageHeader
        title={post.title}
        actions={
          <>
            <Link href={`/admin/blog/${id}/preview`} className={adminBtnSecondary}>
              Preview
            </Link>
            {live && (
              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className={adminBtnSecondary}>
                View live
              </a>
            )}
          </>
        }
      />
      {sp.created === "1" && (
        <div className="mb-4">
          <Notice tone="success">Article created.</Notice>
        </div>
      )}
      {can(staff, "blog.write") ? (
        <BlogForm post={post as EditablePost} categories={(categories ?? []) as { id: string; name: string }[]} canPublish={can(staff, "blog.publish")} defaultAuthor={staff.fullName} />
      ) : (
        <Notice>Your role can view articles but not edit them.</Notice>
      )}
      {can(staff, "blog.publish") && (
        <form action={deletePost.bind(null, id)} className="mt-10 border-t border-line pt-6">
          <ConfirmSubmit className={adminBtnDanger} message="Delete this article permanently? Archive it instead if you might need it again.">
            Delete article
          </ConfirmSubmit>
        </form>
      )}
    </>
  );
}
