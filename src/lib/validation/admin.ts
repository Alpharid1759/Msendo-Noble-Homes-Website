// src/lib/validation/admin.ts
import { z } from "zod";

const optNum = (opts: { int?: boolean; max?: number } = {}) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
      if (!Number.isFinite(n) || n < 0 || (opts.max !== undefined && n > opts.max) || (opts.int && !Number.isInteger(n))) {
        ctx.addIssue({ code: "custom", message: opts.int ? "Enter a whole number" : "Enter a valid number" });
        return z.NEVER;
      }
      return n;
    });

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const bool = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("false"), z.literal(""), z.boolean()])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true" || v === "1");

export const chargeSchema = z.object({
  charge_type: z.enum(["caution_deposit", "agency_fee", "legal_fee", "service_charge", "agreement_fee", "other"]),
  label: z.string().trim().min(2, "Add a label").max(80),
  amount: z.number().min(0).nullable(),
  is_percentage: z.boolean(),
  billing_frequency: z.enum(["one_off", "per_night", "per_week", "per_month", "per_year"]),
  notes: z.string().trim().max(200).nullable(),
});

export const propertySchema = z
  .object({
    title: z.string().trim().min(5, "Use at least 5 characters").max(160),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(100)
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), "Use lowercase letters, numbers and hyphens only"),
    description: z.string().trim().max(10000).default(""),
    transaction_type: z.enum(["sale", "rent", "short_let"]),
    category_id: z.uuid("Choose a property type"),
    status: z.enum(["draft", "pending_review", "published", "reserved", "sold", "rented", "unavailable", "archived"]),
    price: optNum({ max: 1e13 }),
    price_on_request: bool,
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).default("NGN"),
    billing_frequency: z.enum(["one_off", "per_night", "per_week", "per_month", "per_year"]),
    is_negotiable: bool,
    location_id: z.uuid("Choose a location"),
    address_line: optText(200),
    show_exact_address: bool,
    latitude: optNum({ max: 90 }),
    longitude: optNum({ max: 180 }),
    show_map_pin: bool,
    bedrooms: optNum({ int: true, max: 100 }),
    bathrooms: optNum({ int: true, max: 100 }),
    toilets: optNum({ int: true, max: 100 }),
    parking_spaces: optNum({ int: true, max: 1000 }),
    land_area: optNum({ max: 1e9 }),
    floor_area: optNum({ max: 1e9 }),
    area_unit: z.enum(["sqm", "sqft", "hectare", "acre", "plot"]),
    furnishing: z
      .enum(["unfurnished", "semi_furnished", "furnished", "serviced", ""])
      .optional()
      .transform((v) => (v ? v : null)),
    available_from: z
      .string()
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Choose a valid date"),
    lease_min_months: optNum({ int: true, max: 240 }),
    title_document: optText(160),
    title_verified: bool,
    title_notes: optText(1000),
    virtual_tour_url: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^https:\/\/[^\s]+$/.test(v), "Use a full https:// link"),
    is_featured: bool,
    is_demo: bool,
    keep_public_page: bool,
    seo_title: optText(70),
    seo_description: optText(170),
    amenities: z.array(z.string().trim().min(1).max(60)).max(60).default([]),
    attributes: z.record(z.string().trim().min(1).max(40), z.string().trim().max(120)).default({}),
    charges: z.array(chargeSchema).max(20).default([]),
  })
  .superRefine((v, ctx) => {
    if (!v.price_on_request && v.price === null) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a price or tick 'Price on request'" });
    }
    if (v.transaction_type !== "sale" && v.billing_frequency === "one_off") {
      ctx.addIssue({ code: "custom", path: ["billing_frequency"], message: "Choose how often rent is paid" });
    }
    if ((v.latitude === null) !== (v.longitude === null)) {
      ctx.addIssue({ code: "custom", path: ["latitude"], message: "Enter both latitude and longitude, or neither" });
    }
    if (v.show_map_pin && v.latitude === null) {
      ctx.addIssue({ code: "custom", path: ["show_map_pin"], message: "Add coordinates before showing a map pin" });
    }
    if (v.show_exact_address && !v.address_line) {
      ctx.addIssue({ code: "custom", path: ["show_exact_address"], message: "Add the address before showing it publicly" });
    }
  });

export type PropertyInput = z.infer<typeof propertySchema>;

export const blogSchema = z
  .object({
    title: z.string().trim().min(5, "Use at least 5 characters").max(200),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(120)
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), "Use lowercase letters, numbers and hyphens only"),
    excerpt: optText(300),
    body_html: z.string().max(200_000).default(""),
    featured_image_url: optText(500),
    featured_image_alt: optText(200),
    og_image_url: optText(500),
    author_name: optText(120),
    category_id: z
      .string()
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || z.uuid().safeParse(v).success, "Choose a category"),
    tags: z
      .string()
      .optional()
      .transform((v) =>
        (v ?? "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 12),
      ),
    status: z.enum(["draft", "scheduled", "published", "archived"]),
    published_at: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    seo_title: optText(70),
    seo_description: optText(170),
  })
  .superRefine((v, ctx) => {
    if (v.status === "scheduled" && !v.published_at) {
      ctx.addIssue({ code: "custom", path: ["published_at"], message: "Choose when to publish" });
    }
  });

export type BlogInput = z.infer<typeof blogSchema>;
