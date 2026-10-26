// src/app/api/cron/daily/route.ts
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { formatDateTime } from "@/lib/format";
import { renderEmail, sendEmail } from "@/lib/notifications/email";
import { getSettings } from "@/lib/settings";
import { createServiceSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorised(request: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const header = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (!secret || header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const supabase = createServiceSupabase();
  const settings = await getSettings();
  const report: Record<string, number | string> = {};

  const now = new Date();
  const in36h = new Date(now.getTime() + 36 * 3_600_000).toISOString();
  const { data: upcoming } = await supabase
    .from("inspections")
    .select("id, full_name, email, scheduled_at, properties(reference, title), staff_profiles!inspections_assigned_agent_id_fkey(email, full_name)")
    .in("status", ["confirmed", "rescheduled"])
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", in36h);

  let reminders = 0;
  for (const i of (upcoming ?? []) as unknown as {
    id: string;
    full_name: string;
    email: string | null;
    scheduled_at: string;
    properties: { reference: string; title: string } | null;
    staff_profiles: { email: string; full_name: string } | null;
  }[]) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("related_id", i.id)
      .eq("template", "customer.inspection_reminder")
      .gte("created_at", new Date(now.getTime() - 48 * 3_600_000).toISOString());
    if ((count ?? 0) > 0) continue;
    const rows = [
      { label: "Property", value: i.properties ? `${i.properties.reference} (${i.properties.title})` : null },
      { label: "Date and time", value: formatDateTime(i.scheduled_at) },
      { label: "Agent", value: i.staff_profiles?.full_name ?? null },
    ];
    if (i.email) {
      await sendEmail({
        to: i.email,
        subject: `Reminder: your inspection ${formatDateTime(i.scheduled_at)}`,
        template: "customer.inspection_reminder",
        related: { type: "inspection", id: i.id },
        html: renderEmail({ heading: "Your inspection is coming up", intro: `If you need to change the time, call ${settings.contact.phone_display}.`, rows }),
      });
    }
    if (i.staff_profiles?.email) {
      await sendEmail({
        to: i.staff_profiles.email,
        subject: `Inspection reminder: ${i.full_name}, ${formatDateTime(i.scheduled_at)}`,
        template: "staff.inspection_reminder",
        related: { type: "inspection", id: i.id },
        html: renderEmail({ heading: "Upcoming inspection", intro: `You are attending an inspection with ${i.full_name}.`, rows }),
      });
    }
    reminders++;
  }
  report.reminders = reminders;

  await supabase.from("rate_limits").delete().lt("window_start", new Date(now.getTime() - 86_400_000).toISOString());

  const { data: rawFolders } = await supabase.storage.from("media-raw").list("", { limit: 1000 });
  let rawRemoved = 0;
  for (const folder of Array.isArray(rawFolders) ? rawFolders : []) {
    const { data: files } = await supabase.storage.from("media-raw").list(folder.name, { limit: 1000 });
    const stale = (Array.isArray(files) ? files : []).filter((f) => f.created_at && now.getTime() - new Date(f.created_at).getTime() > 86_400_000).map((f) => `${folder.name}/${f.name}`);
    if (stale.length) {
      await supabase.storage.from("media-raw").remove(stale);
      rawRemoved += stale.length;
    }
  }
  report.raw_uploads_removed = rawRemoved;

  if (process.env.RETENTION_PURGE === "true") {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - settings.privacy.enquiry_retention_months);
    const { count } = await supabase
      .from("enquiries")
      .delete({ count: "exact" })
      .in("status", ["closed", "spam", "converted"])
      .lt("updated_at", cutoff.toISOString());
    report.enquiries_purged = count ?? 0;
  } else {
    report.enquiries_purged = "disabled";
  }

  return NextResponse.json({ ok: true, ...report });
}
