// src/components/property/HeroSearch.tsx
import { Search } from "lucide-react";
import type { Category, LocationRow } from "@/types/domain";
import { PRICE_OPTIONS, ROOM_OPTIONS, TX_OPTIONS } from "./filter-options";

const selectCls =
  "h-12 w-full rounded-[var(--radius-control)] border border-line bg-white px-3 text-[0.9375rem] text-charcoal focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-700/20";

export function HeroSearch({ categories, locations }: { categories: Category[]; locations: LocationRow[] }) {
  const districts = locations.filter((l) => l.type === "district");
  const cities = locations.filter((l) => l.type === "city");
  return (
    <form action="/properties" method="get" role="search" aria-label="Property search" className="rounded-[var(--radius-card)] bg-white p-4 text-charcoal shadow-[var(--shadow-lift)] sm:p-5">
      <fieldset>
        <legend className="sr-only">I want to</legend>
        <div className="inline-flex rounded-[var(--radius-control)] bg-sand p-1">
          {TX_OPTIONS.map((o, i) => (
            <label key={o.value} className="cursor-pointer">
              <input type="radio" name="tx" value={o.value} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-flex min-h-10 items-center rounded-[3px] px-4 text-sm font-semibold text-slate peer-checked:bg-navy-800 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold-ink">
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="hs-location" className="mb-1 block text-xs font-semibold text-slate">
            Location
          </label>
          <select id="hs-location" name="location" className={selectCls} defaultValue="">
            <option value="">Anywhere in Abuja</option>
            {cities.length > 1 &&
              cities.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name} (all areas)
                </option>
              ))}
            {districts.map((d) => (
              <option key={d.id} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="hs-category" className="mb-1 block text-xs font-semibold text-slate">
            Property type
          </label>
          <select id="hs-category" name="category" className={selectCls} defaultValue="">
            <option value="">All property types</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="hs-min" className="mb-1 block text-xs font-semibold text-slate">
              Min price
            </label>
            <select id="hs-min" name="minPrice" className={selectCls} defaultValue="">
              <option value="">No min</option>
              {PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="hs-max" className="mb-1 block text-xs font-semibold text-slate">
              Max price
            </label>
            <select id="hs-max" name="maxPrice" className={selectCls} defaultValue="">
              <option value="">No max</option>
              {PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="hs-beds" className="mb-1 block text-xs font-semibold text-slate">
              Bedrooms
            </label>
            <select id="hs-beds" name="beds" className={selectCls} defaultValue="">
              <option value="">Any</option>
              {ROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="hs-baths" className="mb-1 block text-xs font-semibold text-slate">
              Bathrooms
            </label>
            <select id="hs-baths" name="baths" className={selectCls} defaultValue="">
              <option value="">Any</option>
              {ROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="hs-ref" className="sr-only">
            Keyword or property reference
          </label>
          <input
            id="hs-ref"
            name="q"
            type="search"
            placeholder="Keyword or reference, e.g. MNH-S-01001"
            className={selectCls}
            maxLength={100}
          />
        </div>
        <button
          type="submit"
          data-track="search_submitted"
          data-track-location="hero"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-navy-800 px-7 font-semibold text-white hover:bg-navy-700"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Search properties
        </button>
      </div>
    </form>
  );
}
