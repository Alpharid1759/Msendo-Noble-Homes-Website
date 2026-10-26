// src/components/property/ListingFilters.tsx
"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { ListingFilters as Filters, ListingScope } from "@/lib/search-params";
import type { Category, LocationRow } from "@/types/domain";
import { FURNISHING_OPTIONS, PRICE_OPTIONS, ROOM_OPTIONS } from "./filter-options";

interface Props {
  scope: ListingScope;
  filters: Filters;
  categories: Pick<Category, "id" | "name" | "slug">[];
  locations: Pick<LocationRow, "id" | "name" | "slug" | "type">[];
  basePath: string;
  activeCount: number;
}

const ctl =
  "h-11 w-full rounded-[var(--radius-control)] border border-line bg-white px-3 text-[0.9375rem] focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-700/20";

function Select({ id, name, label, value, options, placeholder }: { id: string; name: string; label: string; value?: string | number; options: { value: string; label: string }[]; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-charcoal">
        {label}
      </label>
      <select id={id} name={name} defaultValue={value !== undefined ? String(value) : ""} className={ctl}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterFields({ scope, filters, categories, locations, idPrefix }: Omit<Props, "basePath" | "activeCount"> & { idPrefix: string }) {
  const districts = locations.filter((l) => l.type === "district");
  const cities = locations.filter((l) => l.type === "city");
  const locationOptions = [
    ...cities.map((c) => ({ value: c.slug, label: `${c.name} (all areas)` })),
    ...districts.map((d) => ({ value: d.slug, label: d.name })),
  ];
  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={id("q")} className="mb-1 block text-sm font-semibold text-charcoal">
          Keyword or reference
        </label>
        <input id={id("q")} name="q" type="search" defaultValue={filters.q ?? filters.ref ?? ""} maxLength={100} className={ctl} placeholder="e.g. duplex, Maitama, MNH-R-01002" />
      </div>

      {scope === "all" && (
        <Select
          id={id("tx")}
          name="tx"
          label="Looking to"
          value={filters.tx}
          placeholder="Buy, rent or short-let"
          options={[
            { value: "sale", label: "Buy" },
            { value: "rent", label: "Rent (long-term)" },
            { value: "short_let", label: "Short-let" },
          ]}
        />
      )}

      {scope === "rent" && (
        <Select
          id={id("rental")}
          name="rental"
          label="Rental type"
          value={filters.rental}
          placeholder="Long-term and short-let"
          options={[
            { value: "long", label: "Long-term rental" },
            { value: "short", label: "Short-let" },
          ]}
        />
      )}

      <Select id={id("category")} name="category" label="Property type" value={filters.category} placeholder="All types" options={categories.map((c) => ({ value: c.slug, label: c.name }))} />
      <Select id={id("location")} name="location" label="Location" value={filters.location} placeholder="All locations" options={locationOptions} />

      <fieldset>
        <legend className="mb-1 block text-sm font-semibold text-charcoal">{scope === "rent" ? "Rent" : "Price"}</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={id("min")} className="sr-only">
              Minimum
            </label>
            <select id={id("min")} name="minPrice" defaultValue={filters.minPrice !== undefined ? String(filters.minPrice) : ""} className={ctl}>
              <option value="">No min</option>
              {PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={id("max")} className="sr-only">
              Maximum
            </label>
            <select id={id("max")} name="maxPrice" defaultValue={filters.maxPrice !== undefined ? String(filters.maxPrice) : ""} className={ctl}>
              <option value="">No max</option>
              {PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {scope === "rent" && (
        <Select
          id={id("billing")}
          name="billing"
          label="Rent period"
          value={filters.billing}
          placeholder="Any period"
          options={[
            { value: "per_year", label: "Per year" },
            { value: "per_month", label: "Per month" },
            { value: "per_week", label: "Per week" },
            { value: "per_night", label: "Per night" },
          ]}
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        <Select id={id("beds")} name="beds" label="Bedrooms" value={filters.beds} placeholder="Any" options={ROOM_OPTIONS} />
        <Select id={id("baths")} name="baths" label="Bathrooms" value={filters.baths} placeholder="Any" options={ROOM_OPTIONS} />
      </div>

      {scope !== "sale" && (
        <Select id={id("furnishing")} name="furnishing" label="Furnishing" value={filters.furnishing} placeholder="Any" options={FURNISHING_OPTIONS} />
      )}

      {scope !== "rent" && (
        <fieldset>
          <legend className="mb-1 block text-sm font-semibold text-charcoal">Land or floor area (m²)</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={id("minArea")} className="sr-only">
                Minimum area
              </label>
              <input id={id("minArea")} name="minArea" type="number" min={0} inputMode="numeric" placeholder="Min" defaultValue={filters.minArea ?? ""} className={ctl} />
            </div>
            <div>
              <label htmlFor={id("maxArea")} className="sr-only">
                Maximum area
              </label>
              <input id={id("maxArea")} name="maxArea" type="number" min={0} inputMode="numeric" placeholder="Max" defaultValue={filters.maxArea ?? ""} className={ctl} />
            </div>
          </div>
        </fieldset>
      )}

      <Select
        id={id("availability")}
        name="availability"
        label="Availability"
        value={filters.availability}
        placeholder="Available and reserved"
        options={[
          { value: "available", label: "Available now" },
          { value: "reserved", label: "Reserved" },
        ]}
      />

      <div className="space-y-2.5">
        {scope !== "rent" && (
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="verified" value="1" defaultChecked={filters.verified === "1"} className="h-4 w-4 accent-navy-800" />
            Title documents verified by our team
          </label>
        )}
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" name="featured" value="1" defaultChecked={filters.featured === "1"} className="h-4 w-4 accent-navy-800" />
          Featured listings only
        </label>
      </div>

      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
      {filters.view && <input type="hidden" name="view" value={filters.view} />}
    </div>
  );
}

function stripEmpty(e: React.FormEvent<HTMLFormElement>) {
  const form = e.currentTarget;
  for (const el of Array.from(form.elements) as (HTMLInputElement | HTMLSelectElement)[]) {
    if (el.name && !el.value) el.disabled = true;
  }
  window.setTimeout(() => {
    for (const el of Array.from(form.elements) as (HTMLInputElement | HTMLSelectElement)[]) el.disabled = false;
  }, 0);
}

export function ListingFilters(props: Props) {
  const { basePath, activeCount } = props;
  const [open, setOpen] = useState(false);
  const uid = useId();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("button, input, select")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-navy-800 bg-white px-4 text-sm font-semibold text-navy-800"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filter properties">
          <button type="button" tabIndex={-1} aria-label="Close filters" className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} />
          <div ref={sheetRef} className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[10px] bg-ivory">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="text-base font-semibold">Filter properties</h2>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-sm hover:bg-sand">
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Close filters</span>
              </button>
            </div>
            <form action={basePath} method="get" onSubmit={stripEmpty} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <FilterFields {...props} idPrefix={`m${uid}`} />
              </div>
              <div className="flex gap-3 border-t border-line bg-white px-5 py-4">
                <Link href={basePath} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-[var(--radius-control)] border border-navy-800 font-semibold text-navy-800">
                  Reset
                </Link>
                <button type="submit" data-track="search_filters_applied" className="inline-flex min-h-12 flex-[2] items-center justify-center rounded-[var(--radius-control)] bg-navy-800 font-semibold text-white">
                  Show results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <aside className="hidden lg:block" aria-label="Filter properties">
        <form action={basePath} method="get" onSubmit={stripEmpty} className="sticky top-24 rounded-[var(--radius-card)] border border-line bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold">Filters</h2>
            {activeCount > 0 && (
              <Link href={basePath} className="text-sm font-semibold text-navy-700 underline underline-offset-2">
                Reset all
              </Link>
            )}
          </div>
          <FilterFields {...props} idPrefix={`d${uid}`} />
          <button type="submit" data-track="search_filters_applied" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-navy-800 font-semibold text-white hover:bg-navy-700">
            Apply filters
          </button>
        </form>
      </aside>
    </>
  );
}
