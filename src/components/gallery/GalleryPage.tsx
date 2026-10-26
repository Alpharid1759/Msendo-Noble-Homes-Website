// src/components/gallery/GalleryPage.tsx
import { Clapperboard, ImageOff, MapPin } from "lucide-react";
import Link from "next/link";
import { TrackView } from "@/components/consent/TrackView";
import { StatusBadge } from "@/components/property/Badges";
import { Price } from "@/components/property/Price";
import { PropertySpecs } from "@/components/property/PropertyCard";
import { ShareButtons } from "@/components/property/ShareButtons";
import { VideoPlayer } from "@/components/property/VideoPlayer";
import { PageHeader } from "@/components/site/PageHeader";
import { Pagination } from "@/components/site/Pagination";
import { ButtonLink } from "@/components/ui/Button";
import { publicEnv } from "@/lib/env";
import { formatLocation } from "@/lib/format";
import { getCategories, getLocations, getMediaForProperties, searchListings } from "@/lib/properties";
import { filtersToQuery, parseListingFilters, type RawSearchParams } from "@/lib/search-params";
import { GalleryFilters } from "./GalleryFilters";
import { GalleryNav } from "./GalleryNav";
import { PhotoGalleryGrid, type GalleryItem } from "./PhotoGalleryGrid";

export async function GalleryPage({ kind, tx, rawParams }: { kind: "photos" | "videos"; tx: "for-sale" | "for-rent"; rawParams: RawSearchParams }) {
  const scope = tx === "for-sale" ? "sale" : "rent";
  const basePath = `/gallery/${kind}/${tx}`;
  const parsed = parseListingFilters(rawParams);
  const filters = {
    location: parsed.location,
    category: parsed.category,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    page: parsed.page,
  };
  const [result, categories, locations] = await Promise.all([
    searchListings(scope, filters, kind === "photos" ? "image" : "video"),
    getCategories(),
    getLocations(),
  ]);
  const media = await getMediaForProperties(
    result.items.map((p) => p.id),
    kind === "photos" ? "image" : "video",
  );
  const label = tx === "for-sale" ? "for sale" : "for rent";
  const title = kind === "photos" ? `Photo gallery: properties ${label}` : `Video tours: properties ${label}`;
  const intro =
    kind === "photos"
      ? `Browse photographs of every published property ${label}. Open any set to see the full gallery, then go to the listing for prices, charges and inspection booking.`
      : `Walk through properties ${label} on video before you visit. Videos load only when you press play, to save your data.`;

  return (
    <>
      <TrackView event={tx === "for-sale" ? "sales_gallery_viewed" : "rental_gallery_viewed"} params={{ gallery_type: kind }} />
      <PageHeader title={title} crumbs={[{ label: "Gallery", href: "/gallery/photos/for-sale" }, { label: title }]} intro={<p>{intro}</p>}>
        <GalleryNav kind={kind} tx={tx} />
      </PageHeader>

      <div className="container-page py-10 lg:py-14">
        <div className="flex flex-col gap-4">
          <GalleryFilters basePath={basePath} filters={filters} categories={categories} locations={locations} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate" aria-live="polite">
              {result.total} {result.total === 1 ? "property" : "properties"} with {kind === "photos" ? "photos" : "video tours"}
            </p>
            <ShareButtons url={`${publicEnv.siteUrl}${basePath}`} title={title} />
          </div>
        </div>

        <div className="mt-8">
          {result.error ? (
            <p role="alert" className="rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center font-semibold">
              {result.error}
            </p>
          ) : result.items.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-navy-200 bg-surface p-10 text-center">
              {kind === "photos" ? <ImageOff className="mx-auto h-10 w-10 text-navy-200" aria-hidden="true" /> : <Clapperboard className="mx-auto h-10 w-10 text-navy-200" aria-hidden="true" />}
              <h2 className="mt-4 text-lg font-semibold">No {kind === "photos" ? "photo galleries" : "video tours"} match yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate">Clear the filters, browse every listing {label}, or ask us for a live video call of a property.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ButtonLink href={tx === "for-sale" ? "/properties/for-sale" : "/properties/for-rent"} variant="secondary">
                  Browse properties {label}
                </ButtonLink>
                <ButtonLink href="/contact" variant="primary">
                  Speak to our team
                </ButtonLink>
              </div>
            </div>
          ) : kind === "photos" ? (
            <PhotoGalleryGrid
              items={result.items.map(
                (p): GalleryItem => ({
                  property: p,
                  url: `/properties/${p.slug}`,
                  images: media
                    .filter((m) => m.property_id === p.id)
                    .map((m) => ({ id: m.id, variants: m.variants, alt: m.alt_text || m.caption || p.title, caption: m.caption })),
                }),
              )}
            />
          ) : (
            <ul className="grid gap-8 md:grid-cols-2">
              {result.items.flatMap((p) =>
                media
                  .filter((m) => m.property_id === p.id)
                  .slice(0, 2)
                  .map((v) => (
                    <li key={v.id}>
                      <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                        <VideoPlayer
                          src={v.storage_path}
                          poster={v.poster_path}
                          title={v.title || `${p.title} video tour`}
                          duration={v.duration_seconds}
                          propertyReference={p.reference}
                          className="rounded-none"
                        />
                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <Price price={p.price} price_on_request={p.price_on_request} currency={p.currency} billing_frequency={p.billing_frequency} />
                            <StatusBadge status={p.status} />
                          </div>
                          <h2 className="mt-1 text-lg font-semibold leading-snug">
                            <Link href={`/properties/${p.slug}`} className="hover:underline">
                              {v.title || p.title}
                            </Link>
                          </h2>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate">
                            <MapPin className="h-4 w-4 text-gold-ink" aria-hidden="true" />
                            {formatLocation(p) || "Abuja"}
                          </p>
                          <PropertySpecs p={p} className="mt-3" />
                          {(v.description || p.description) && (
                            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate">{v.description || p.description}</p>
                          )}
                          <div className="flex-1" />
                          <p className="mt-4 text-xs text-slate">
                            {p.category_name} / Ref {p.reference}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <ButtonLink href={`/properties/${p.slug}`} size="sm">
                              View property details
                            </ButtonLink>
                            {scope === "rent" ? (
                              <ButtonLink href={`/schedule-inspection?ref=${p.reference}`} size="sm" variant="secondary" data-track="inspection_cta_click" data-track-ref={p.reference}>
                                Book an inspection
                              </ButtonLink>
                            ) : null}
                            <ButtonLink href={`/properties/${p.slug}#enquire`} size="sm" variant="secondary" data-track="enquiry_cta_click" data-track-ref={p.reference}>
                              Enquire now
                            </ButtonLink>
                          </div>
                        </div>
                      </article>
                    </li>
                  )),
              )}
            </ul>
          )}
        </div>

        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          hrefFor={(n) => {
            const qs = filtersToQuery(filters, { page: n === 1 ? null : n });
            return qs ? `${basePath}?${qs}` : basePath;
          }}
        />
      </div>
    </>
  );
}
