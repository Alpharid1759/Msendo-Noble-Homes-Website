// src/lib/search-params.ts
import { z } from "zod";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "relevance", label: "Best match" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export type ListingScope = "all" | "sale" | "rent";

const positiveNumber = z.coerce.number().finite().min(0).max(1e13);
const smallInt = z.coerce.number().int().min(0).max(50);
const slug = z.string().trim().regex(/^[a-z0-9-]{1,80}$/);

const fieldSchemas = {
  q: z.string().trim().min(1).max(100),
  tx: z.enum(["sale", "rent", "short_let"]),
  category: slug,
  location: slug,
  minPrice: positiveNumber,
  maxPrice: positiveNumber,
  beds: smallInt,
  baths: smallInt,
  ref: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,20}$/),
  furnishing: z.enum(["unfurnished", "semi_furnished", "furnished", "serviced"]),
  rental: z.enum(["long", "short"]),
  billing: z.enum(["per_month", "per_year", "per_night", "per_week"]),
  minArea: positiveNumber,
  maxArea: positiveNumber,
  verified: z.literal("1"),
  availability: z.enum(["available", "reserved"]),
  featured: z.literal("1"),
  sort: z.enum(["newest", "price_asc", "price_desc", "relevance"]),
  page: z.coerce.number().int().min(1).max(500),
  view: z.enum(["grid", "list"]),
} as const;

export type ListingFilters = {
  -readonly [K in keyof typeof fieldSchemas]?: z.infer<(typeof fieldSchemas)[K]>;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseListingFilters(raw: RawSearchParams): ListingFilters {
  const result: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(fieldSchemas)) {
    const value = raw[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (single === undefined || single === "") continue;
    const parsed = (schema as z.ZodType).safeParse(single);
    if (parsed.success) result[key] = parsed.data;
  }
  const filters = result as ListingFilters;
  if (filters.q && /^[a-z]{2,5}-[a-z]{1,2}-\d{3,6}$/i.test(filters.q)) {
    filters.ref = filters.q.toUpperCase();
    delete filters.q;
  }
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    [filters.minPrice, filters.maxPrice] = [filters.maxPrice, filters.minPrice];
  }
  if (filters.minArea !== undefined && filters.maxArea !== undefined && filters.minArea > filters.maxArea) {
    [filters.minArea, filters.maxArea] = [filters.maxArea, filters.minArea];
  }
  return filters;
}

export function filtersToQuery(filters: ListingFilters, overrides: Partial<Record<keyof ListingFilters, string | number | null>> = {}) {
  const params = new URLSearchParams();
  const merged: Record<string, unknown> = { ...filters, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export function activeFilterCount(filters: ListingFilters) {
  const ignored = new Set(["sort", "page", "view"]);
  return Object.keys(filters).filter((k) => !ignored.has(k)).length;
}
