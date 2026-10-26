// src/types/domain.ts
export type TransactionType = "sale" | "rent" | "short_let";

export type PropertyStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "reserved"
  | "sold"
  | "rented"
  | "unavailable"
  | "archived";

export type BillingFrequency = "one_off" | "per_night" | "per_week" | "per_month" | "per_year";

export type FurnishingStatus = "unfurnished" | "semi_furnished" | "furnished" | "serviced";

export type AreaUnit = "sqm" | "sqft" | "hectare" | "acre" | "plot";

export type ChargeType =
  | "caution_deposit"
  | "agency_fee"
  | "legal_fee"
  | "service_charge"
  | "agreement_fee"
  | "other";

export type MediaType = "image" | "video";

export type MediaStatus = "uploading" | "processing" | "ready" | "failed";

export type EnquiryCategory =
  | "general"
  | "buying"
  | "renting"
  | "short_let"
  | "property_enquiry"
  | "listing_submission"
  | "property_management"
  | "investment"
  | "verification_request"
  | "report_listing"
  | "data_request"
  | "other";

export type EnquiryStatus =
  | "new"
  | "contacted"
  | "inspection_scheduled"
  | "in_progress"
  | "converted"
  | "closed"
  | "spam";

export type InspectionStatus = "requested" | "confirmed" | "rescheduled" | "cancelled" | "completed" | "no_show";

export type PostStatus = "draft" | "scheduled" | "published" | "archived";

export type ImageVariants = Partial<Record<"400" | "800" | "1600", string>>;

export interface PublicProperty {
  id: string;
  reference: string;
  title: string;
  slug: string;
  description: string;
  transaction_type: TransactionType;
  status: PropertyStatus;
  is_listed: boolean;
  price: number | null;
  price_on_request: boolean;
  currency: string;
  billing_frequency: BillingFrequency;
  is_negotiable: boolean;
  category_id: string;
  category_name: string;
  category_slug: string;
  location_id: string;
  country: string;
  state_name: string | null;
  city_name: string | null;
  district_name: string | null;
  address_line: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  parking_spaces: number | null;
  land_area: number | null;
  floor_area: number | null;
  area_unit: AreaUnit;
  furnishing: FurnishingStatus | null;
  amenities: string[];
  attributes: Record<string, string | number | boolean>;
  available_from: string | null;
  lease_min_months: number | null;
  title_document: string | null;
  title_verified: boolean;
  title_verified_at: string | null;
  virtual_tour_url: string | null;
  is_featured: boolean;
  is_demo: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  updated_at: string;
  cover_variants: ImageVariants | null;
  cover_alt: string | null;
  image_count: number;
  video_count: number;
}

export type PropertyCardData = Pick<
  PublicProperty,
  | "id"
  | "reference"
  | "title"
  | "slug"
  | "transaction_type"
  | "status"
  | "is_listed"
  | "price"
  | "price_on_request"
  | "currency"
  | "billing_frequency"
  | "category_name"
  | "category_slug"
  | "district_name"
  | "city_name"
  | "bedrooms"
  | "bathrooms"
  | "land_area"
  | "floor_area"
  | "area_unit"
  | "furnishing"
  | "is_featured"
  | "is_demo"
  | "published_at"
  | "cover_variants"
  | "cover_alt"
  | "image_count"
  | "video_count"
  | "description"
>;

export interface PublicMedia {
  id: string;
  property_id: string;
  media_type: MediaType;
  bucket: string;
  storage_path: string;
  variants: ImageVariants;
  poster_path: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  description: string | null;
  sort_order: number;
  is_featured: boolean;
}

export interface PublicCharge {
  id: string;
  property_id: string;
  charge_type: ChargeType;
  label: string;
  amount: number | null;
  is_percentage: boolean;
  billing_frequency: BillingFrequency;
  notes: string | null;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface LocationRow {
  id: string;
  parent_id: string | null;
  type: "country" | "state" | "city" | "district";
  name: string;
  slug: string;
  description: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface PublicBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body_html: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  og_image_url: string | null;
  author_name: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  tags: string[];
  published_at: string;
  updated_at: string;
  reading_minutes: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface SiteSettings {
  company: {
    brand_name: string;
    legal_name: string;
    tagline: string;
    short_description: string;
    rc_number: string | null;
  };
  contact: {
    phone: string;
    phone_display: string;
    email: string;
    whatsapp_number: string;
    whatsapp_link: string;
    address_line: string;
    city: string;
    state: string;
    country: string;
    maps_url: string;
    business_hours: string | null;
  };
  social: Record<"facebook" | "instagram" | "x" | "linkedin" | "youtube" | "tiktok", string | null>;
  brand: { logo_url: string | null; logo_white_url: string | null; hero_image_url: string | null };
  seo: {
    default_title: string;
    default_description: string;
    og_image_url: string | null;
    google_site_verification: string | null;
  };
  analytics: { ga_measurement_id: string | null; require_consent: boolean };
  privacy: { consent_version: string; data_protection_email: string; enquiry_retention_months: number };
  testimonials: { items: Testimonial[] };
  inspections: {
    slot_minutes: number;
    earliest_hour: number;
    latest_hour: number;
    allow_saturdays: boolean;
    saturday_earliest_hour: number;
    saturday_latest_hour: number;
    min_notice_hours: number;
    max_days_ahead: number;
    allow_sundays: boolean;
  };
}

export interface Testimonial {
  name: string;
  context: string | null;
  quote: string;
  permission_confirmed: boolean;
}
