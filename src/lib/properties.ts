// src/lib/properties.ts
import "server-only";
import { cachedQuery as unstable_cache } from "@/lib/cache";
import { isSupabaseConfigured } from "@/lib/env";
import type { ListingFilters, ListingScope } from "@/lib/search-params";
import { createPublicSupabase } from "@/lib/supabase/server";
import type {
  Category,
  LocationRow,
  PropertyCardData,
  PublicCharge,
  PublicMedia,
  PublicProperty,
} from "@/types/domain";

export const PAGE_SIZE = 12;

export const CARD_COLUMNS =
  "id, reference, title, slug, transaction_type, status, is_listed, price, price_on_request, currency, billing_frequency, category_name, category_slug, district_name, city_name, bedrooms, bathrooms, land_area, floor_area, area_unit, furnishing, is_featured, is_demo, published_at, cover_variants, cover_alt, image_count, video_count, description";

export interface ListingResult {
  items: PropertyCardData[];
  total: number;
  page: number;
  pageCount: number;
  error: string | null;
}

const EMPTY: ListingResult = { items: [], total: 0, page: 1, pageCount: 0, error: null };

async function resolveLocationIds(slug: string): Promise<string[]> {
  const supabase = createPublicSupabase();
  const { data } = await supabase.rpc("location_descendants", { p_slug: slug });
  if (!Array.isArray(data)) return [];
  return data.map((row: unknown) =>
    typeof row === "string" ? row : (row as { location_descendants: string }).location_descendants,
  );
}

async function searchListingsUncached(scope: ListingScope, filters: ListingFilters, mediaRequirement: "any" | "image" | "video" = "any"): Promise<ListingResult> {
  if (!isSupabaseConfigured()) {
    return { ...EMPTY, error: "Listings are not connected yet. Configure Supabase to load properties." };
  }
  const supabase = createPublicSupabase();
  const page = filters.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from("public_properties").select(CARD_COLUMNS, { count: "exact" }).eq("is_listed", true);

  if (scope === "sale") {
    query = query.eq("transaction_type", "sale");
  } else if (scope === "rent") {
    if (filters.rental === "short") query = query.eq("transaction_type", "short_let");
    else if (filters.rental === "long") query = query.eq("transaction_type", "rent");
    else query = query.in("transaction_type", ["rent", "short_let"]);
  } else if (filters.tx) {
    query = query.eq("transaction_type", filters.tx);
  }

  if (mediaRequirement === "image") query = query.gt("image_count", 0);
  if (mediaRequirement === "video") query = query.gt("video_count", 0);

  if (filters.category) query = query.eq("category_slug", filters.category);
  if (filters.location) {
    const ids = await resolveLocationIds(filters.location);
    if (ids.length === 0) return { ...EMPTY, page };
    query = query.in("location_id", ids);
  }
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.beds !== undefined && filters.beds > 0) query = query.gte("bedrooms", filters.beds);
  if (filters.baths !== undefined && filters.baths > 0) query = query.gte("bathrooms", filters.baths);
  if (filters.ref) query = query.eq("reference", filters.ref);
  if (filters.furnishing) query = query.eq("furnishing", filters.furnishing);
  if (filters.billing && scope !== "sale") query = query.eq("billing_frequency", filters.billing);
  if (filters.minArea !== undefined) query = query.or(`floor_area.gte.${filters.minArea},land_area.gte.${filters.minArea}`);
  if (filters.maxArea !== undefined) query = query.or(`floor_area.lte.${filters.maxArea},land_area.lte.${filters.maxArea}`);
  if (filters.verified) query = query.eq("title_verified", true);
  if (filters.availability === "available") query = query.eq("status", "published");
  if (filters.availability === "reserved") query = query.eq("status", "reserved");
  if (filters.featured) query = query.eq("is_featured", true);
  if (filters.q) query = query.textSearch("search_vector", filters.q, { type: "websearch", config: "english" });

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("published_at", { ascending: false, nullsFirst: false });
  }
  query = query.order("id", { ascending: true }).range(from, to);

  const { data, count, error } = await query;
  if (error) {
    if (error.code === "PGRST103") return { ...EMPTY, page };
    return { ...EMPTY, page, error: "We could not load listings right now. Please try again shortly." };
  }
  const total = count ?? 0;
  return {
    items: (data ?? []) as unknown as PropertyCardData[],
    total,
    page,
    pageCount: Math.ceil(total / PAGE_SIZE),
    error: null,
  };
}

export const searchListings = unstable_cache(searchListingsUncached, ["search-listings"], {
  tags: ["properties"],
  revalidate: 300,
});

export const getFeaturedListings = unstable_cache(
  async (limit = 6): Promise<PropertyCardData[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    const featured = await supabase
      .from("public_properties")
      .select(CARD_COLUMNS)
      .eq("is_listed", true)
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(limit);
    const items = (featured.data ?? []) as unknown as PropertyCardData[];
    if (items.length >= limit) return items;
    const latest = await supabase
      .from("public_properties")
      .select(CARD_COLUMNS)
      .eq("is_listed", true)
      .eq("is_featured", false)
      .order("published_at", { ascending: false })
      .limit(limit - items.length);
    return [...items, ...((latest.data ?? []) as unknown as PropertyCardData[])];
  },
  ["featured-listings"],
  { tags: ["properties"], revalidate: 300 },
);

export const getPropertyBySlug = unstable_cache(
  async (slug: string): Promise<{ property: PublicProperty | null; redirectTo: string | null }> => {
    if (!isSupabaseConfigured()) return { property: null, redirectTo: null };
    const supabase = createPublicSupabase();
    const { data } = await supabase.from("public_properties").select("*").eq("slug", slug).maybeSingle();
    if (data) return { property: data as unknown as PublicProperty, redirectTo: null };
    const redirect = await supabase.from("property_slug_redirects").select("property_id").eq("old_slug", slug).maybeSingle();
    if (redirect.data?.property_id) {
      const target = await supabase.from("public_properties").select("slug").eq("id", redirect.data.property_id).maybeSingle();
      if (target.data?.slug) return { property: null, redirectTo: target.data.slug as string };
    }
    return { property: null, redirectTo: null };
  },
  ["property-by-slug"],
  { tags: ["properties"], revalidate: 300 },
);

export const getPropertyByReference = unstable_cache(
  async (reference: string): Promise<PropertyCardData | null> => {
    if (!isSupabaseConfigured()) return null;
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from("public_properties")
      .select(CARD_COLUMNS)
      .eq("reference", reference.toUpperCase())
      .eq("is_listed", true)
      .maybeSingle();
    return (data as unknown as PropertyCardData) ?? null;
  },
  ["property-by-reference"],
  { tags: ["properties"], revalidate: 300 },
);

export const getPropertyMedia = unstable_cache(
  async (propertyId: string): Promise<PublicMedia[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from("public_property_media")
      .select("*")
      .eq("property_id", propertyId)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });
    return (data ?? []) as unknown as PublicMedia[];
  },
  ["property-media"],
  { tags: ["properties", "media"], revalidate: 300 },
);

export const getMediaForProperties = unstable_cache(
  async (propertyIds: string[], mediaType: "image" | "video"): Promise<PublicMedia[]> => {
    if (!isSupabaseConfigured() || propertyIds.length === 0) return [];
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from("public_property_media")
      .select("*")
      .in("property_id", propertyIds)
      .eq("media_type", mediaType)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });
    return (data ?? []) as unknown as PublicMedia[];
  },
  ["media-for-properties"],
  { tags: ["properties", "media"], revalidate: 300 },
);

export const getPropertyCharges = unstable_cache(
  async (propertyId: string): Promise<PublicCharge[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from("public_property_charges")
      .select("*")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true });
    return (data ?? []) as unknown as PublicCharge[];
  },
  ["property-charges"],
  { tags: ["properties"], revalidate: 300 },
);

export const getSimilarListings = unstable_cache(
  async (property: { id: string; transaction_type: string; category_slug: string; district_name: string | null }, limit = 3): Promise<PropertyCardData[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    const txGroup = property.transaction_type === "sale" ? ["sale"] : ["rent", "short_let"];
    const { data } = await supabase
      .from("public_properties")
      .select(CARD_COLUMNS)
      .eq("is_listed", true)
      .in("transaction_type", txGroup)
      .eq("category_slug", property.category_slug)
      .neq("id", property.id)
      .order("published_at", { ascending: false })
      .limit(limit);
    const items = (data ?? []) as unknown as PropertyCardData[];
    if (items.length >= limit) return items;
    const more = await supabase
      .from("public_properties")
      .select(CARD_COLUMNS)
      .eq("is_listed", true)
      .in("transaction_type", txGroup)
      .neq("id", property.id)
      .not("id", "in", `(${[property.id, ...items.map((i) => i.id)].join(",")})`)
      .order("published_at", { ascending: false })
      .limit(limit - items.length);
    return [...items, ...((more.data ?? []) as unknown as PropertyCardData[])];
  },
  ["similar-listings"],
  { tags: ["properties"], revalidate: 300 },
);

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from("property_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as Category[];
  },
  ["categories"],
  { tags: ["taxonomy"], revalidate: 3600 },
);

export const getLocations = unstable_cache(
  async (): Promise<LocationRow[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("is_active", true)
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true });
    return (data ?? []) as LocationRow[];
  },
  ["locations"],
  { tags: ["taxonomy"], revalidate: 3600 },
);

export const getListingCountsByLocation = unstable_cache(
  async (): Promise<Record<string, number>> => {
    if (!isSupabaseConfigured()) return {};
    const supabase = createPublicSupabase();
    const { data } = await supabase.from("public_properties").select("location_id").eq("is_listed", true).limit(5000);
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { location_id: string }[]) {
      counts[row.location_id] = (counts[row.location_id] ?? 0) + 1;
    }
    return counts;
  },
  ["listing-counts-by-location"],
  { tags: ["properties"], revalidate: 600 },
);

export const getListingCountsByCategory = unstable_cache(
  async (): Promise<Record<string, number>> => {
    if (!isSupabaseConfigured()) return {};
    const supabase = createPublicSupabase();
    const { data } = await supabase.from("public_properties").select("category_slug").eq("is_listed", true).limit(5000);
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { category_slug: string }[]) {
      counts[row.category_slug] = (counts[row.category_slug] ?? 0) + 1;
    }
    return counts;
  },
  ["listing-counts-by-category"],
  { tags: ["properties"], revalidate: 600 },
);

export const getSitemapListings = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string; is_listed: boolean }[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = createPublicSupabase();
    const { data } = await supabase.from("public_properties").select("slug, updated_at, is_listed").limit(10000);
    return (data ?? []) as { slug: string; updated_at: string; is_listed: boolean }[];
  },
  ["sitemap-listings"],
  { tags: ["properties"], revalidate: 3600 },
);
