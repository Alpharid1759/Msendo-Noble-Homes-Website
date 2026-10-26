// src/app/admin/(panel)/blog/new/page.tsx
import { BlogForm } from "@/components/admin/BlogForm";
import { AdminPageHeader } from "@/components/admin/ui";
import { can, requirePermission } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "New article" };

export default async function NewPostPage() {
  const staff = await requirePermission("blog.write");
  const supabase = await createServerSupabase();
  const { data: categories } = await supabase.from("blog_categories").select("id, name").order("sort_order");
  return (
    <>
      <AdminPageHeader title="New article" />
      <BlogForm post={null} categories={(categories ?? []) as { id: string; name: string }[]} canPublish={can(staff, "blog.publish")} defaultAuthor={staff.fullName} />
    </>
  );
}
