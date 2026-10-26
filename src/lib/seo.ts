// src/lib/seo.ts
import type { Metadata } from "next";
import { activeFilterCount, parseListingFilters, type RawSearchParams } from "@/lib/search-params";

export function listingMetadata(opts: { title: string; description: string; path: string; params: RawSearchParams }): Metadata {
  const filters = parseListingFilters(opts.params);
  const filtered = activeFilterCount(filters) > 0 || (filters.page ?? 1) > 1 || Boolean(filters.sort) || Boolean(filters.view);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: opts.title, description: opts.description, url: opts.path },
  };
}

export function truncate(text: string, max = 158) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
