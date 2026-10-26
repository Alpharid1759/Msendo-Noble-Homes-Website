// src/app/(site)/page.tsx
import { CalendarCheck, FileSearch, Handshake, MessagesSquare, Search, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { HeroSearch } from "@/components/property/HeroSearch";
import { Price } from "@/components/property/Price";
import { PropertyGrid } from "@/components/property/PropertyCard";
import { PropertyImage } from "@/components/property/PropertyImage";
import { VideoPlayer } from "@/components/property/VideoPlayer";
import { HeroIllustration } from "@/components/site/HeroIllustration";
import { JsonLd } from "@/components/site/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { SERVICES } from "@/content/services";
import { getBlogPosts } from "@/lib/blog";
import { publicEnv } from "@/lib/env";
import { formatDate, formatLocation } from "@/lib/format";
import {
  getCategories,
  getFeaturedListings,
  getListingCountsByCategory,
  getListingCountsByLocation,
  getLocations,
  getMediaForProperties,
  searchListings,
} from "@/lib/properties";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const STEPS = [
  { icon: Search, title: "Discover a property", text: "Search by location, budget and property type, or tell us your brief." },
  { icon: FileSearch, title: "Review the details", text: "Photos, video, charges and document status are on every listing." },
  { icon: MessagesSquare, title: "Contact the team", text: "WhatsApp, call or send an enquiry. We aim to reply within one working day." },
  { icon: CalendarCheck, title: "Schedule an inspection", text: "Pick a time online. We call to confirm before you travel." },
  { icon: Handshake, title: "Proceed with confidence", text: "We coordinate documents, your lawyer and the agreed payment steps." },
];

const COMMITMENTS = [
  {
    title: "Charges shown separately",
    text: "Rent, caution deposits, agency, legal and service charges each have their own line. We never fold them into one headline figure.",
  },
  {
    title: "Honest document status",
    text: "A title is marked verified only after our team has reviewed it. Everything else is labelled as the owner's stated documents.",
  },
  {
    title: "Inspections confirmed by a person",
    text: "Booking online sends a request. A member of our team calls to confirm the time, so no one makes a wasted trip.",
  },
  {
    title: "An office you can visit",
    text: "Meet us at Plot 833 Emmanuel Aguna, Jabi District, Abuja, before you commit to anything.",
  },
];

export default async function HomePage() {
  const [settings, featured, categories, locations, categoryCounts, locationCounts, photoListings, videoListings, posts] = await Promise.all([
    getSettings(),
    getFeaturedListings(6),
    getCategories(),
    getLocations(),
    getListingCountsByCategory(),
    getListingCountsByLocation(),
    searchListings("all", {}, "image"),
    searchListings("all", {}, "video"),
    getBlogPosts({ limit: 3 }),
  ]);

  const photoItems = photoListings.items.slice(0, 5);
  const videoProps = videoListings.items.slice(0, 2);
  const videos = await getMediaForProperties(videoProps.map((p) => p.id), "video");
  const featuredDistricts = locations.filter((l) => l.type === "district" && l.is_featured).slice(0, 8);
  const testimonials = settings.testimonials.items.filter((t) => t.permission_confirmed);
  const { contact } = settings;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: settings.company.brand_name,
          parentOrganization: { "@type": "Organization", name: settings.company.legal_name },
          url: publicEnv.siteUrl,
          telephone: contact.phone,
          email: contact.email,
          slogan: settings.company.tagline,
          address: {
            "@type": "PostalAddress",
            streetAddress: contact.address_line,
            addressLocality: contact.city,
            addressRegion: contact.state,
            addressCountry: "NG",
          },
          areaServed: { "@type": "City", name: "Abuja" },
          sameAs: Object.values(settings.social).filter(Boolean),
        }}
      />

      <section className="on-dark relative overflow-hidden bg-navy-900 text-white">
        <HeroIllustration className="pointer-events-none absolute bottom-0 right-[-8rem] h-[85%] w-auto opacity-70 md:right-[-4rem] lg:right-0 lg:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/90 to-navy-900/20" aria-hidden="true" />
        <div className="container-page relative pb-28 pt-16 md:pb-36 md:pt-24">
          <p className="text-sm font-semibold text-gold">{settings.company.tagline}</p>
          <h1 className="display mt-5 max-w-3xl text-[2.75rem] sm:text-[3.5rem] lg:text-[4.5rem]">
            Find a property that fits your ambition.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100">
            Homes, land, offices and investment property across Abuja, presented with clear prices, real photographs and an
            honest account of the documents behind each one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/properties" variant="gold" size="lg">
              Explore Properties
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline-light" size="lg" data-track="speak_to_agent_click">
              Speak to an Agent
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="container-page relative z-10 -mt-20 md:-mt-24">
        <HeroSearch categories={categories} locations={locations} />
        <p className="mt-3 text-right text-sm">
          <Link href="/search" className="font-semibold text-navy-700 underline underline-offset-2">
            Advanced search
          </Link>
        </p>
      </div>

      <section aria-labelledby="featured-heading" className="container-page py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="featured-heading" className="display text-[2.25rem] text-navy-900 md:text-[2.75rem]">
              Featured properties
            </h2>
            <p className="mt-2 max-w-xl text-slate">Selected listings across Abuja, updated as properties come to market.</p>
          </div>
          <div className="flex gap-2">
            <ButtonLink href="/properties/for-sale" variant="secondary" size="sm">
              Browse Properties for Sale
            </ButtonLink>
            <ButtonLink href="/properties/for-rent" variant="secondary" size="sm">
              Browse Properties for Rent
            </ButtonLink>
          </div>
        </div>
        <div className="mt-8">
          {featured.length > 0 ? (
            <PropertyGrid items={featured} />
          ) : (
            <div className="rounded-[var(--radius-card)] border border-dashed border-navy-200 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold">New listings are being prepared</h3>
              <p className="mx-auto mt-2 max-w-md text-slate">
                Tell us what you are looking for and we will contact you as soon as a matching property is available.
              </p>
              <div className="mt-6">
                <ButtonLink href="/contact?category=buying">Get Property Assistance</ButtonLink>
              </div>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="categories-heading" className="border-y border-line bg-white py-16 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="categories-heading" className="display text-[2.25rem] text-navy-900">
              Browse by property type
            </h2>
            <p className="mt-3 text-slate">From a first apartment to a warehouse in Idu, start with the kind of property you need.</p>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {categories.map((c) => {
              const count = categoryCounts[c.slug] ?? 0;
              return (
                <li key={c.id}>
                  <Link href={`/properties?category=${c.slug}`} className="group flex items-center gap-4 border-b border-line py-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-ivory text-navy-700 transition-colors group-hover:bg-navy-800 group-hover:text-gold">
                      <CategoryIcon name={c.icon} className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-charcoal group-hover:text-navy-700">{c.name}</span>
                      <span className="block text-sm text-slate">
                        {count > 0 ? `${count} listing${count === 1 ? "" : "s"}` : "Ask about availability"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {featuredDistricts.length > 0 && (
        <section aria-labelledby="locations-heading" className="container-page py-16 md:py-20">
          <h2 id="locations-heading" className="display text-[2.25rem] text-navy-900">
            Explore Abuja by district
          </h2>
          <p className="mt-2 max-w-xl text-slate">Our listings start in the Federal Capital Territory, with more Nigerian cities to follow.</p>
          <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {featuredDistricts.map((d) => {
              const count = locationCounts[d.id] ?? 0;
              return (
                <li key={d.id}>
                  <Link
                    href={`/locations/${d.slug}`}
                    className="flex h-full flex-col justify-between rounded-[var(--radius-card)] border border-line bg-white p-5 transition-colors hover:border-navy-700"
                  >
                    <span className="display text-[1.5rem] text-navy-900">{d.name}</span>
                    <span className="mt-6 text-sm text-slate">{count > 0 ? `${count} available` : "View area guide"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {photoItems.length > 0 && (
        <section aria-labelledby="photos-heading" className="bg-navy-900 py-16 text-white md:py-20 on-dark">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="photos-heading" className="display text-[2.25rem]">
                From the photo gallery
              </h2>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/gallery/photos/for-sale" variant="outline-light" size="sm">
                  Sales gallery
                </ButtonLink>
                <ButtonLink href="/gallery/photos/for-rent" variant="outline-light" size="sm">
                  Rentals gallery
                </ButtonLink>
              </div>
            </div>
            <ul className="mt-8 grid auto-rows-[12rem] grid-cols-2 gap-2 md:auto-rows-[14rem] md:grid-cols-4">
              {photoItems.map((p, i) => (
                <li key={p.id} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                  <Link href={`/properties/${p.slug}`} className="group relative block h-full overflow-hidden rounded-[var(--radius-card)] bg-navy-800">
                    <PropertyImage variants={p.cover_variants} alt={p.cover_alt || p.title} className="h-full w-full transition-transform duration-500 group-hover:scale-105" preferred={i === 0 ? 1600 : 800} />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 to-transparent p-4">
                      <span className="block text-sm font-semibold">{p.title}</span>
                      <span className="block text-xs text-navy-100">{formatLocation(p)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section aria-labelledby="videos-heading" className="container-page py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="videos-heading" className="display text-[2.25rem] text-navy-900">
                Watch before you visit
              </h2>
              <p className="mt-2 text-slate">Video tours load only when you press play.</p>
            </div>
            <ButtonLink href="/gallery/videos/for-sale" variant="secondary" size="sm">
              <Video className="h-4 w-4" aria-hidden="true" />
              Watch Property Videos
            </ButtonLink>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {videoProps.map((p) => {
              const v = videos.find((m) => m.property_id === p.id);
              if (!v) return null;
              return (
                <li key={v.id}>
                  <VideoPlayer src={v.storage_path} poster={v.poster_path} title={v.title || p.title} duration={v.duration_seconds} propertyReference={p.reference} />
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <Link href={`/properties/${p.slug}`} className="font-semibold hover:underline">
                        {p.title}
                      </Link>
                      <p className="text-sm text-slate">{formatLocation(p)}</p>
                    </div>
                    <Price size="sm" price={p.price} price_on_request={p.price_on_request} currency={p.currency} billing_frequency={p.billing_frequency} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="services-heading" className="border-y border-line bg-white py-16 md:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="services-heading" className="display text-[2.25rem] text-navy-900">
                What we do
              </h2>
              <p className="mt-2 max-w-xl text-slate">Sales, rentals, management and advisory under one roof in Jabi.</p>
            </div>
            <ButtonLink href="/services" variant="secondary" size="sm">
              All services
            </ButtonLink>
          </div>
          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.slice(0, 6).map((s) => (
              <li key={s.slug} className="flex gap-4">
                <CategoryIcon name={s.icon} className="mt-1 h-6 w-6 shrink-0 text-gold-ink" />
                <div>
                  <h3 className="font-semibold">
                    <Link href={`/services/${s.slug}`} className="hover:underline">
                      {s.name}
                    </Link>
                  </h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-slate">{s.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="why-heading" className="container-page grid gap-12 py-16 md:py-20 lg:grid-cols-2">
        <div>
          <h2 id="why-heading" className="display text-[2.25rem] text-navy-900">
            Why work with Msendo Noble Homes
          </h2>
          <p className="mt-3 max-w-md text-slate">
            Property decisions are large and hard to undo. These are the standards we hold every listing and every
            conversation to.
          </p>
          <dl className="mt-8 space-y-6">
            {COMMITMENTS.map((c) => (
              <div key={c.title} className="border-l-2 border-gold pl-5">
                <dt className="font-semibold text-charcoal">{c.title}</dt>
                <dd className="mt-1 text-[0.9375rem] leading-relaxed text-slate">{c.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-[var(--radius-card)] bg-navy-900 p-8 text-white on-dark md:p-10">
          <h2 className="display text-[2rem]">How it works</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/60 text-sm font-semibold text-gold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy-200">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <ButtonLink href="/schedule-inspection" variant="gold">
              Book an Inspection
            </ButtonLink>
          </div>
        </div>
      </section>

      {posts.items.length > 0 && (
        <section aria-labelledby="blog-heading" className="border-t border-line bg-white py-16 md:py-20">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="blog-heading" className="display text-[2.25rem] text-navy-900">
                Insights and guides
              </h2>
              <ButtonLink href="/blog" variant="secondary" size="sm">
                All articles
              </ButtonLink>
            </div>
            <ul className="mt-8 grid gap-8 md:grid-cols-3">
              {posts.items.map((post) => (
                <li key={post.id}>
                  <article>
                    {post.featured_image_url && (
                      <img src={post.featured_image_url} alt={post.featured_image_alt ?? ""} loading="lazy" className="aspect-[3/2] w-full rounded-[var(--radius-card)] object-cover" />
                    )}
                    <p className="mt-4 text-sm text-slate">
                      {post.category_name ?? "Insights"}, {formatDate(post.published_at)}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold leading-snug">
                      <Link href={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h3>
                    {post.excerpt && <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-slate">{post.excerpt}</p>}
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section aria-labelledby="testimonials-heading" className="container-page py-16 md:py-20">
          <h2 id="testimonials-heading" className="display text-[2.25rem] text-navy-900">
            What clients say
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <li key={`${t.name}-${t.quote.slice(0, 20)}`}>
                <figure className="h-full rounded-[var(--radius-card)] border border-line bg-white p-6">
                  <blockquote className="display text-[1.25rem] leading-snug text-navy-900">{t.quote}</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-semibold">{t.name}</span>
                    {t.context && <span className="block text-slate">{t.context}</span>}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="cta-heading" className="container-page pb-16 md:pb-20">
        <div className="grid gap-8 overflow-hidden rounded-[var(--radius-card)] border border-line bg-white md:grid-cols-2">
          <div className="p-8 md:p-12">
            <h2 id="cta-heading" className="display text-[2rem] text-navy-900 md:text-[2.5rem]">
              Tell us what you are looking for
            </h2>
            <p className="mt-3 text-slate">
              Buying, renting, investing or selling, a short conversation saves days of searching. Call, WhatsApp or send
              your brief.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/contact">Speak to Our Team</ButtonLink>
              <ButtonLink href="/list-your-property" variant="secondary">
                List Your Property
              </ButtonLink>
            </div>
          </div>
          <div className="flex flex-col justify-center border-t border-line bg-ivory p-8 md:border-l md:border-t-0 md:p-12">
            <h2 className="text-lg font-semibold">Property insights by email</h2>
            <p className="mt-2 text-sm text-slate">New listings and practical guides. No more than twice a month.</p>
            <div className="mt-4">
              <NewsletterForm tone="light" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
