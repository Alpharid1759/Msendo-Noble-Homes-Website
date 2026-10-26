// src/lib/settings.ts
import "server-only";
import { cachedQuery as unstable_cache } from "@/lib/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicSupabase } from "@/lib/supabase/server";
import type { SiteSettings } from "@/types/domain";

export const DEFAULT_SETTINGS: SiteSettings = {
  company: {
    brand_name: "Msendo Noble Homes",
    legal_name: "Msendo Integrated Limited",
    tagline: "Property. Opportunity. Confidence.",
    short_description:
      "The real estate division of Msendo Integrated Limited, helping buyers, tenants, investors, landlords and developers across Abuja.",
    rc_number: null,
  },
  contact: {
    phone: "+2349028748800",
    phone_display: "0902 874 8800",
    email: "MsendoIntegratedltd@gmail.com",
    whatsapp_number: "2349028748800",
    whatsapp_link: "https://wa.link/4w83p2",
    address_line: "Plot 833 Emmanuel Aguna, Jabi District",
    city: "Abuja",
    state: "Federal Capital Territory",
    country: "Nigeria",
    maps_url: "https://www.google.com/maps/search/?api=1&query=Plot+833+Emmanuel+Aguna+Jabi+Abuja",
    business_hours: "Monday to Friday, 7:00am to 5:00pm. Saturday, 10:00am to 4:00pm. Closed on Sundays.",
  },
  social: { facebook: null, instagram: null, x: null, linkedin: null, youtube: null, tiktok: null },
  brand: { logo_url: null, logo_white_url: null, hero_image_url: null },
  seo: {
    default_title: "Msendo Noble Homes | Property for Sale and Rent in Abuja",
    default_description:
      "Find houses, apartments, land, offices and commercial property for sale and rent in Abuja with Msendo Noble Homes, the real estate division of Msendo Integrated Limited.",
    og_image_url: null,
    google_site_verification: null,
  },
  analytics: { ga_measurement_id: null, require_consent: true },
  privacy: {
    consent_version: "2026-10-26",
    data_protection_email: "MsendoIntegratedltd@gmail.com",
    enquiry_retention_months: 24,
  },
  testimonials: { items: [] },
  inspections: {
    slot_minutes: 60,
    earliest_hour: 7,
    latest_hour: 17,
    allow_saturdays: true,
    saturday_earliest_hour: 10,
    saturday_latest_hour: 16,
    min_notice_hours: 24,
    max_days_ahead: 60,
    allow_sundays: false,
  },
};

type SettingsKey = keyof SiteSettings;

function merge(rows: { key: string; value: unknown }[]): SiteSettings {
  const result = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, Record<string, unknown>>;
  for (const row of rows) {
    if (row.key in result && row.value && typeof row.value === "object") {
      result[row.key] = { ...result[row.key], ...(row.value as Record<string, unknown>) };
    }
  }
  return result as unknown as SiteSettings;
}

const loadSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
    const supabase = createPublicSupabase();
    const { data, error } = await supabase.from("public_site_settings").select("key, value");
    if (error || !data) return DEFAULT_SETTINGS;
    return merge(data);
  },
  ["site-settings"],
  { tags: ["settings"], revalidate: 3600 },
);

export async function getSettings(): Promise<SiteSettings> {
  try {
    return await loadSettings();
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getSetting<K extends SettingsKey>(key: K): Promise<SiteSettings[K]> {
  const settings = await getSettings();
  return settings[key];
}
