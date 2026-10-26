// src/components/property/HeroSearch.tsx
import { Search, SlidersHorizontal } from "lucide-react";
import type { Category, LocationRow } from "@/types/domain";
import { PRICE_OPTIONS, ROOM_OPTIONS, TX_OPTIONS } from "./filter-options";

const ctl =
  "h-12 w-full appearance-none rounded-[var(--radius-control)] border border-white/15 bg-[#0e1210]/70 px-3 text-[0.9375rem] text-[#f1ece1] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const lbl = "mb-1.5 block text-xs font-semibold tracking-wide text-[#d9d4c8]";

export function HeroSearch({ categories, locations }: { categories: Category[]; locations: LocationRow[] }) {
  const districts = locations.filter((l) => l.type === "district");
  const cities = locations.filter((l) => l.type === "city");
  return (
    <form action="/properties" method="get" role="search" aria-label="Property search" className="glass rounded-[16px] p-4 text-charcoal shadow-[var(--shadow-lift)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-[1.6rem] text-heading">Find your property</h2>
        <fieldset>
          <legend className="sr-only">I want to</legend>
          <div className="inline-flex rounded-[var(--radius-control)] border border-white/10 bg-[#0e1210]/60 p-1">
            {TX_OPTIONS.map((o, i) => (
              <label key={o.value} className="cursor-pointer">
                <input type="radio" name="tx" value={o.value} defaultChecked={i === 0} className="peer sr-only" />
                <span className="inline-flex min-h-9 items-center rounded-[4px] px-4 text-sm font-semibold text-slate transition-colors peer-checked:bg-gold peer-checked:text-navy-950 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="hs-location" className={lbl}>
            Location
          </label>
          <select id="hs-location" name="location" className={ctl} defaultValue="">
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
          <label htmlFor="hs-category" className={lbl}>
            Property type
          </label>
          <select id="hs-category" name="category" className={ctl} defaultValue="">
            <option value="">All property types</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="hs-max" className={lbl}>
            Budget (up to)
          </label>
          <select id="hs-max" name="maxPrice" className={ctl} defaultValue="">
            <option value="">Any budget</option>
            {PRICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          data-track="search_submitted"
          data-track-location="hero"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-gradient-to-b from-gold-light to-gold px-8 font-semibold text-navy-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] hover:from-gold hover:to-[#c98c08] sm:col-span-2 lg:col-span-1"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </button>
      </div>

      <details className="group mt-4">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-gold-light hover:underline">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          More filters
          <span className="text-xs text-slate group-open:hidden">(minimum price, bedrooms, bathrooms, reference)</span>
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="hs-min" className={lbl}>
              Minimum price
            </label>
            <select id="hs-min" name="minPrice" className={ctl} defaultValue="">
              <option value="">No minimum</option>
              {PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="hs-beds" className={lbl}>
              Bedrooms
            </label>
            <select id="hs-beds" name="beds" className={ctl} defaultValue="">
              <option value="">Any</option>
              {ROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="hs-baths" className={lbl}>
              Bathrooms
            </label>
            <select id="hs-baths" name="baths" className={ctl} defaultValue="">
              <option value="">Any</option>
              {ROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="hs-ref" className={lbl}>
              Keyword or reference
            </label>
            <input id="hs-ref" name="q" type="search" placeholder="e.g. MNH-S-01001" className={ctl} maxLength={100} />
          </div>
        </div>
      </details>
    </form>
  );
}
