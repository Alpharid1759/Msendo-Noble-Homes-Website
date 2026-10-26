// src/app/api/admin/newsletter/export/route.ts
import { NextResponse } from "next/server";
import { assertPermission } from "@/lib/auth/staff";
import { publicEnv } from "@/lib/env";
import { toCsv } from "@/lib/csv";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    await assertPermission("newsletter.view");
  } catch {
    return NextResponse.json({ message: "Not allowed" }, { status: 403 });
  }
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("newsletter_subscribers").select("email, consent_at, unsubscribe_token").eq("status", "subscribed").order("created_at");
  const rows = ((data ?? []) as { email: string; consent_at: string; unsubscribe_token: string }[]).map((r) => ({
    email: r.email,
    consent_at: r.consent_at,
    unsubscribe_url: `${publicEnv.siteUrl}/newsletter/unsubscribe?token=${r.unsubscribe_token}`,
  }));
  return new NextResponse(toCsv(rows, ["email", "consent_at", "unsubscribe_url"]), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="msendo-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
