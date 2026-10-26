// src/app/actions/inspections.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/staff";
import { formatDateTime } from "@/lib/format";
import type { FormState } from "@/lib/form-state";
import { renderEmail, sendEmail } from "@/lib/notifications/email";
import { getSettings } from "@/lib/settings";
import { createServerSupabase } from "@/lib/supabase/server";

const scheduleSchema = z.object({
  id: z.uuid(),
  action: z.enum(["confirm", "reschedule", "cancel", "complete", "no_show", "notes"]),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(15).max(480).optional(),
  assigned_agent_id: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  internal_notes: z.string().max(3000).optional(),
  message_to_customer: z.string().max(1000).optional(),
});

export async function updateInspection(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await assertPermission("inspections.manage");
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Not allowed." };
  }
  const parsed = scheduleSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { status: "error", message: "Check the form and try again." };
  const input = parsed.data;
  const supabase = await createServerSupabase();
  const { data: current } = await supabase.from("inspections").select("*, properties(reference, title)").eq("id", input.id).maybeSingle();
  if (!current) return { status: "error", message: "Inspection not found." };

  const update: Record<string, unknown> = {};
  if (input.internal_notes !== undefined) update.internal_notes = input.internal_notes || null;

  let scheduledAt: Date | null = null;
  if (input.action === "confirm" || input.action === "reschedule") {
    if (!input.scheduled_date || !input.scheduled_time) {
      return { status: "error", fieldErrors: { scheduled_date: "Choose the confirmed date and time" } };
    }
    scheduledAt = new Date(`${input.scheduled_date}T${input.scheduled_time}:00+01:00`);
    if (Number.isNaN(scheduledAt.getTime())) return { status: "error", fieldErrors: { scheduled_date: "Invalid date or time" } };
    if (scheduledAt.getTime() < Date.now() - 60_000) return { status: "error", fieldErrors: { scheduled_date: "Choose a time in the future" } };
    update.scheduled_at = scheduledAt.toISOString();
    update.duration_minutes = input.duration_minutes ?? current.duration_minutes;
    update.assigned_agent_id = input.assigned_agent_id;
    update.status = input.action === "confirm" && current.status === "requested" ? "confirmed" : current.scheduled_at ? "rescheduled" : "confirmed";
    if (!input.assigned_agent_id) return { status: "error", fieldErrors: { assigned_agent_id: "Assign an agent before confirming" } };
  } else if (input.action === "cancel") {
    update.status = "cancelled";
  } else if (input.action === "complete") {
    update.status = "completed";
  } else if (input.action === "no_show") {
    update.status = "no_show";
  }

  const { data: auth } = await supabase.auth.getUser();
  if (update.status === "confirmed" || update.status === "rescheduled") update.confirmed_by = auth.user?.id ?? null;

  const { error } = await supabase.from("inspections").update(update).eq("id", input.id);
  if (error) {
    if (error.code === "23P01") return { status: "error", fieldErrors: { assigned_agent_id: "This agent already has an inspection at that time. Choose another time or agent." } };
    if (error.code === "23514") return { status: "error", message: "A confirmed inspection needs a date and time." };
    return { status: "error", message: "Could not update the inspection." };
  }

  if (current.email && ["confirmed", "rescheduled", "cancelled"].includes(String(update.status))) {
    const settings = await getSettings();
    const prop = current.properties as { reference: string; title: string } | null;
    const heading =
      update.status === "cancelled" ? "Your inspection has been cancelled" : update.status === "rescheduled" ? "Your inspection time has changed" : "Your inspection is confirmed";
    await sendEmail({
      to: current.email,
      subject: `${heading}: ${prop?.reference ?? ""}`,
      template: `customer.inspection_${update.status}`,
      related: { type: "inspection", id: input.id },
      html: renderEmail({
        heading,
        intro:
          update.status === "cancelled"
            ? `Your inspection request for ${prop?.title ?? "the property"} has been cancelled. Contact us on ${settings.contact.phone_display} to arrange another time.`
            : `We look forward to meeting you. If you need to change the time, call ${settings.contact.phone_display}.`,
        rows: [
          { label: "Property", value: prop ? `${prop.reference} (${prop.title})` : null },
          { label: "Date and time", value: scheduledAt ? formatDateTime(scheduledAt) : null },
          { label: "Message", value: input.message_to_customer || null },
        ],
      }),
    });
  }

  revalidatePath(`/admin/inspections/${input.id}`);
  revalidatePath("/admin/inspections");
  const label = { confirm: "Inspection confirmed.", reschedule: "Inspection rescheduled.", cancel: "Inspection cancelled.", complete: "Marked as completed.", no_show: "Marked as no-show.", notes: "Notes saved." }[input.action];
  return { status: "success", message: `${label}${current.email && ["confirm", "reschedule", "cancel"].includes(input.action) ? " The customer has been emailed if email is configured." : ""}` };
}
