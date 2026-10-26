// src/app/admin/(panel)/settings/page.tsx
import { SettingsSection, TestimonialsEditor, type FieldDef } from "@/components/admin/SettingsForms";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Testimonial } from "@/types/domain";

export const metadata = { title: "Site settings" };

const SECTIONS: { key: string; title: string; description?: string; fields: FieldDef[] }[] = [
  {
    key: "company",
    title: "Company",
    fields: [
      { name: "brand_name", label: "Brand name" },
      { name: "legal_name", label: "Legal company name" },
      { name: "tagline", label: "Tagline" },
      { name: "rc_number", label: "CAC RC number", hint: "Shown in the footer only when filled in" },
      { name: "short_description", label: "Short description", type: "textarea" },
    ],
  },
  {
    key: "contact",
    title: "Contact details",
    description: "Used on every page, in emails, WhatsApp buttons and search engine data.",
    fields: [
      { name: "phone", label: "Phone (international format)", hint: "e.g. +2349028748800" },
      { name: "phone_display", label: "Phone as displayed", hint: "e.g. 0902 874 8800" },
      { name: "email", label: "Public email", type: "email" },
      { name: "whatsapp_number", label: "WhatsApp number (digits only)", hint: "Used for property-specific WhatsApp messages" },
      { name: "whatsapp_link", label: "WhatsApp short link", type: "url", hint: "Used for general WhatsApp buttons" },
      { name: "address_line", label: "Office address" },
      { name: "city", label: "City" },
      { name: "state", label: "State" },
      { name: "country", label: "Country" },
      { name: "maps_url", label: "Google Maps link", type: "url" },
      { name: "business_hours", label: "Business hours", hint: "e.g. Monday to Friday, 8am to 5pm; Saturday, 10am to 2pm", full: true },
    ],
  },
  {
    key: "social",
    title: "Social media",
    description: "Leave blank to hide a network.",
    fields: [
      { name: "facebook", label: "Facebook", type: "url" },
      { name: "instagram", label: "Instagram", type: "url" },
      { name: "x", label: "X (Twitter)", type: "url" },
      { name: "linkedin", label: "LinkedIn", type: "url" },
      { name: "youtube", label: "YouTube", type: "url" },
      { name: "tiktok", label: "TikTok", type: "url" },
    ],
  },
  {
    key: "brand",
    title: "Logo",
    description: "Until a logo is uploaded, the site uses the temporary MSENDO NOBLE HOMES wordmark.",
    fields: [
      { name: "logo_url", label: "Full-colour logo (for light backgrounds)", type: "image" },
      { name: "logo_white_url", label: "White logo (for dark backgrounds)", type: "image" },
    ],
  },
  {
    key: "seo",
    title: "Search engines",
    fields: [
      { name: "default_title", label: "Default page title" },
      { name: "google_site_verification", label: "Google Search Console verification code" },
      { name: "default_description", label: "Default description", type: "textarea" },
      { name: "og_image_url", label: "Default social sharing image", type: "image" },
    ],
  },
  {
    key: "analytics",
    title: "Analytics",
    fields: [
      { name: "ga_measurement_id", label: "Google Analytics 4 measurement ID", hint: "Leave blank to switch analytics off" },
      { name: "require_consent", label: "Only load analytics after visitors accept analytics cookies (recommended)", type: "checkbox" },
    ],
  },
  {
    key: "privacy",
    title: "Privacy",
    fields: [
      { name: "consent_version", label: "Privacy policy version date", hint: "Change this when the privacy policy changes; visitors will be asked again" },
      { name: "data_protection_email", label: "Data protection contact email", type: "email" },
      { name: "enquiry_retention_months", label: "Keep enquiry records for (months)", type: "number" },
    ],
  },
  {
    key: "inspections",
    title: "Inspection booking rules",
    fields: [
      { name: "earliest_hour", label: "Earliest start hour (24h)", type: "number" },
      { name: "latest_hour", label: "Latest finish hour (24h)", type: "number" },
      { name: "slot_minutes", label: "Default inspection length (minutes)", type: "number" },
      { name: "min_notice_hours", label: "Minimum notice (hours)", type: "number" },
      { name: "max_days_ahead", label: "Bookable up to (days ahead)", type: "number" },
      { name: "allow_sundays", label: "Allow Sunday inspections", type: "checkbox" },
    ],
  },
  {
    key: "uploads",
    title: "Upload limits",
    description: "Your Supabase plan also sets a maximum file size. Keep these at or below it.",
    fields: [
      { name: "image_max_mb", label: "Maximum photo size (MB)", type: "number" },
      { name: "video_max_mb", label: "Maximum video size (MB)", type: "number" },
      { name: "video_max_seconds", label: "Maximum video length (seconds)", type: "number" },
      { name: "max_media_per_property", label: "Maximum photos and videos per listing", type: "number" },
    ],
  },
  {
    key: "notifications",
    title: "Notifications",
    fields: [
      { name: "admin_emails", label: "Send new enquiry alerts to", hint: "Separate several addresses with commas", full: true },
      { name: "send_customer_confirmations", label: "Email customers a confirmation when they submit a form", type: "checkbox" },
    ],
  },
];

export default async function SettingsPage() {
  await requirePermission("settings.manage");
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("site_settings").select("key, value");
  const values = Object.fromEntries(((data ?? []) as { key: string; value: Record<string, unknown> }[]).map((r) => [r.key, r.value]));

  return (
    <>
      <AdminPageHeader title="Site settings" description="Changes appear on the website within a few seconds." />
      <div className="max-w-4xl space-y-6">
        {SECTIONS.map((s) => (
          <Card key={s.key} title={s.title}>
            {s.description && <p className="mb-4 text-sm text-slate">{s.description}</p>}
            <SettingsSection settingKey={s.key} fields={s.fields} values={(values[s.key] as Record<string, unknown>) ?? {}} />
          </Card>
        ))}
        <Card title="Testimonials">
          <TestimonialsEditor initial={((values.testimonials as { items?: Testimonial[] })?.items ?? []) as Testimonial[]} />
        </Card>
      </div>
    </>
  );
}
