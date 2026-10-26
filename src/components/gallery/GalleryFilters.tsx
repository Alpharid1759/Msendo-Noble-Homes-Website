// src/components/gallery/GalleryFilters.tsx
import Link from "next/link";
import { PRICE_OPTIONS } from "@/components/property/filter-options";
import type { ListingFilters } from "@/lib/search-params";
import type { Category, LocationRow } from "@/types/domain";

const ctl = "h-11 w-full rounded-[var(--radius-control)] border border-line bg-white px-3 text-[0.9375rem]";

export function GalleryFilters({
  basePath,
  filters,
  categories,
  locations,
}: {
  basePath: string;
  filters: ListingFilters;
  categories: Category[];
  locations: LocationRow[];
}) {
  const districts = locations.filter((l) => l.type === "district");
  const hasFilters = Boolean(filters.location || filters.category || filters.minPrice || filters.maxPrice);
  return (
    <form action={basePath} method="get" className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto]">
      <div>
        <label htmlFor="g-location" className="mb-1 block text-xs font-semibold text-slate">
          Location
        </label>
        <select id="g-location" name="location" defaultValue={filters.location ?? ""} className={ctl}>
          <option value="">All locations</option>
          {districts.map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="g-category" className="mb-1 block text-xs font-semibold text-slate">
          Property type
        </label>
        <select id="g-category" name="category" defaultValue={filters.category ?? ""} className={ctl}>
          <option value="">All types</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="g-min" className="mb-1 block text-xs font-semibold text-slate">
          Min price
        </label>
        <select id="g-min" name="minPrice" defaultValue={filters.minPrice !== undefined ? String(filters.minPrice) : ""} className={ctl}>
          <option value="">No min</option>
          {PRICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="g-max" className="mb-1 block text-xs font-semibold text-slate">
          Max price
        </label>
        <select id="g-max" name="maxPrice" defaultValue={filters.maxPrice !== undefined ? String(filters.maxPrice) : ""} className={ctl}>
          <option value="">No max</option>
          {PRICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button type="submit" className="inline-flex h-11 flex-1 items-center justify-center rounded-[var(--radius-control)] bg-navy-800 px-5 text-sm font-semibold text-white hover:bg-navy-700">
          Filter
        </button>
        {hasFilters && (
          <Link href={basePath} className="inline-flex h-11 items-center px-2 text-sm font-semibold text-navy-700 underline underline-offset-2">
            Reset
          </Link>
        )}
      </div>
    </form>
  );
}
