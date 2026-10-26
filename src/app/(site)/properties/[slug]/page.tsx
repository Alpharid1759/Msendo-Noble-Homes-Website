// src/app/(site)/properties/[slug]/page.tsx
import { BadgeCheck, CalendarDays, Car, CircleAlert, FileText, MapPin, Sofa, Toilet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { TrackView } from "@/components/consent/TrackView";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { InspectionForm } from "@/components/forms/InspectionForm";
import { FlagBadge, StatusBadge, TransactionBadge } from "@/components/property/Badges";
import { ContactActions } from "@/components/property/ContactActions";
import { PhotoGallery } from "@/components/property/PhotoGallery";
import { Price } from "@/components/property/Price";
import { PropertyGrid, PropertySpecs } from "@/components/property/PropertyCard";
import { ShareButtons } from "@/components/property/ShareButtons";
import { VideoPlayer } from "@/components/property/VideoPlayer";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { publicEnv } from "@/lib/env";
import {
  BILLING_SUFFIX,
  CHARGE_LABEL,
  formatArea,
  formatDate,
  formatLocation,
  formatMoney,
  FURNISHING_LABEL,
  STATUS_LABEL,
} from "@/lib/format";
import { variantUrl } from "@/lib/media";
import { getPropertyBySlug, getPropertyCharges, getPropertyMedia, getSimilarListings } from "@/lib/properties";
import { truncate } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) notFound();
  const { property, redirectTo } = await getPropertyBySlug(slug);
  if (redirectTo) permanentRedirect(`/properties/${redirectTo}`);
  if (!property) notFound();
  return property;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { property } = await getPropertyBySlug(slug);
  if (!property) return { title: "Property not found", robots: { index: false } };
  const location = formatLocation(property);
  const title = property.seo_title || `${property.title}${location ? `, ${location}` : ""}`;
  const description = property.seo_description || truncate(property.description || `${property.title} in ${location}. Ref ${property.reference}.`);
  const image = variantUrl(property.cover_variants, 1600);
  return {
    title,
    description,
    alternates: { canonical: `/properties/${property.slug}` },
    robots: property.is_listed && !property.is_demo ? undefined : { index: false, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/properties/${property.slug}`,
      images: image ? [{ url: image, width: 1600, alt: property.cover_alt ?? property.title }] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const property = await load(slug);
  const [media, charges, settings, similar] = await Promise.all([
    getPropertyMedia(property.id),
    getPropertyCharges(property.id),
    getSettings(),
    getSimilarListings({ id: property.id, transaction_type: property.transaction_type, category_slug: property.category_slug, district_name: property.district_name }),
  ]);

  const images = media
    .filter((m) => m.media_type === "image")
    .map((m) => ({ id: m.id, variants: m.variants, alt: m.alt_text || m.caption || property.title, caption: m.caption }));
  const videos = media.filter((m) => m.media_type === "video");
  const pageUrl = `${publicEnv.siteUrl}/properties/${property.slug}`;
  const location = formatLocation(property);
  const isSale = property.transaction_type === "sale";
  const listHref = isSale ? "/properties/for-sale" : "/properties/for-rent";
  const area = formatArea(property.floor_area, property.area_unit);
  const land = formatArea(property.land_area, property.area_unit);
  const hasPin = property.latitude !== null && property.longitude !== null;
  const mapsQuery = hasPin
    ? `${property.latitude},${property.longitude}`
    : [property.address_line, property.district_name, property.city_name ?? "Abuja", "Nigeria"].filter(Boolean).join(", ");

  const specs: { label: string; value: string; icon?: typeof Car }[] = [
    { label: "Reference", value: property.reference },
    { label: "Property type", value: property.category_name },
    property.bedrooms !== null ? { label: "Bedrooms", value: String(property.bedrooms) } : null,
    property.bathrooms !== null ? { label: "Bathrooms", value: String(property.bathrooms) } : null,
    property.toilets !== null ? { label: "Toilets", value: String(property.toilets), icon: Toilet } : null,
    property.parking_spaces !== null ? { label: "Parking", value: `${property.parking_spaces} space${property.parking_spaces === 1 ? "" : "s"}`, icon: Car } : null,
    area ? { label: "Floor area", value: area } : null,
    land ? { label: "Land area", value: land } : null,
    property.furnishing ? { label: "Furnishing", value: FURNISHING_LABEL[property.furnishing], icon: Sofa } : null,
    property.available_from ? { label: "Available from", value: formatDate(property.available_from), icon: CalendarDays } : null,
    property.lease_min_months ? { label: "Minimum lease", value: `${property.lease_min_months} months` } : null,
    ...Object.entries(property.attributes ?? {}).map(([k, v]) => ({ label: k, value: String(v) })),
  ].filter(Boolean) as { label: string; value: string; icon?: typeof Car }[];

  const availability = property.is_listed
    ? property.status === "reserved"
      ? "https://schema.org/LimitedAvailability"
      : "https://schema.org/InStock"
    : "https://schema.org/SoldOut";

  return (
    <>
      <TrackView event="property_viewed" params={{ property_reference: property.reference, transaction_type: property.transaction_type }} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: property.title,
          url: pageUrl,
          description: truncate(property.description, 500),
          datePosted: property.published_at ?? undefined,
          image: images.slice(0, 6).map((i) => variantUrl(i.variants, 1600)).filter(Boolean),
          identifier: property.reference,
          offers: property.price_on_request
            ? undefined
            : {
                "@type": "Offer",
                price: property.price,
                priceCurrency: property.currency,
                availability,
                businessFunction: isSale ? "https://purl.org/goodrelations/v1#Sell" : "https://purl.org/goodrelations/v1#LeaseOut",
              },
          contentLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: property.district_name ?? property.city_name ?? undefined,
              addressRegion: property.state_name ?? undefined,
              addressCountry: "NG",
            },
          },
        }}
      />

      <div className="container-page pb-16 pt-8">
        <Breadcrumbs
          items={[
            { label: "Properties", href: "/properties" },
            { label: isSale ? "For sale" : "For rent", href: listHref },
            { label: property.reference },
          ]}
        />

        {!property.is_listed && (
          <div role="status" className="mt-6 flex gap-3 rounded-[var(--radius-card)] border border-navy-200 bg-sand p-4 text-heading">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">This property is {STATUS_LABEL[property.status].toLowerCase()} and no longer available.</p>
              <p className="mt-1 text-sm">
                Browse{" "}
                <Link href={listHref} className="font-semibold underline underline-offset-2">
                  similar properties {isSale ? "for sale" : "for rent"}
                </Link>{" "}
                or tell us what you need and we will look for alternatives.
              </p>
            </div>
          </div>
        )}

        {property.is_demo && (
          <p role="note" className="mt-6 rounded-[var(--radius-card)] border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            Demonstration listing for testing the website. It is not a real property offer.
          </p>
        )}

        <header className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-1.5">
              <TransactionBadge type={property.transaction_type} />
              <StatusBadge status={property.status} />
              {property.is_featured && <FlagBadge>Featured</FlagBadge>}
            </div>
            <h1 className="display mt-3 text-[2rem] text-heading md:text-[2.75rem]">{property.title}</h1>
            {location && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-slate">
                <MapPin className="h-4 w-4 text-gold-ink" aria-hidden="true" />
                {property.address_line ? `${property.address_line}, ` : ""}
                {location}
              </p>
            )}
          </div>
          <div className="lg:text-right">
            <Price
              size="lg"
              price={property.price}
              price_on_request={property.price_on_request}
              currency={property.currency}
              billing_frequency={property.billing_frequency}
            />
            {property.is_negotiable && <p className="mt-1 text-sm text-slate">Open to offers</p>}
          </div>
        </header>

        <div className="mt-6">
          <PhotoGallery images={images} title={property.title} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-12">
            <section aria-labelledby="overview">
              <h2 id="overview" className="sr-only">
                Overview
              </h2>
              <PropertySpecs p={property} className="text-base" />
              <div className="mt-6">
                <ShareButtons url={pageUrl} title={property.title} reference={property.reference} showPrint />
              </div>
            </section>

            {property.description && (
              <section aria-labelledby="description">
                <h2 id="description" className="display text-[1.75rem] text-heading">
                  About this property
                </h2>
                <div className="mt-4 space-y-4 text-[1.0625rem] leading-relaxed text-charcoal">
                  {property.description.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {videos.length > 0 && (
              <section aria-labelledby="video-tour">
                <h2 id="video-tour" className="display text-[1.75rem] text-heading">
                  Video tour
                </h2>
                <div className="mt-4 space-y-6">
                  {videos.map((v) => (
                    <figure key={v.id}>
                      <VideoPlayer
                        src={v.storage_path}
                        poster={v.poster_path}
                        title={v.title || `${property.title} video tour`}
                        duration={v.duration_seconds}
                        propertyReference={property.reference}
                      />
                      {(v.title || v.description) && (
                        <figcaption className="mt-2 text-sm text-slate">
                          {v.title && <span className="font-semibold text-charcoal">{v.title}. </span>}
                          {v.description}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {property.virtual_tour_url && (
              <section aria-labelledby="virtual-tour">
                <h2 id="virtual-tour" className="display text-[1.75rem] text-heading">
                  Virtual tour
                </h2>
                <p className="mt-3">
                  <a href={property.virtual_tour_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-2">
                    Open the 3D virtual tour in a new tab
                  </a>
                </p>
              </section>
            )}

            <section aria-labelledby="details">
              <h2 id="details" className="display text-[1.75rem] text-heading">
                Property details
              </h2>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-4 border-b border-line py-3">
                    <dt className="text-slate">{s.label}</dt>
                    <dd className="text-right font-semibold text-charcoal">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {property.amenities.length > 0 && (
              <section aria-labelledby="amenities">
                <h2 id="amenities" className="display text-[1.75rem] text-heading">
                  Amenities and facilities
                </h2>
                <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {property.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="costs">
              <h2 id="costs" className="display text-[1.75rem] text-heading">
                {isSale ? "Price and charges" : "Rent and other charges"}
              </h2>
              <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                <table className="w-full text-left text-[0.9375rem]">
                  <caption className="sr-only">Charges for {property.reference}</caption>
                  <thead className="bg-sand text-sm text-slate">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Item
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-line">
                      <th scope="row" className="px-4 py-3 font-semibold">
                        {isSale ? "Asking price" : "Rent"}
                      </th>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {property.price_on_request
                          ? "On request"
                          : `${formatMoney(property.price, property.currency)}${BILLING_SUFFIX[property.billing_frequency] ? ` ${BILLING_SUFFIX[property.billing_frequency]}` : ""}`}
                      </td>
                    </tr>
                    {charges.map((c) => (
                      <tr key={c.id} className="border-t border-line">
                        <th scope="row" className="px-4 py-3 font-normal">
                          {c.label || CHARGE_LABEL[c.charge_type]}
                          {c.notes && <span className="block text-sm text-slate">{c.notes}</span>}
                        </th>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {c.amount === null
                            ? "To be confirmed"
                            : c.is_percentage
                              ? `${c.amount}%${isSale ? " of price" : " of rent"}`
                              : `${formatMoney(c.amount, property.currency)}${BILLING_SUFFIX[c.billing_frequency] ? ` ${BILLING_SUFFIX[c.billing_frequency]}` : ""}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-slate">
                {charges.length === 0
                  ? "Any additional charges will be confirmed in writing before you commit. "
                  : "Charges are listed separately and are not included in the headline price. "}
                Always confirm the final figures in writing before making a payment.
              </p>
            </section>

            {(property.title_document || isSale) && (
              <section aria-labelledby="documents">
                <h2 id="documents" className="display text-[1.75rem] text-heading">
                  Title and documents
                </h2>
                <div className="mt-4 flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5">
                  {property.title_verified ? (
                    <BadgeCheck className="h-6 w-6 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <FileText className="h-6 w-6 shrink-0 text-slate" aria-hidden="true" />
                  )}
                  <div>
                    <p className="font-semibold">{property.title_document ?? "Title document details on request"}</p>
                    <p className="mt-1 text-sm text-slate">
                      {property.title_verified
                        ? `Our team reviewed the title documents${property.title_verified_at ? ` on ${formatDate(property.title_verified_at)}` : ""}. We still recommend independent legal checks, including a search at the relevant land registry, before payment.`
                        : "Stated by the owner or their representative and not yet verified by Msendo Noble Homes. Ask us to arrange verification, and carry out independent legal checks before any payment."}
                    </p>
                    {!property.title_verified && (
                      <Link
                        href={`/contact?category=verification_request&ref=${property.reference}`}
                        className="mt-2 inline-block text-sm font-semibold text-accent underline underline-offset-2"
                      >
                        Request document verification
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section aria-labelledby="location">
              <h2 id="location" className="display text-[1.75rem] text-heading">
                Location
              </h2>
              <p className="mt-3 text-charcoal">
                {property.address_line ? `${property.address_line}, ` : ""}
                {location || "Abuja"}
                {!property.address_line && (
                  <span className="block text-sm text-slate">The exact address is shared with confirmed enquirers and at inspection.</span>
                )}
              </p>
              {hasPin && (
                <div className="mt-4 aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] border border-line bg-sand">
                  <iframe
                    title={`Map showing the location of ${property.title}`}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(property.longitude) - 0.01}%2C${Number(property.latitude) - 0.006}%2C${Number(property.longitude) + 0.01}%2C${Number(property.latitude) + 0.006}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`}
                    loading="lazy"
                    className="h-full w-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-accent underline underline-offset-2"
              >
                {hasPin ? "Open in Google Maps" : `View ${property.district_name ?? "the area"} on Google Maps`}
              </a>
            </section>

            <section id="enquire" aria-labelledby="enquire-heading" className="scroll-mt-24 rounded-[var(--radius-card)] border border-line bg-surface p-6 md:p-8 no-print">
              <h2 id="enquire-heading" className="display text-[1.75rem] text-heading">
                Enquire about this property
              </h2>
              <p className="mt-2 text-slate">We aim to respond within one working day. Ref {property.reference} is attached automatically.</p>
              <div className="mt-6">
                <EnquiryForm
                  propertyReference={property.reference}
                  defaultCategory="property_enquiry"
                  showCategory={false}
                  sourcePath={`/properties/${property.slug}`}
                  defaultMessage={`I am interested in ${property.title} (${property.reference}). Please send me more information.`}
                />
              </div>
            </section>

            {property.is_listed && (
              <section id="inspection" aria-labelledby="inspection-heading" className="scroll-mt-24 rounded-[var(--radius-card)] border border-line bg-surface p-6 md:p-8 no-print">
                <h2 id="inspection-heading" className="display text-[1.75rem] text-heading">
                  Book an inspection
                </h2>
                <p className="mt-2 text-slate">Pick a preferred time. Our team will call you to confirm it.</p>
                <div className="mt-6">
                  <InspectionForm propertyReference={property.reference} rules={settings.inspections} />
                </div>
              </section>
            )}

            <p className="text-sm text-slate no-print">
              Something wrong with this listing?{" "}
              <Link href={`/contact?category=report_listing&ref=${property.reference}`} className="font-semibold text-accent underline underline-offset-2">
                Report it to our team
              </Link>
              . Information is provided in good faith; read our{" "}
              <Link href="/legal/listing-disclaimer" className="font-semibold text-accent underline underline-offset-2">
                listing disclaimer
              </Link>
              .
            </p>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start no-print" aria-label="Contact about this property">
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <Price
                price={property.price}
                price_on_request={property.price_on_request}
                currency={property.currency}
                billing_frequency={property.billing_frequency}
              />
              <p className="mt-1 text-sm text-slate">Ref {property.reference}</p>
              <div className="mt-5">
                <ContactActions property={property} settings={settings} pageUrl={pageUrl} />
              </div>
              <div className="mt-5 border-t border-line pt-4 text-sm text-slate">
                <p className="font-semibold text-charcoal">{settings.company.brand_name}</p>
                <p>
                  {settings.contact.address_line}, {settings.contact.city}
                </p>
                <p>{settings.contact.phone_display}</p>
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section aria-labelledby="similar" className="mt-20 no-print">
            <div className="flex items-end justify-between gap-4">
              <h2 id="similar" className="display text-[2rem] text-heading">
                Similar properties
              </h2>
              <Link href={listHref} className="text-sm font-semibold text-accent underline underline-offset-2">
                See all {isSale ? "for sale" : "for rent"}
              </Link>
            </div>
            <div className="mt-6">
              <PropertyGrid items={similar} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
