// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { SERVICES } from "@/content/services";
import { getSitemapPosts } from "@/lib/blog";
import { publicEnv } from "@/lib/env";
import { getListingCountsByLocation, getLocations, getSitemapListings } from "@/lib/properties";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const now = new Date();
  const staticPaths = [
    "",
    "/about",
    "/properties",
    "/properties/for-sale",
    "/properties/for-rent",
    "/search",
    "/gallery/photos/for-sale",
    "/gallery/photos/for-rent",
    "/gallery/videos/for-sale",
    "/gallery/videos/for-rent",
    "/services",
    "/blog",
    "/contact",
    "/faq",
    "/list-your-property",
    "/schedule-inspection",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
    "/legal/listing-disclaimer",
    "/legal/accessibility",
  ];

  const [listings, posts, locations, counts] = await Promise.all([
    getSitemapListings(),
    getSitemapPosts(),
    getLocations(),
    getListingCountsByLocation(),
  ]);

  return [
    ...staticPaths.map((p) => ({
      url: `${base}${p}`,
      lastModified: now,
      changeFrequency: (p.startsWith("/legal") ? "yearly" : p === "" || p.startsWith("/properties") ? "daily" : "weekly") as "daily",
      priority: p === "" ? 1 : p.startsWith("/properties") ? 0.9 : 0.6,
    })),
    ...SERVICES.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...listings
      .filter((l) => l.is_listed)
      .map((l) => ({ url: `${base}/properties/${l.slug}`, lastModified: new Date(l.updated_at), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.updated_at), changeFrequency: "monthly" as const, priority: 0.5 })),
    ...locations
      .filter((l) => l.type === "district" && (l.is_featured || (counts[l.id] ?? 0) > 0))
      .map((l) => ({ url: `${base}/locations/${l.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
