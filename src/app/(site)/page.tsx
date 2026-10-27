// src/app/(site)/page.tsx
import { BadgeCheck, Building2, CalendarCheck, FileSearch, Handshake, MessagesSquare, ReceiptText, Search, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { HeroSearch } from "@/components/property/HeroSearch";
import { Price } from "@/components/property/Price";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyImage } from "@/components/property/PropertyImage";
import { VideoPlayer } from "@/components/property/VideoPlayer";
import { JsonLd } from "@/components/site/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { SERVICES } from "@/content/services";
import { getBlogPosts } from "@/lib/blog";
import { publicEnv } from "@/lib/env";
import { resolveHeroImage } from "@/lib/hero-image";
import { formatDate, formatLocation } from "@/lib/format";
import { describeHours } from "@/lib/inspection-rules";
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
    icon: ReceiptText,
    title: "Charges shown separately",
    text: "Rent, caution deposits, agency, legal and service charges each have their own line. We never fold them into one headline figure.",
  },
  {
    icon: BadgeCheck,
    title: "Honest document status",
    text: "A title is marked verified only after our team has reviewed it. Everything else is labelled as the owner's stated documents.",
  },
  {
    icon: CalendarCheck,
    title: "Inspections confirmed by a person",
    text: "Booking online sends a request. A member of our team calls to confirm the time, so no one makes a wasted trip.",
  },
  {
    icon: Building2,
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
  const heroImage = resolveHeroImage(settings.brand.hero_image_url);

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
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: `${String(settings.inspections.earliest_hour).padStart(2, "0")}:00`,
              closes: `${String(settings.inspections.latest_hour).padStart(2, "0")}:00`,
            },
            ...(settings.inspections.allow_saturdays
              ? [
                  {
                    "@type": "OpeningHoursSpecification",
                    dayOfWeek: ["Saturday"],
                    opens: `${String(settings.inspections.saturday_earliest_hour).padStart(2, "0")}:00`,
                    closes: `${String(settings.inspections.saturday_latest_hour).padStart(2, "0")}:00`,
                  },
                ]
              : []),
          ],
          sameAs: Object.values(settings.social).filter(Boolean),
        }}
      />

      <section className="on-dark relative -mt-[5.25rem] overflow-hidden bg-navy-950 text-white">
        <img
          src={heroImage.src}
          srcSet={heroImage.srcSet}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050706]/85 via-[#050706]/45 to-[#050706]/10" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050706]/70 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#0e1210] via-[#0e1210]/60 to-transparent" aria-hidden="true" />
        {heroImage.credit && (
          <p className="absolute bottom-48 right-4 z-[1] hidden text-[0.6875rem] text-white/55 md:block">
            Photo:{" "}
            <a href={heroImage.creditUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-white hover:underline">
              {heroImage.credit} on Unsplash
            </a>
          </p>
        )}
        <div className="container-page relative pb-56 pt-40 md:pb-64 md:pt-48 lg:pt-52">
          <p className="flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-gold-light">
            <span className="h-px w-10 bg-gold" aria-hidden="true" />
            {settings.company.tagline.toUpperCase()}
          </p>
          <h1 className="display mt-6 max-w-4xl text-[2.6rem] uppercase leading-[1.02] tracking-[0.01em] text-[#f6f1e6] sm:text-[3.6rem] lg:text-[4.75rem]">
            Find a property that fits your ambition.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#e4dfd3]">
            Homes, land, offices and investment property across Abuja, presented with clear prices, real photographs and an
            honest account of the documents behind each one.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/properties" variant="gold" size="lg">
              Explore Properties
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline-light" size="lg" data-track="speak_to_agent_click">
              Speak to an Agent
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="container-page relative z-10 -mt-40 md:-mt-44">
        <div className="mx-auto max-w-5xl">
          <HeroSearch categories={categories} locations={locations} />
          <p className="mt-3 text-right text-sm">
            <Link href="/search" className="font-semibold text-accent underline underline-offset-2">
              Advanced search
            </Link>
          </p>
        </div>
      </div>

      <section aria-labelledby="featured-heading" className="container-page py-16 md:py-24">
        <div className="text-center">
          <h2 id="featured-heading" className="display text-[2.5rem] text-heading md:text-[3.25rem]">
            Featured Properties
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate">Selected listings across Abuja, updated as properties come to market.</p>
        </div>
        <div className="mx-auto mt-10 max-w-6xl">
          {featured.length > 0 ? (
            <ul className="grid gap-6 md:grid-cols-2">
              {featured.slice(0, 4).map((p, i) => (
                <li key={p.id}>
                  <PropertyCard p={p} priority={i < 2} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="gold-frame rounded-[14px] p-10 text-center">
              <h3 className="display text-[1.6rem] text-heading">New listings are being prepared</h3>
              <p className="mx-auto mt-2 max-w-md text-slate">
                Tell us what you are looking for and we will contact you as soon as a matching property is available.
              </p>
              <div className="mt-6">
                <ButtonLink href="/contact?category=buying" variant="gold">
                  Get Property Assistance
                </ButtonLink>
              </div>
            </div>
          )}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/properties/for-sale" variant="secondary">
            Browse Properties for Sale
          </ButtonLink>
          <ButtonLink href="/properties/for-rent" variant="secondary">
            Browse Properties for Rent
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="categories-heading" className="border-y border-line bg-surface py-16 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="categories-heading" className="display text-[2.25rem] text-heading">
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
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-ivory text-accent transition-colors group-hover:bg-navy-800 group-hover:text-gold">
                      <CategoryIcon name={c.icon} className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-charcoal group-hover:text-accent">{c.name}</span>
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
          <h2 id="locations-heading" className="display text-[2.25rem] text-heading">
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
                    className="flex h-full flex-col justify-between rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors hover:border-accent"
                  >
                    <span className="display text-[1.5rem] text-heading">{d.name}</span>
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
              <h2 id="videos-heading" className="display text-[2.25rem] text-heading">
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

      <section aria-labelledby="services-heading" className="border-y border-line bg-surface py-16 md:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="services-heading" className="display text-[2.25rem] text-heading">
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

      <section aria-labelledby="why-heading" className="container-page py-16 md:py-24">
        <h2 id="why-heading" className="display text-center text-[2.5rem] text-heading md:text-[3.25rem]">
          Why Choose Us
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate">
          Property decisions are large and hard to undo. These are the standards we hold every listing and every conversation to.
        </p>
        <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {COMMITMENTS.map((c) => (
            <li key={c.title} className="text-center">
              <c.icon className="mx-auto h-10 w-10 text-gold" strokeWidth={1.25} aria-hidden="true" />
              <h3 className="display mt-4 text-[1.4rem] text-heading">{c.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-[0.9375rem] leading-relaxed text-slate">{c.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-heading" className="border-y border-line bg-navy-900 py-16 md:py-20">
        <div className="container-page">
          <h2 id="how-heading" className="display text-center text-[2.25rem] text-heading md:text-[2.75rem]">
            How it works
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative text-center">
                {i < STEPS.length - 1 && <span className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-[calc(100%-4rem)] bg-gold/30 md:block" aria-hidden="true" />}
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-3 text-xs font-semibold tracking-[0.2em] text-gold-light">STEP {i + 1}</p>
                <h3 className="mt-1 font-semibold text-heading">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {posts.items.length > 0 && (
        <section aria-labelledby="blog-heading" className="border-t border-line bg-surface py-16 md:py-20">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="blog-heading" className="display text-[2.25rem] text-heading">
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
          <h2 id="testimonials-heading" className="display text-[2.25rem] text-heading">
            What clients say
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <li key={`${t.name}-${t.quote.slice(0, 20)}`}>
                <figure className="h-full rounded-[var(--radius-card)] border border-line bg-surface p-6">
                  <blockquote className="display text-[1.25rem] leading-snug text-heading">{t.quote}</blockquote>
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

      <section aria-labelledby="cta-heading" className="container-page pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-[16px] border border-gold/25 bg-navy-950 px-6 py-14 text-center md:px-12">
          <img src={heroImage.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-[2px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(230_162_12/0.14)_0%,transparent_70%)]" aria-hidden="true" />
          <div className="relative">
            <h2 id="cta-heading" className="display text-[2rem] text-[#f6f1e6] md:text-[2.75rem]">
              Private viewings available on request
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[#d9d4c8]">
              Buying, renting, investing or selling, a short conversation saves days of searching. Our office in Jabi is open{" "}
              {describeHours(settings.inspections).replace(/; /g, " and ")}.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/schedule-inspection" variant="gold" size="lg">
                Book an Inspection
              </ButtonLink>
              <ButtonLink href="/contact" variant="outline-light" size="lg">
                Speak to Our Team
              </ButtonLink>
              <ButtonLink href="/list-your-property" variant="outline-light" size="lg">
                List Your Property
              </ButtonLink>
            </div>
          </div>
        </div>

      </section>
    </>
  );
}
