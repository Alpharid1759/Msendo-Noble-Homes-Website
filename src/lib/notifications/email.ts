// src/lib/notifications/email.ts
import "server-only";
import { publicEnv } from "@/lib/env";
import { isEmailConfigured, serverEnv } from "@/lib/server-env";
import { createServiceSupabase } from "@/lib/supabase/admin";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export interface EmailRow {
  label: string;
  value: string | null | undefined;
}

export function renderEmail(opts: { heading: string; intro: string; rows?: EmailRow[]; cta?: { label: string; url: string }; footer?: string }) {
  const rows = (opts.rows ?? [])
    .filter((r) => r.value)
    .map(
      (r) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5B6573;font-size:14px;vertical-align:top;white-space:nowrap">${escape(r.label)}</td><td style="padding:6px 0;color:#1F252D;font-size:14px;white-space:pre-wrap">${escape(String(r.value))}</td></tr>`,
    )
    .join("");
  const cta = opts.cta
    ? `<p style="margin:24px 0 0"><a href="${escape(opts.cta.url)}" style="background:#015E36;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;display:inline-block">${escape(opts.cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F8F7F2;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E6E0D3;border-radius:8px">
<tr><td style="padding:20px 24px;border-bottom:3px solid #015E36;border-radius:8px 8px 0 0" align="left"><img src="${publicEnv.siteUrl}/brand/logo-full.png" alt="Msendo Noble Homes" width="120" style="display:block;width:120px;height:auto;border:0"></td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;color:#015E36">${escape(opts.heading)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1F252D">${escape(opts.intro)}</p>
${rows ? `<table role="presentation" cellpadding="0" cellspacing="0">${rows}</table>` : ""}
${cta}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #E6E0D3;color:#5B6573;font-size:12px;line-height:1.5">${escape(opts.footer ?? "Msendo Noble Homes, a division of Msendo Integrated Limited. Plot 833 Emmanuel Aguna, Jabi District, Abuja.")}</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  template: string;
  replyTo?: string;
  related?: { type: string; id: string };
}) {
  const recipients = (Array.isArray(opts.to) ? opts.to : [opts.to]).filter(Boolean);
  if (recipients.length === 0) return { sent: false, reason: "no-recipient" as const };

  let supabase: ReturnType<typeof createServiceSupabase> | null = null;
  try {
    supabase = createServiceSupabase();
  } catch {
    supabase = null;
  }

  const record = async (status: "sent" | "failed" | "skipped", extra: { provider_message_id?: string; error?: string } = {}) => {
    if (!supabase) return;
    await supabase.from("notifications").insert(
      recipients.map((recipient) => ({
        channel: "email",
        template: opts.template,
        recipient,
        subject: opts.subject,
        status,
        provider: "resend",
        provider_message_id: extra.provider_message_id ?? null,
        error: extra.error ?? null,
        related_type: opts.related?.type ?? null,
        related_id: opts.related?.id ?? null,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      })),
    );
  };

  if (!isEmailConfigured()) {
    await record("skipped", { error: "Email provider not configured" });
    return { sent: false, reason: "not-configured" as const };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${serverEnv.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: serverEnv.emailFrom,
        to: recipients,
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      await record("failed", { error: json.message ?? `HTTP ${res.status}` });
      return { sent: false, reason: "provider-error" as const };
    }
    await record("sent", { provider_message_id: json.id });
    return { sent: true as const };
  } catch (err) {
    await record("failed", { error: err instanceof Error ? err.message : "Unknown error" });
    return { sent: false, reason: "network-error" as const };
  }
}

export function adminUrl(path: string) {
  return `${publicEnv.siteUrl}${path}`;
}
