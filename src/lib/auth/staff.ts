// src/lib/auth/staff.ts
import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";

export type Permission =
  | "dashboard.view"
  | "properties.view"
  | "properties.create"
  | "properties.edit"
  | "properties.publish"
  | "properties.delete"
  | "properties.export"
  | "media.upload"
  | "media.delete"
  | "enquiries.view"
  | "enquiries.manage"
  | "inspections.view"
  | "inspections.manage"
  | "blog.view"
  | "blog.write"
  | "blog.publish"
  | "newsletter.view"
  | "taxonomy.manage"
  | "settings.manage"
  | "users.manage"
  | "audit.view";

export interface StaffContext {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  permissions: Set<Permission>;
  aal: "aal1" | "aal2";
  hasMfa: boolean;
}

export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const supabase = await createServerSupabase();
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return null;
  const user = userData.user;

  const [{ data: profile }, { data: perms }, { data: aalData }] = await Promise.all([
    supabase.from("staff_profiles").select("full_name, email, role_key, is_active").eq("id", user.id).maybeSingle(),
    supabase.rpc("my_permissions"),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (!profile || !profile.is_active) return null;

  const permissions = new Set<Permission>(
    ((perms ?? []) as unknown[]).map((p) => (typeof p === "string" ? p : (p as { my_permissions: string }).my_permissions)) as Permission[],
  );

  return {
    userId: user.id,
    email: profile.email ?? user.email ?? "",
    fullName: profile.full_name,
    role: profile.role_key,
    permissions,
    aal: (aalData?.currentLevel ?? "aal1") as "aal1" | "aal2",
    hasMfa: aalData?.nextLevel === "aal2",
  };
});

export async function requireStaff(): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!ctx) redirect("/admin/login");
  if (ctx.hasMfa && ctx.aal !== "aal2") redirect("/admin/mfa");
  return ctx;
}

export async function requirePermission(permission: Permission): Promise<StaffContext> {
  const ctx = await requireStaff();
  if (!ctx.permissions.has(permission)) redirect("/admin?denied=1");
  return ctx;
}

export function can(ctx: StaffContext, permission: Permission) {
  return ctx.permissions.has(permission);
}

export class PermissionError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
  }
}

export async function assertPermission(permission: Permission): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!ctx) throw new PermissionError("Your session has expired. Sign in again.");
  if (ctx.hasMfa && ctx.aal !== "aal2") throw new PermissionError("Complete two-step verification first.");
  if (!ctx.permissions.has(permission)) throw new PermissionError();
  return ctx;
}
