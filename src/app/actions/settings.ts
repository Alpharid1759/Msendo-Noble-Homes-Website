// src/app/actions/settings.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/staff";
import type { FormState } from "@/lib/form-state";
import { createServerSupabase } from "@/lib/supabase/server";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));
const url = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/\S+$/.test(v), "Use a full https:// link");
const req = (max: number) => z.string().trim().min(1, "Required").max(max);
const bool = z
  .string()
  .optional()
  .transform((v) => v === "on");
const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

const SCHEMAS = {
  company: z.object({
    brand_name: req(80),
    legal_name: req(120),
    tagline: req(120),
    short_description: req(300),
    rc_number: text(30),
  }),
  contact: z.object({
    phone: z.string().trim().regex(/^\+\d{8,15}$/, "Use international format, e.g. +2349028748800"),
    phone_display: req(30),
    email: z.string().trim().pipe(z.email("Enter a valid email")),
    whatsapp_number: z.string().trim().regex(/^\d{8,15}$/, "Digits only, with country code, e.g. 2349028748800"),
    whatsapp_link: url.refine((v) => v !== null, "Required"),
    address_line: req(200),
    city: req(60),
    state: req(80),
    country: req(60),
    maps_url: url.refine((v) => v !== null, "Required"),
    business_hours: text(160),
  }),
  social: z.object({ facebook: url, instagram: url, x: url, linkedin: url, youtube: url, tiktok: url }),
  brand: z.object({ logo_url: url, logo_white_url: url }),
  seo: z.object({
    default_title: req(70),
    default_description: req(170),
    og_image_url: url,
    google_site_verification: text(120),
  }),
  analytics: z.object({
    ga_measurement_id: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v.toUpperCase() : null))
      .refine((v) => v === null || /^G-[A-Z0-9]{4,15}$/.test(v), "Use a GA4 ID such as G-ABC123XYZ"),
    require_consent: bool,
  }),
  privacy: z.object({
    consent_version: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the policy date, e.g. 2026-10-26"),
    data_protection_email: z.string().trim().pipe(z.email("Enter a valid email")),
    enquiry_retention_months: int(1, 120),
  }),
  inspections: z
    .object({
      slot_minutes: int(15, 240),
      earliest_hour: int(6, 20),
      latest_hour: int(8, 22),
      min_notice_hours: int(0, 168),
      max_days_ahead: int(1, 365),
      allow_sundays: bool,
    })
    .refine((v) => v.latest_hour > v.earliest_hour, { message: "Latest hour must be after earliest hour", path: ["latest_hour"] }),
  uploads: z.object({
    image_max_mb: int(1, 50),
    video_max_mb: int(10, 5000),
    video_max_seconds: int(30, 7200),
    max_media_per_property: int(1, 200),
  }),
  notifications: z.object({
    admin_emails: z
      .string()
      .transform((v) =>
        v
          .split(/[\s,;]+/)
          .map((e) => e.trim())
          .filter(Boolean),
      )
      .refine((list) => list.length > 0 && list.every((e) => z.email().safeParse(e).success), "Enter one or more valid emails"),
    send_customer_confirmations: bool,
  }),
  testimonials: z.object({
    items_json: z.string().transform((v, ctx) => {
      try {
        const parsed = z
          .array(
            z.object({
              name: z.string().trim().min(2).max(80),
              context: z.string().trim().max(120).nullable(),
              quote: z.string().trim().min(10).max(600),
              permission_confirmed: z.boolean(),
            }),
          )
          .max(20)
          .parse(JSON.parse(v));
        return parsed;
      } catch {
        ctx.addIssue({ code: "custom", message: "Each testimonial needs a name and a quote of at least 10 characters" });
        return z.NEVER;
      }
    }),
  }),
} as const;

export type SettingsKey = keyof typeof SCHEMAS;

export async function saveSetting(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await assertPermission("settings.manage");
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Not allowed." };
  }
  const key = String(form.get("key") ?? "") as SettingsKey;
  const schema = SCHEMAS[key];
  if (!schema) return { status: "error", message: "Unknown settings section." };
  const raw = Object.fromEntries([...form.entries()].filter(([k, v]) => k !== "key" && typeof v === "string"));
  const parsed = (schema as z.ZodType).safeParse(raw);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: fe };
  }
  let value = parsed.data as Record<string, unknown>;
  if (key === "testimonials") value = { items: (value as { items_json: unknown }).items_json };

  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("site_settings")
    .update({ value, updated_at: new Date().toISOString(), updated_by: auth.user?.id ?? null })
    .eq("key", key);
  if (error) return { status: "error", message: "Could not save settings." };
  revalidateTag("settings", { expire: 0 });
  revalidatePath("/", "layout");
  return { status: "success", message: "Saved. The website will show the change on the next page load." };
}

export async function saveTaxonomyItem(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await assertPermission("taxonomy.manage");
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Not allowed." };
  }
  const table = String(form.get("table"));
  const id = String(form.get("id") ?? "") || null;
  const supabase = await createServerSupabase();
  const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (table === "categories") {
    const schema = z.object({
      name: req(60),
      slug: z.string().trim().toLowerCase().regex(slugRe, "Lowercase letters, numbers and hyphens"),
      description: text(300),
      icon: z.enum(["home", "building", "map", "store", "briefcase", "warehouse", "key", "gem", "landmark"]),
      sort_order: int(0, 999),
      is_active: bool,
    });
    const parsed = schema.safeParse(Object.fromEntries(form.entries()));
    if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
    const q = id ? supabase.from("property_categories").update(parsed.data).eq("id", id) : supabase.from("property_categories").insert(parsed.data);
    const { error } = await q;
    if (error) return { status: "error", message: error.code === "23505" ? "That slug is already used." : "Could not save." };
  } else if (table === "locations") {
    const schema = z.object({
      name: req(80),
      slug: z.string().trim().toLowerCase().regex(slugRe, "Lowercase letters, numbers and hyphens"),
      type: z.enum(["state", "city", "district"]),
      parent_id: z
        .string()
        .optional()
        .transform((v) => (v ? v : null)),
      description: text(600),
      sort_order: int(0, 999),
      is_featured: bool,
      is_active: bool,
    });
    const parsed = schema.safeParse(Object.fromEntries(form.entries()));
    if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
    if (parsed.data.type !== "state" && !parsed.data.parent_id) return { status: "error", message: "Choose the parent state or city." };
    if (id && parsed.data.parent_id === id) return { status: "error", message: "A location cannot be its own parent." };
    const q = id ? supabase.from("locations").update(parsed.data).eq("id", id) : supabase.from("locations").insert(parsed.data);
    const { error } = await q;
    if (error) return { status: "error", message: error.code === "23505" ? "That slug is already used." : "Could not save." };
  } else if (table === "blog_categories") {
    const schema = z.object({ name: req(60), slug: z.string().trim().toLowerCase().regex(slugRe), sort_order: int(0, 999) });
    const parsed = schema.safeParse(Object.fromEntries(form.entries()));
    if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
    const q = id ? supabase.from("blog_categories").update(parsed.data).eq("id", id) : supabase.from("blog_categories").insert(parsed.data);
    const { error } = await q;
    if (error) return { status: "error", message: error.code === "23505" ? "That slug is already used." : error.code === "42501" ? "Only blog publishers can manage blog categories." : "Could not save." };
    revalidateTag("blog", { expire: 0 });
  } else {
    return { status: "error", message: "Unknown list." };
  }
  revalidateTag("taxonomy", { expire: 0 });
  revalidatePath("/admin/taxonomy");
  return { status: "success", message: id ? "Saved." : "Added." };
}
