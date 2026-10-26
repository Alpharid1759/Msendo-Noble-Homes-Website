// src/components/property/ListingsView.tsx
import { SearchX } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/site/Pagination";
import { ButtonLink } from "@/components/ui/Button";
import { getCategories, getLocations, PAGE_SIZE, searchListings } from "@/lib/properties";
import { activeFilterCount, filtersToQuery, parseListingFilters, type ListingScope, type RawSearchParams } from "@/lib/search-params";
import { getSettings } from "@/lib/settings";
import { ListingFilters } from "./ListingFilters";
import { PropertyGrid } from "./PropertyCard";
import { ResultsToolbar } from "./ResultsToolbar";

export async function ListingsView({ scope, rawParams, basePath }: { scope: ListingScope; rawParams: RawSearchParams; basePath: string }) {
  const filters = parseListingFilters(rawParams);
  const [result, categories, locations, settings] = await Promise.all([
    searchListings(scope, filters),
    getCategories(),
    getLocations(),
    getSettings(),
  ]);
  const view = filters.view ?? "grid";
  const sort = filters.sort ?? "newest";
  const activeCount = activeFilterCount(filters);
  const from = result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(result.page * PAGE_SIZE, result.total);

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:py-14">
      <div>
        <ListingFilters
          scope={scope}
          filters={filters}
          categories={categories.map(({ id, name, slug }) => ({ id, name, slug }))}
          locations={locations.map(({ id, name, slug, type }) => ({ id, name, slug, type }))}
          basePath={basePath}
          activeCount={activeCount}
        />
      </div>
      <div className="min-w-0">
        <ResultsToolbar total={result.total} sort={sort} view={view} from={from} to={to} />
        <div className="mt-6">
          {result.error ? (
            <div role="alert" className="rounded-[var(--radius-card)] border border-line bg-white p-8 text-center">
              <p className="font-semibold text-charcoal">{result.error}</p>
              <p className="mt-2 text-sm text-slate">
                You can still reach us on {settings.contact.phone_display} or WhatsApp for current availability.
              </p>
            </div>
          ) : result.items.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-navy-200 bg-white p-10 text-center">
              <SearchX className="mx-auto h-10 w-10 text-navy-200" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold">No properties match your search yet</h2>
              <ul className="mx-auto mt-3 max-w-md space-y-1 text-sm text-slate">
                <li>Widen the price range or remove the bedroom filter.</li>
                <li>Try a nearby district, or search all of Abuja.</li>
                <li>Tell us what you need and we will look beyond our listed stock.</li>
              </ul>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {activeCount > 0 && (
                  <ButtonLink href={basePath} variant="secondary">
                    Clear filters
                  </ButtonLink>
                )}
                <ButtonLink href="/contact?category=buying" variant="primary">
                  Get property assistance
                </ButtonLink>
              </div>
            </div>
          ) : (
            <PropertyGrid items={result.items} layout={view} priorityCount={view === "grid" ? 3 : 1} />
          )}
        </div>
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          hrefFor={(p) => {
            const qs = filtersToQuery(filters, { page: p === 1 ? null : p });
            return qs ? `${basePath}?${qs}` : basePath;
          }}
        />
        {result.items.length > 0 && (
          <p className="mt-10 text-center text-sm text-slate">
            Cannot find the right property?{" "}
            <Link href="/contact?category=buying" className="font-semibold text-navy-700 underline underline-offset-2">
              Tell us what you are looking for
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
