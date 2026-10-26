// src/app/(site)/search/page.tsx
import type { Metadata } from "next";
import { FURNISHING_OPTIONS, PRICE_OPTIONS, ROOM_OPTIONS } from "@/components/property/filter-options";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategories, getLocations } from "@/lib/properties";

export const metadata: Metadata = {
  title: "Advanced Property Search",
  description: "Search Abuja property by transaction type, location, price, size, bedrooms, furnishing, document status and reference.",
  alternates: { canonical: "/search" },
};

const ctl = "field-input";

function Select({ id, label, options, placeholder }: { id: string; label: string; options: { value: string; label: string }[]; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} name={id} defaultValue="" className={ctl}>
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

export default async function AdvancedSearchPage() {
  const [categories, locations] = await Promise.all([getCategories(), getLocations()]);
  const locationOptions = [
    ...locations.filter((l) => l.type === "city").map((l) => ({ value: l.slug, label: `${l.name} (all areas)` })),
    ...locations.filter((l) => l.type === "district").map((l) => ({ value: l.slug, label: l.name })),
  ];

  return (
    <>
      <PageHeader title="Advanced search" crumbs={[{ label: "Properties", href: "/properties" }, { label: "Advanced search" }]} intro={<p>Combine any of the filters below. Leave a field empty to include everything.</p>} />
      <div className="container-page max-w-4xl py-14">
        <form action="/properties" method="get" role="search" className="space-y-8 rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-10">
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-4 text-lg font-semibold">What and where</legend>
            <Select
              id="tx"
              label="Looking to"
              placeholder="Buy, rent or short-let"
              options={[
                { value: "sale", label: "Buy" },
                { value: "rent", label: "Rent (long-term)" },
                { value: "short_let", label: "Short-let" },
              ]}
            />
            <Select id="category" label="Property type" placeholder="All types" options={categories.map((c) => ({ value: c.slug, label: c.name }))} />
            <Select id="location" label="Location" placeholder="All locations" options={locationOptions} />
            <div>
              <label htmlFor="q" className="field-label">
                Keyword or reference
              </label>
              <input id="q" name="q" type="search" maxLength={100} className={ctl} placeholder="e.g. swimming pool, MNH-S-01001" />
            </div>
          </fieldset>

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-4 text-lg font-semibold">Budget</legend>
            <Select id="minPrice" label="Minimum price" placeholder="No minimum" options={PRICE_OPTIONS} />
            <Select id="maxPrice" label="Maximum price" placeholder="No maximum" options={PRICE_OPTIONS} />
            <Select
              id="billing"
              label="Rent period (rentals only)"
              placeholder="Any"
              options={[
                { value: "per_year", label: "Per year" },
                { value: "per_month", label: "Per month" },
                { value: "per_week", label: "Per week" },
                { value: "per_night", label: "Per night" },
              ]}
            />
          </fieldset>

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-4 text-lg font-semibold">Size and features</legend>
            <Select id="beds" label="Bedrooms" placeholder="Any" options={ROOM_OPTIONS} />
            <Select id="baths" label="Bathrooms" placeholder="Any" options={ROOM_OPTIONS} />
            <div>
              <label htmlFor="minArea" className="field-label">
                Minimum area (m²)
              </label>
              <input id="minArea" name="minArea" type="number" min={0} inputMode="numeric" className={ctl} />
            </div>
            <div>
              <label htmlFor="maxArea" className="field-label">
                Maximum area (m²)
              </label>
              <input id="maxArea" name="maxArea" type="number" min={0} inputMode="numeric" className={ctl} />
            </div>
            <Select id="furnishing" label="Furnishing" placeholder="Any" options={FURNISHING_OPTIONS} />
            <Select
              id="availability"
              label="Availability"
              placeholder="Available and reserved"
              options={[
                { value: "available", label: "Available now" },
                { value: "reserved", label: "Reserved" },
              ]}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-lg font-semibold">Other</legend>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" name="verified" value="1" className="h-4 w-4 accent-navy-800" />
              Title documents verified by our team
            </label>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" name="featured" value="1" className="h-4 w-4 accent-navy-800" />
              Featured listings only
            </label>
          </fieldset>

          <div className="flex flex-wrap gap-3 border-t border-line pt-6">
            <button type="submit" data-track="search_submitted" data-track-location="advanced_search" className="inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-navy-800 px-8 font-semibold text-white hover:bg-navy-700">
              Search properties
            </button>
            <button type="reset" className="inline-flex min-h-12 items-center rounded-[var(--radius-control)] px-4 font-semibold text-navy-700 hover:bg-sand">
              Clear form
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
