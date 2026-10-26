// src/lib/contact-links.ts
import { formatPrice } from "@/lib/format";
import type { BillingFrequency } from "@/types/domain";

export function normalizeWhatsAppNumber(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  return digits;
}

export function whatsappUrl(number: string, message?: string) {
  const n = normalizeWhatsAppNumber(number);
  const base = `https://wa.me/${n}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function propertyWhatsAppMessage(
  brand: string,
  p: {
    reference: string;
    title: string;
    price: number | null;
    price_on_request: boolean;
    currency: string;
    billing_frequency: BillingFrequency;
  },
  pageUrl?: string,
) {
  const price = formatPrice(p);
  const priceText = p.price_on_request ? "(price on request)" : `listed at ${price.amount}${price.suffix ? ` ${price.suffix}` : ""}`;
  const lines = [
    `Hello ${brand}, I am interested in Property ${p.reference} (${p.title}) ${priceText}.`,
    "Please provide further information and inspection availability.",
  ];
  if (pageUrl) lines.push(pageUrl);
  return lines.join(" ");
}

export function telUrl(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function mailtoUrl(email: string, subject?: string, body?: string) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString().replace(/\+/g, "%20");
  return `mailto:${email}${qs ? `?${qs}` : ""}`;
}
