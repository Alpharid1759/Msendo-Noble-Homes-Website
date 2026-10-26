// src/app/admin/(panel)/layout.tsx
import { ExternalLink, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { AdminMobileNav, AdminSidebar, type AdminNavItem } from "@/components/admin/AdminNav";
import { Logo } from "@/components/site/Logo";
import { can, requireStaff } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const supabase = await createServerSupabase();

  const [newEnquiries, pendingInspections] = await Promise.all([
    can(staff, "enquiries.view")
      ? supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new").then((r) => r.count ?? 0)
      : Promise.resolve(0),
    can(staff, "inspections.view")
      ? supabase.from("inspections").select("id", { count: "exact", head: true }).eq("status", "requested").then((r) => r.count ?? 0)
      : Promise.resolve(0),
  ]);

  const items: AdminNavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" as const },
    ...(can(staff, "properties.view") ? [{ href: "/admin/properties", label: "Properties", icon: "properties" as const }] : []),
    ...(can(staff, "enquiries.view") ? [{ href: "/admin/enquiries", label: "Enquiries", icon: "enquiries" as const, badge: newEnquiries }] : []),
    ...(can(staff, "inspections.view") ? [{ href: "/admin/inspections", label: "Inspections", icon: "inspections" as const, badge: pendingInspections }] : []),
    ...(can(staff, "blog.view") ? [{ href: "/admin/blog", label: "Blog", icon: "blog" as const }] : []),
    ...(can(staff, "newsletter.view") ? [{ href: "/admin/newsletter", label: "Newsletter", icon: "newsletter" as const }] : []),
    ...(can(staff, "taxonomy.manage") ? [{ href: "/admin/taxonomy", label: "Categories and locations", icon: "taxonomy" as const }] : []),
    ...(can(staff, "users.manage") ? [{ href: "/admin/staff", label: "Staff and roles", icon: "staff" as const }] : []),
    ...(can(staff, "settings.manage") ? [{ href: "/admin/settings", label: "Site settings", icon: "settings" as const }] : []),
    ...(can(staff, "audit.view") ? [{ href: "/admin/audit", label: "Audit log", icon: "audit" as const }] : []),
    { href: "/admin/account", label: "My account", icon: "account" as const },
  ];

  return (
    <div className="min-h-dvh bg-ivory lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="on-dark hidden min-h-dvh bg-navy-900 lg:block">
        <div className="sticky top-0">
          <div className="flex h-16 items-center border-b border-white/10 px-5">
            <Link href="/admin" aria-label="Admin dashboard">
              <Logo tone="light" />
            </Link>
          </div>
          <AdminSidebar items={items} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <AdminMobileNav items={items} />
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline sm:inline-flex">
              View website
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              <p className="font-semibold">{staff.fullName}</p>
              <p className="text-xs capitalize text-slate">{staff.role.replace(/_/g, " ")}</p>
            </div>
            <form action={signOut}>
              <button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] px-3 text-sm font-semibold text-navy-800 hover:bg-sand">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
