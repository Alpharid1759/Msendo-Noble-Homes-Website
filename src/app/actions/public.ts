// src/app/actions/public.ts
"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { ENQUIRY_CATEGORY_LABEL, formatDateTime } from "@/lib/format";
import type { FormState } from "@/lib/form-state";
import { toLagosDate, validateInspectionSlot } from "@/lib/inspection-rules";
import { adminUrl, renderEmail, sendEmail } from "@/lib/notifications/email";
import { getPrivateSetting } from "@/lib/private-settings";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, getRequestFingerprint, hashValue } from "@/lib/security/request";
import { isLikelyBot, verifyTurnstile } from "@/lib/security/spam";
import { getSettings } from "@/lib/settings";
import { createServiceSupabase } from "@/lib/supabase/admin";
import {
  enquirySchema,
  fieldErrors,
  formToObject,
  inspectionSchema,
  listingSubmissionSchema,
  newsletterSchema,
} from "@/lib/validation/public-forms";

const NOT_CONFIGURED: FormState = {
  status: "error",
  message: "Online forms are not connected yet. Please call or WhatsApp us instead.",
};

const RATE_LIMITED: FormState = {
  status: "error",
  message: "You have sent several requests in a short time. Please wait a few minutes and try again, or call us.",
};

const SAVE_FAILED: FormState = {
  status: "error",
  message: "We could not save your request. Please try again, or call or WhatsApp us.",
};

async function guard(form: FormData, bucket: string, limit: number, windowSeconds: number): Promise<FormState | null> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (isLikelyBot(form)) {
    return { status: "error", message: "Your request could not be verified. Please reload the page and try again." };
  }
  const ip = await getClientIp();
  const human = await verifyTurnstile(String(form.get("cf-turnstile-response") ?? "") || null, ip);
  if (!human) return { status: "error", message: "Please complete the verification check and try again." };
  const allowed = await checkRateLimit(`${bucket}:${hashValue(ip)}`, limit, windowSeconds);
  if (!allowed) return RATE_LIMITED;
  return null;
}

async function notifyAdmins(subject: string, html: string, related: { type: string; id: string }, replyTo?: string) {
  const { admin_emails } = await getPrivateSetting("notifications");
  await sendEmail({ to: admin_emails, subject, html, template: `admin.${related.type}`, related, replyTo });
}

export async function submitEnquiry(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  const blocked = await guard(form, "enquiry", 5, 600);
  if (blocked) return { ...blocked, values };

  const parsed = enquirySchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  }
  const input = parsed.data;
  const settings = await getSettings();
  const supabase = createServiceSupabase();
  const fp = await getRequestFingerprint();

  let propertyId: string | null = null;
  let propertyTitle: string | null = null;
  if (input.property_reference) {
    const { data } = await supabase
      .from("properties")
      .select("id, title, reference")
      .eq("reference", input.property_reference.toUpperCase())
      .maybeSingle();
    if (data) {
      propertyId = data.id;
      propertyTitle = data.title;
    }
  }

  const dedupeKey = hashValue(
    [input.email ?? input.phone, input.property_reference ?? "", input.message.slice(0, 200), new Date().toISOString().slice(0, 10)].join("|"),
  );

  const { data: enquiry, error } = await supabase
    .from("enquiries")
    .insert({
      property_id: propertyId,
      property_reference: input.property_reference?.toUpperCase() ?? null,
      category: propertyId && input.category === "general" ? "property_enquiry" : input.category,
      full_name: input.full_name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      preferred_contact: input.preferred_contact ?? null,
      subject: input.subject ?? null,
      message: input.message,
      source: "website",
      source_path: input.source_path ?? fp.referer,
      consent_given: true,
      consent_version: settings.privacy.consent_version,
      consent_at: new Date().toISOString(),
      ip_hash: fp.ipHash,
      user_agent: fp.userAgent,
      dedupe_key: dedupeKey,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") redirect("/thank-you?type=enquiry&duplicate=1");
    return { ...SAVE_FAILED, values };
  }

  await supabase.from("consent_records").insert({
    subject_email: input.email ?? null,
    purpose: "enquiry_response",
    granted: true,
    policy_version: settings.privacy.consent_version,
    source: "enquiry_form",
    ip_hash: fp.ipHash,
  });

  const rows = [
    { label: "Name", value: input.full_name },
    { label: "Email", value: input.email },
    { label: "Phone", value: input.phone },
    { label: "Preferred contact", value: input.preferred_contact },
    { label: "Category", value: ENQUIRY_CATEGORY_LABEL[input.category] },
    { label: "Property", value: input.property_reference ? `${input.property_reference}${propertyTitle ? ` (${propertyTitle})` : ""}` : null },
    { label: "Subject", value: input.subject },
    { label: "Message", value: input.message },
  ];

  await notifyAdmins(
    `New enquiry from ${input.full_name}${input.property_reference ? ` about ${input.property_reference}` : ""}`,
    renderEmail({ heading: "New website enquiry", intro: "A new enquiry was submitted on the website.", rows, cta: { label: "Open in admin", url: adminUrl(`/admin/enquiries/${enquiry.id}`) } }),
    { type: "enquiry", id: enquiry.id },
    input.email,
  );

  const { send_customer_confirmations } = await getPrivateSetting("notifications");
  if (send_customer_confirmations && input.email) {
    await sendEmail({
      to: input.email,
      subject: "We have received your enquiry",
      template: "customer.enquiry_received",
      related: { type: "enquiry", id: enquiry.id },
      html: renderEmail({
        heading: `Thank you, ${input.full_name.split(" ")[0]}`,
        intro: `We have received your enquiry and a member of the ${settings.company.brand_name} team will contact you. If your request is urgent, call ${settings.contact.phone_display}.`,
        rows: [
          { label: "Property", value: input.property_reference },
          { label: "Your message", value: input.message },
        ],
      }),
    });
  }

  redirect(`/thank-you?type=enquiry${input.property_reference ? `&ref=${encodeURIComponent(input.property_reference)}` : ""}`);
}

export async function requestInspection(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  const blocked = await guard(form, "inspection", 4, 600);
  if (blocked) return { ...blocked, values };

  const parsed = inspectionSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  }
  const input = parsed.data;
  const settings = await getSettings();

  const requested = toLagosDate(input.preferred_date, input.preferred_time);
  const slotError = validateInspectionSlot(requested, settings.inspections);
  if (slotError) {
    return { status: "error", message: "Please choose another time.", fieldErrors: { preferred_date: slotError }, values };
  }
  let alternative: Date | null = null;
  if (input.alternative_date && input.alternative_time) {
    alternative = toLagosDate(input.alternative_date, input.alternative_time);
    const altError = validateInspectionSlot(alternative, settings.inspections);
    if (altError) {
      return { status: "error", message: "Please choose another alternative time.", fieldErrors: { alternative_date: altError }, values };
    }
  }

  const supabase = createServiceSupabase();
  const { data: property } = await supabase
    .from("properties")
    .select("id, title, reference, status")
    .eq("reference", input.property_reference)
    .in("status", ["published", "reserved"])
    .maybeSingle();
  if (!property) {
    return {
      status: "error",
      message: "That property is not available for inspection. Check the reference or contact us.",
      fieldErrors: { property_reference: "Property not found or no longer available" },
      values,
    };
  }

  const fp = await getRequestFingerprint();
  const dedupeKey = hashValue([input.phone, property.id, input.preferred_date].join("|"));

  const { data: inspection, error } = await supabase
    .from("inspections")
    .insert({
      property_id: property.id,
      full_name: input.full_name,
      email: input.email ?? null,
      phone: input.phone,
      requested_at: requested.toISOString(),
      alternative_at: alternative?.toISOString() ?? null,
      attendees: input.attendees,
      customer_notes: input.notes ?? null,
      status: "requested",
      consent_given: true,
      consent_version: settings.privacy.consent_version,
      ip_hash: fp.ipHash,
      dedupe_key: dedupeKey,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") redirect(`/thank-you?type=inspection&duplicate=1&ref=${property.reference}`);
    return { ...SAVE_FAILED, values };
  }

  await supabase.from("consent_records").insert({
    subject_email: input.email ?? null,
    purpose: "inspection_booking",
    granted: true,
    policy_version: settings.privacy.consent_version,
    source: "inspection_form",
    ip_hash: fp.ipHash,
  });

  await notifyAdmins(
    `Inspection request for ${property.reference}`,
    renderEmail({
      heading: "New inspection request",
      intro: "A visitor has requested an inspection. It is not confirmed until a staff member confirms it in the admin.",
      rows: [
        { label: "Property", value: `${property.reference} (${property.title})` },
        { label: "Name", value: input.full_name },
        { label: "Phone", value: input.phone },
        { label: "Email", value: input.email },
        { label: "Preferred", value: formatDateTime(requested) },
        { label: "Alternative", value: alternative ? formatDateTime(alternative) : null },
        { label: "Attendees", value: String(input.attendees) },
        { label: "Notes", value: input.notes },
      ],
      cta: { label: "Review request", url: adminUrl(`/admin/inspections/${inspection.id}`) },
    }),
    { type: "inspection", id: inspection.id },
    input.email,
  );

  const { send_customer_confirmations } = await getPrivateSetting("notifications");
  if (send_customer_confirmations && input.email) {
    await sendEmail({
      to: input.email,
      subject: `Inspection request received for ${property.reference}`,
      template: "customer.inspection_requested",
      related: { type: "inspection", id: inspection.id },
      html: renderEmail({
        heading: "Your inspection request is with us",
        intro: "This is a request, not a confirmed appointment. We will contact you to confirm a time before you travel.",
        rows: [
          { label: "Property", value: `${property.reference} (${property.title})` },
          { label: "Requested time", value: formatDateTime(requested) },
          { label: "Alternative", value: alternative ? formatDateTime(alternative) : null },
        ],
      }),
    });
  }

  redirect(`/thank-you?type=inspection&ref=${property.reference}`);
}

export async function submitListing(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  const blocked = await guard(form, "listing", 3, 1800);
  if (blocked) return { ...blocked, values };

  const parsed = listingSubmissionSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  }
  const input = parsed.data;
  const settings = await getSettings();
  const supabase = createServiceSupabase();
  const fp = await getRequestFingerprint();

  const details = {
    relationship: input.relationship,
    transaction_type: input.transaction_type,
    property_type: input.property_type,
    location: input.location,
    bedrooms: input.bedrooms ?? null,
    asking_price: input.asking_price ?? null,
    title_document: input.title_document ?? null,
  };

  const { data: enquiry, error } = await supabase
    .from("enquiries")
    .insert({
      category: "listing_submission",
      full_name: input.full_name,
      email: input.email ?? null,
      phone: input.phone,
      subject: `${input.property_type} in ${input.location} (${input.transaction_type})`,
      message: input.description,
      details,
      source: "list_your_property",
      consent_given: true,
      consent_version: settings.privacy.consent_version,
      consent_at: new Date().toISOString(),
      ip_hash: fp.ipHash,
      user_agent: fp.userAgent,
      dedupe_key: hashValue([input.phone, input.location, input.description.slice(0, 120), new Date().toISOString().slice(0, 10)].join("|")),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") redirect("/thank-you?type=listing&duplicate=1");
    return { ...SAVE_FAILED, values };
  }

  await notifyAdmins(
    `New property submission: ${input.property_type} in ${input.location}`,
    renderEmail({
      heading: "New property submitted for listing",
      intro: "Review this submission before anything is published.",
      rows: [
        { label: "Name", value: input.full_name },
        { label: "Phone", value: input.phone },
        { label: "Email", value: input.email },
        { label: "Relationship", value: input.relationship },
        { label: "Transaction", value: input.transaction_type },
        { label: "Property type", value: input.property_type },
        { label: "Location", value: input.location },
        { label: "Bedrooms", value: input.bedrooms?.toString() },
        { label: "Asking price", value: input.asking_price },
        { label: "Title document", value: input.title_document },
        { label: "Description", value: input.description },
      ],
      cta: { label: "Open in admin", url: adminUrl(`/admin/enquiries/${enquiry.id}`) },
    }),
    { type: "enquiry", id: enquiry.id },
    input.email,
  );

  redirect("/thank-you?type=listing");
}

export async function subscribeNewsletter(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formToObject(form);
  const blocked = await guard(form, "newsletter", 5, 3600);
  if (blocked) return { ...blocked, values };

  const parsed = newsletterSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  }
  const settings = await getSettings();
  const supabase = createServiceSupabase();
  const fp = await getRequestFingerprint();

  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existing?.status === "subscribed") {
    return { status: "success", message: "You are already subscribed. Thank you." };
  }

  const payload = {
    email: parsed.data.email,
    status: "subscribed" as const,
    consent_version: settings.privacy.consent_version,
    consent_at: new Date().toISOString(),
    unsubscribed_at: null,
    source: "website",
  };

  const result = existing
    ? await supabase.from("newsletter_subscribers").update(payload).eq("id", existing.id).select("unsubscribe_token").single()
    : await supabase.from("newsletter_subscribers").insert(payload).select("unsubscribe_token").single();

  if (result.error) return { ...SAVE_FAILED, values };

  await supabase.from("consent_records").insert({
    subject_email: parsed.data.email,
    purpose: "newsletter",
    granted: true,
    policy_version: settings.privacy.consent_version,
    source: "newsletter_form",
    ip_hash: fp.ipHash,
  });

  await sendEmail({
    to: parsed.data.email,
    subject: `You are subscribed to ${settings.company.brand_name} updates`,
    template: "customer.newsletter_welcome",
    html: renderEmail({
      heading: "Thanks for subscribing",
      intro: "You will receive occasional property insights and new listing updates. You can unsubscribe at any time.",
      cta: { label: "Unsubscribe", url: adminUrl(`/newsletter/unsubscribe?token=${result.data.unsubscribe_token}`) },
    }),
  });

  return { status: "success", message: "You are subscribed. Look out for our next update." };
}

export async function unsubscribeNewsletter(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const token = String(form.get("token") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { status: "error", message: "This unsubscribe link is not valid." };
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("email")
    .maybeSingle();
  if (error) return SAVE_FAILED;
  if (!data) return { status: "error", message: "This unsubscribe link is not valid or has already been used." };
  const settings = await getSettings();
  await supabase.from("consent_records").insert({
    subject_email: data.email,
    purpose: "newsletter",
    granted: false,
    policy_version: settings.privacy.consent_version,
    source: "unsubscribe_link",
  });
  return { status: "success", message: "You have been unsubscribed. You will not receive further newsletters." };
}
