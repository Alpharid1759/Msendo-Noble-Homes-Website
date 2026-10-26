// src/lib/format.ts
import type {
  AreaUnit,
  BillingFrequency,
  ChargeType,
  EnquiryCategory,
  EnquiryStatus,
  FurnishingStatus,
  InspectionStatus,
  PropertyStatus,
  TransactionType,
} from "@/types/domain";

export function formatMoney(amount: number | null | undefined, currency = "NGN") {
  if (amount === null || amount === undefined) return null;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en-NG")}`;
  }
}

export function formatCompactMoney(amount: number | null | undefined, currency = "NGN") {
  if (amount === null || amount === undefined) return null;
  const symbol = currency === "NGN" ? "₦" : `${currency} `;
  if (amount >= 1_000_000_000) return `${symbol}${trimNumber(amount / 1_000_000_000)}bn`;
  if (amount >= 1_000_000) return `${symbol}${trimNumber(amount / 1_000_000)}m`;
  if (amount >= 1_000) return `${symbol}${trimNumber(amount / 1_000)}k`;
  return `${symbol}${amount}`;
}

function trimNumber(n: number) {
  return n.toFixed(n >= 100 ? 0 : 1).replace(/\.0$/, "");
}

export const BILLING_SUFFIX: Record<BillingFrequency, string> = {
  one_off: "",
  per_night: "per night",
  per_week: "per week",
  per_month: "per month",
  per_year: "per year",
};

export const BILLING_LABEL: Record<BillingFrequency, string> = {
  one_off: "One-off",
  per_night: "Per night",
  per_week: "Per week",
  per_month: "Per month",
  per_year: "Per year",
};

export function formatPrice(input: {
  price: number | null;
  price_on_request: boolean;
  currency: string;
  billing_frequency: BillingFrequency;
}) {
  if (input.price_on_request || input.price === null) {
    return { amount: "Price on request", suffix: "" };
  }
  return {
    amount: formatMoney(input.price, input.currency) ?? "",
    suffix: BILLING_SUFFIX[input.billing_frequency],
  };
}

export const TRANSACTION_LABEL: Record<TransactionType, string> = {
  sale: "For sale",
  rent: "For rent",
  short_let: "Short-let",
};

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Available",
  reserved: "Reserved",
  sold: "Sold",
  rented: "Let",
  unavailable: "Unavailable",
  archived: "Archived",
};

export const FURNISHING_LABEL: Record<FurnishingStatus, string> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-furnished",
  furnished: "Furnished",
  serviced: "Serviced",
};

export const AREA_UNIT_LABEL: Record<AreaUnit, string> = {
  sqm: "m²",
  sqft: "sq ft",
  hectare: "ha",
  acre: "acres",
  plot: "plots",
};

export const CHARGE_LABEL: Record<ChargeType, string> = {
  caution_deposit: "Caution deposit",
  agency_fee: "Agency fee",
  legal_fee: "Legal fee",
  service_charge: "Service charge",
  agreement_fee: "Agreement fee",
  other: "Other charge",
};

export const ENQUIRY_CATEGORY_LABEL: Record<EnquiryCategory, string> = {
  general: "General enquiry",
  buying: "Buying a property",
  renting: "Renting a property",
  short_let: "Short-let booking",
  property_enquiry: "Property enquiry",
  listing_submission: "List a property",
  property_management: "Property management",
  investment: "Investment advisory",
  verification_request: "Verification request",
  report_listing: "Listing report",
  data_request: "Personal data request",
  other: "Other",
};

export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  inspection_scheduled: "Inspection scheduled",
  in_progress: "In progress",
  converted: "Converted",
  closed: "Closed",
  spam: "Spam",
};

export const INSPECTION_STATUS_LABEL: Record<InspectionStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

export function formatArea(value: number | null | undefined, unit: AreaUnit) {
  if (value === null || value === undefined) return null;
  return `${Number(value).toLocaleString("en-NG")} ${AREA_UNIT_LABEL[unit]}`;
}

export function formatLocation(p: { district_name: string | null; city_name: string | null; state_name?: string | null }) {
  return [p.district_name, p.city_name ?? p.state_name].filter(Boolean).join(", ");
}

export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
    ...opts,
  }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return null;
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function isNewListing(publishedAt: string | null, days = 14) {
  if (!publishedAt) return false;
  return Date.now() - new Date(publishedAt).getTime() < days * 86_400_000;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function readingMinutes(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
