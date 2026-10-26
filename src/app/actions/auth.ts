// src/app/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import type { FormState } from "@/lib/form-state";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, hashValue } from "@/lib/security/request";
import { createServerSupabase } from "@/lib/supabase/server";

const safeNext = (value: unknown) => {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/admin") && !v.startsWith("//") ? v : "/admin";
};

const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128)
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v), "Include upper and lower case letters and a number");

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));
  const values = { email };

  if (!email || !password) return { status: "error", message: "Enter your email and password.", values };

  const ip = await getClientIp();
  const okIp = await checkRateLimit(`login-ip:${hashValue(ip)}`, 20, 900);
  const okUser = await checkRateLimit(`login-user:${hashValue(email)}`, 8, 900);
  if (!okIp || !okUser) {
    return { status: "error", message: "Too many sign-in attempts. Wait 15 minutes and try again, or reset your password.", values };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { status: "error", message: "That email and password combination is not recognised.", values };
  }

  const { data: profile } = await supabase.from("staff_profiles").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { status: "error", message: "This account does not have access to the admin area. Contact a super administrator.", values };
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect(`/admin/mfa?next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success) {
    return { status: "error", message: "Enter a valid email address.", values: { email } };
  }
  const ip = await getClientIp();
  if (!(await checkRateLimit(`reset:${hashValue(ip)}`, 5, 3600))) {
    return { status: "error", message: "Too many requests. Try again in an hour." };
  }
  const supabase = await createServerSupabase();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${publicEnv.siteUrl}/auth/confirm?next=/admin/reset-password`,
  });
  return { status: "success", message: "If that email belongs to a staff account, a reset link is on its way. Check your inbox." };
}

export async function updatePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { status: "error", fieldErrors: { password: parsed.error.issues[0].message } };
  if (password !== confirm) return { status: "error", fieldErrors: { confirm: "Passwords do not match" } };
  const supabase = await createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { status: "error", message: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error", message: error.message };
  return { status: "success", message: "Password updated." };
}

export async function verifyMfa(_prev: FormState, form: FormData): Promise<FormState> {
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  const next = safeNext(form.get("next"));
  if (!/^\d{6}$/.test(code)) return { status: "error", fieldErrors: { code: "Enter the 6-digit code from your authenticator app" } };
  const supabase = await createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  if (!(await checkRateLimit(`mfa:${userData.user.id}`, 10, 900))) {
    return { status: "error", message: "Too many attempts. Wait 15 minutes and try again." };
  }
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp?.find((f) => f.status === "verified");
  if (!factor) redirect(next);
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return { status: "error", fieldErrors: { code: "That code is not valid. Check your app and try again." } };
  redirect(next);
}

export async function startMfaEnrollment(): Promise<{ factorId: string; qr: string; secret: string } | { error: string }> {
  const supabase = await createServerSupabase();
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const f of existing?.all ?? []) {
    if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
  if (error || !data) return { error: error?.message ?? "Could not start setup." };
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export async function confirmMfaEnrollment(_prev: FormState, form: FormData): Promise<FormState> {
  const factorId = String(form.get("factorId") ?? "");
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { status: "error", fieldErrors: { code: "Enter the 6-digit code" } };
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { status: "error", fieldErrors: { code: "That code is not valid. Try the next one your app shows." } };
  return { status: "success", message: "Two-step verification is on. You will be asked for a code each time you sign in." };
}

export async function removeMfaFactor(form: FormData) {
  const factorId = String(form.get("factorId") ?? "");
  const supabase = await createServerSupabase();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/admin/mfa?next=/admin/account");
  await supabase.auth.mfa.unenroll({ factorId });
  redirect("/admin/account?mfa=removed");
}
