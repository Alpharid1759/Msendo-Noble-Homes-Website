// src/lib/server-env.ts
import "server-only";

export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "",
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY || "",
  ipHashSalt: process.env.IP_HASH_SALT || "",
};

export function isEmailConfigured() {
  return Boolean(serverEnv.resendApiKey && serverEnv.emailFrom);
}
