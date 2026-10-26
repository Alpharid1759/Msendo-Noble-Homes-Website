// src/lib/private-settings.ts
import "server-only";
import { createServiceSupabase } from "@/lib/supabase/admin";

export interface PrivateSettings {
  uploads: { image_max_mb: number; video_max_mb: number; video_max_seconds: number; max_media_per_property: number };
  notifications: { admin_emails: string[]; send_customer_confirmations: boolean };
}

export const DEFAULT_PRIVATE: PrivateSettings = {
  uploads: { image_max_mb: 15, video_max_mb: 500, video_max_seconds: 900, max_media_per_property: 60 },
  notifications: { admin_emails: ["MsendoIntegratedltd@gmail.com"], send_customer_confirmations: true },
};

export async function getPrivateSetting<K extends keyof PrivateSettings>(key: K): Promise<PrivateSettings[K]> {
  try {
    const supabase = createServiceSupabase();
    const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
    if (data?.value && typeof data.value === "object") {
      return { ...DEFAULT_PRIVATE[key], ...(data.value as object) } as PrivateSettings[K];
    }
  } catch {
    return DEFAULT_PRIVATE[key];
  }
  return DEFAULT_PRIVATE[key];
}
