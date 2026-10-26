// src/lib/security/spam.ts
import "server-only";
import { serverEnv } from "@/lib/server-env";

export const MIN_FORM_FILL_MS = 2500;

export function isLikelyBot(form: FormData) {
  const honeypot = String(form.get("company_website") ?? "");
  if (honeypot.trim() !== "") return true;
  const startedAt = Number(form.get("form_started_at") ?? 0);
  if (!Number.isFinite(startedAt) || startedAt <= 0) return true;
  const elapsed = Date.now() - startedAt;
  return elapsed < MIN_FORM_FILL_MS || elapsed > 1000 * 60 * 60 * 24;
}

export async function verifyTurnstile(token: string | null, ip: string) {
  if (!serverEnv.turnstileSecret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: serverEnv.turnstileSecret, response: token, remoteip: ip }),
      cache: "no-store",
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
