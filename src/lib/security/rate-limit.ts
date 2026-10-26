// src/lib/security/rate-limit.ts
import "server-only";
import { createServiceSupabase } from "@/lib/supabase/admin";

export async function checkRateLimit(key: string, limit: number, windowSeconds: number) {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data === true;
  } catch {
    return true;
  }
}
