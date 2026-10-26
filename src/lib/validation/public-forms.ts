// src/lib/validation/public-forms.ts
import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .refine((v) => /^\+?\d{7,15}$/.test(v), "Enter a valid phone number, for example 0803 123 4567");

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.replace(/[\s().-]/g, "") : undefined))
  .refine((v) => v === undefined || /^\+?\d{7,15}$/.test(v), "Enter a valid phone number, for example 0803 123 4567");

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || z.email().safeParse(v).success, "Enter a valid email address");

const consent = z.literal("on", { error: "Please agree to the privacy notice so we can respond" });

export const enquiryCategoryValues = [
  "general",
  "buying",
  "renting",
  "short_let",
  "property_enquiry",
  "property_management",
  "investment",
  "verification_request",
  "report_listing",
  "data_request",
  "other",
] as const;

export const enquirySchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name").max(120),
    email: optionalEmail,
    phone: optionalPhone,
    category: z.enum(enquiryCategoryValues).default("general"),
    subject: optionalText(150),
    message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(4000),
    preferred_contact: z.enum(["phone", "whatsapp", "email"]).optional(),
    property_reference: optionalText(20),
    source_path: optionalText(300),
    consent,
  })
  .refine((v) => v.email || v.phone, { message: "Give us an email address or phone number", path: ["email"] });

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const inspectionSchema = z.object({
  property_reference: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,20}$/, "Choose a property to inspect"),
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: phoneSchema,
  email: optionalEmail,
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  preferred_time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time"),
  alternative_date: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v), "Choose a valid date"),
  alternative_time: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^\d{2}:\d{2}$/.test(v), "Choose a valid time"),
  attendees: z.coerce.number().int().min(1).max(20).default(1),
  notes: optionalText(1500),
  consent,
});

export type InspectionInput = z.infer<typeof inspectionSchema>;

export const listingSubmissionSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name").max(120),
    email: optionalEmail,
    phone: phoneSchema,
    relationship: z.enum(["owner", "landlord", "developer", "agent", "other"], { error: "Tell us your relationship to the property" }),
    transaction_type: z.enum(["sale", "rent", "short_let", "lease"], { error: "Choose sale, rent, short-let or lease" }),
    property_type: z.string().trim().min(2, "Describe the property type").max(80),
    location: z.string().trim().min(2, "Enter the property location").max(200),
    bedrooms: z.coerce.number().int().min(0).max(50).optional().catch(undefined),
    asking_price: optionalText(60),
    title_document: optionalText(120),
    description: z.string().trim().min(20, "Describe the property in at least 20 characters").max(4000),
    consent,
  })
  .refine((v) => v.email || v.phone, { message: "Give us an email address or phone number", path: ["email"] });

export type ListingSubmissionInput = z.infer<typeof listingSubmissionSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  consent,
});

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function formToObject(form: FormData) {
  const obj: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") obj[key] = value;
  }
  return obj;
}
