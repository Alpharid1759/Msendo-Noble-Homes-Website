// src/app/(site)/locations/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyGrid } from "@/components/property/PropertyCard";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { getListingCountsByLocation, getLocations, searchListings } from "@/lib/properties";

type Props = { params: Promise<{ slug: string }> };

async function loadLocation(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const [locations, counts] = await Promise.all([getLocations(), getListingCountsByLocation()]);
  const location = locations.find((l) => l.slug === slug);
  if (!location) return null;
  const hasListings = (counts[location.id] ?? 0) > 0 || location.type !== "district";
  if (!location.is_featured && !hasListings && !location.description) return null;
  const parent = locations.find((l) => l.id === location.parent_id) ?? null;
  return { location, parent };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await loadLocation((await params).slug);
  if (!data) return { title: "Area not found", robots: { index: false } };
  const place = `${data.location.name}${data.parent ? `, ${data.parent.name}` : ""}`;
  return {
    title: `Property in ${place}: Homes, Land and Offices`,
    description: data.location.description?.slice(0, 158) || `Houses, apartments, land and commercial property for sale and rent in ${place}, listed by Msendo Noble Homes.`,
    alternates: { canonical: `/locations/${data.location.slug}` },
  };
}

export default async function LocationPage({ params }: Props) {
  const data = await loadLocation((await params).slug);
  if (!data) notFound();
  const { location, parent } = data;
  const [sale, rent] = await Promise.all([
    searchListings("sale", { location: location.slug }),
    searchListings("rent", { location: location.slug }),
  ]);
  const place = `${location.name}${parent ? `, ${parent.name}` : ""}`;

  return (
    <>
      <PageHeader
        title={`Property in ${location.name}`}
        crumbs={[{ label: "Properties", href: "/properties" }, { label: location.name }]}
        intro={<p>{location.description ?? `Listings for sale and rent in ${place}. Ask us about properties here that are not yet on the website.`}</p>}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/properties/for-sale?location=${location.slug}`} variant="gold">
            For sale in {location.name} ({sale.total})
          </ButtonLink>
          <ButtonLink href={`/properties/for-rent?location=${location.slug}`} variant="outline-light">
            For rent in {location.name} ({rent.total})
          </ButtonLink>
        </div>
      </PageHeader>
      <div className="container-page space-y-16 py-14">
        {sale.items.length > 0 && (
          <section aria-labelledby="sale">
            <h2 id="sale" className="display text-[2rem] text-heading">
              For sale in {location.name}
            </h2>
            <div className="mt-6">
              <PropertyGrid items={sale.items.slice(0, 6)} />
            </div>
          </section>
        )}
        {rent.items.length > 0 && (
          <section aria-labelledby="rent">
            <h2 id="rent" className="display text-[2rem] text-heading">
              For rent in {location.name}
            </h2>
            <div className="mt-6">
              <PropertyGrid items={rent.items.slice(0, 6)} />
            </div>
          </section>
        )}
        {sale.items.length === 0 && rent.items.length === 0 && (
          <div className="rounded-[var(--radius-card)] border border-dashed border-navy-200 bg-surface p-10 text-center">
            <h2 className="text-lg font-semibold">No published listings in {location.name} right now</h2>
            <p className="mx-auto mt-2 max-w-md text-slate">We often hear about properties before they are listed. Tell us what you need.</p>
            <div className="mt-6">
              <ButtonLink href="/contact?category=buying">Get Property Assistance</ButtonLink>
            </div>
          </div>
        )}
        <p className="text-sm text-slate">
          Looking elsewhere in Abuja?{" "}
          <Link href="/properties" className="font-semibold text-accent underline underline-offset-2">
            Search all areas
          </Link>
          .
        </p>
      </div>
    </>
  );
}
