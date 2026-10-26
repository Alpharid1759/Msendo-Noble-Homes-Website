// src/app/actions/staff.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/staff";
import { publicEnv } from "@/lib/env";
import type { FormState } from "@/lib/form-state";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const ROLES = ["super_admin", "admin", "property_manager", "listing_editor", "content_editor", "support_officer"] as const;

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  full_name: z.string().trim().min(2, "Enter the person's name").max(120),
  role_key: z.enum(ROLES),
  job_title: z.string().trim().max(80).optional(),
  is_agent: z.literal("on").optional(),
});

export interface InviteState extends FormState {
  inviteLink?: string;
}

export async function inviteStaff(_prev: InviteState, form: FormData): Promise<InviteState> {
  try {
    await assertPermission("users.manage");
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Not allowed." };
  }
  const parsed = inviteSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
    return { status: "error", fieldErrors: fe, values: Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) };
  }
  const input = parsed.data;
  const service = createServiceSupabase();
  const redirectTo = `${publicEnv.siteUrl}/auth/confirm?next=/admin/reset-password`;

  let userId: string | null = null;
  let inviteLink: string | undefined;
  const invited = await service.auth.admin.inviteUserByEmail(input.email, { redirectTo, data: { full_name: input.full_name } });
  if (invited.data.user) {
    userId = invited.data.user.id;
  } else {
    const link = await service.auth.admin.generateLink({ type: "invite", email: input.email, options: { redirectTo } });
    if (link.data.user) {
      userId = link.data.user.id;
      inviteLink = link.data.properties?.action_link;
    } else {
      return { status: "error", message: invited.error?.message.includes("already") ? "An account with this email already exists. Ask a developer to link it, or use a different email." : "The invitation could not be created. Check the email address and try again." };
    }
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("staff_profiles").insert({
    id: userId,
    email: input.email,
    full_name: input.full_name,
    role_key: input.role_key,
    job_title: input.job_title || null,
    is_agent: input.is_agent === "on",
  });
  if (error) {
    return { status: "error", message: error.code === "42501" ? error.message : error.code === "23505" ? "This person is already a staff member." : "The staff profile could not be created." };
  }
  revalidatePath("/admin/staff");
  return {
    status: "success",
    message: inviteLink
      ? "Staff member added. The invitation email could not be sent, so share this one-time link with them securely:"
      : `Invitation sent to ${input.email}. They will set a password from the email link.`,
    inviteLink,
  };
}

const updateSchema = z.object({
  id: z.uuid(),
  role_key: z.enum(ROLES),
  is_active: z.literal("on").optional(),
  is_agent: z.literal("on").optional(),
  job_title: z.string().trim().max(80).optional(),
});

export async function updateStaff(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await assertPermission("users.manage");
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Not allowed." };
  }
  const parsed = updateSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { status: "error", message: "Invalid details." };
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("staff_profiles")
    .update({ role_key: parsed.data.role_key, is_active: parsed.data.is_active === "on", is_agent: parsed.data.is_agent === "on", job_title: parsed.data.job_title || null })
    .eq("id", parsed.data.id);
  if (error) return { status: "error", message: error.code === "42501" ? error.message : "Could not update this staff member." };
  const service = createServiceSupabase();
  await service.auth.admin.updateUserById(parsed.data.id, { ban_duration: parsed.data.is_active === "on" ? "none" : "876000h" });
  revalidatePath("/admin/staff");
  return { status: "success", message: "Saved." };
}
