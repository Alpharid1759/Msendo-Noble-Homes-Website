// src/app/actions/enquiries.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/staff";
import type { FormState } from "@/lib/form-state";
import { createServerSupabase } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "contacted", "inspection_scheduled", "in_progress", "converted", "closed", "spam"]),
  assigned_to: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.uuid().safeParse(v).success),
  follow_up_at: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T09:00:00+01:00`).toISOString() : null)),
});

export async function updateEnquiry(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await assertPermission("enquiries.manage");
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Not allowed." };
  }
  const parsed = updateSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { status: "error", message: "Check the status, assignee and follow-up date." };
  const { id, ...fields } = parsed.data;
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("enquiries").update(fields).eq("id", id);
  if (error) return { status: "error", message: "Could not update the enquiry." };
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin/enquiries");
  return { status: "success", message: "Enquiry updated." };
}

export async function addEnquiryNote(_prev: FormState, form: FormData): Promise<FormState> {
  let staff;
  try {
    staff = await assertPermission("enquiries.manage");
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Not allowed." };
  }
  const id = String(form.get("id") ?? "");
  const note = String(form.get("note") ?? "").trim();
  if (!z.uuid().safeParse(id).success || note.length < 2 || note.length > 3000) {
    return { status: "error", message: "Write a note between 2 and 3000 characters." };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("enquiry_notes").insert({ enquiry_id: id, author_id: staff.userId, note });
  if (error) return { status: "error", message: "Could not save the note." };
  revalidatePath(`/admin/enquiries/${id}`);
  return { status: "success", message: "Note added." };
}

export async function deleteEnquiry(id: string) {
  await assertPermission("enquiries.manage");
  const supabase = await createServerSupabase();
  await supabase.from("enquiries").delete().eq("id", id);
  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries?deleted=1");
}
