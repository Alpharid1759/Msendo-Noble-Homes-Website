// src/components/property/PropertyCard.tsx
import clsx from "clsx";
import { Bath, BedDouble, Camera, MapPin, Ruler, Video } from "lucide-react";
import Link from "next/link";
import { formatArea, formatLocation, isNewListing } from "@/lib/format";
import type { PropertyCardData } from "@/types/domain";
import { FlagBadge, StatusBadge, TransactionBadge } from "./Badges";
import { Price } from "./Price";
import { PropertyImage } from "./PropertyImage";

export function PropertySpecs({ p, className }: { p: Pick<PropertyCardData, "bedrooms" | "bathrooms" | "floor_area" | "land_area" | "area_unit">; className?: string }) {
  const area = formatArea(p.floor_area ?? p.land_area, p.area_unit);
  const items = [
    p.bedrooms !== null && p.bedrooms !== undefined ? { icon: BedDouble, label: `${p.bedrooms} bed${p.bedrooms === 1 ? "" : "s"}` } : null,
    p.bathrooms !== null && p.bathrooms !== undefined ? { icon: Bath, label: `${p.bathrooms} bath${p.bathrooms === 1 ? "" : "s"}` } : null,
    area ? { icon: Ruler, label: area } : null,
  ].filter(Boolean) as { icon: typeof Bath; label: string }[];
  if (!items.length) return null;
  return (
    <ul className={clsx("flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate", className)}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-navy-600" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function PropertyCard({
  p,
  layout = "grid",
  priority = false,
}: {
  p: PropertyCardData;
  layout?: "grid" | "list";
  priority?: boolean;
}) {
  const href = `/properties/${p.slug}`;
  const location = formatLocation(p);
  const isRental = p.transaction_type !== "sale";
  const isNew = isNewListing(p.published_at);

  return (
    <article
      className={clsx(
        "group relative flex h-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-shadow hover:shadow-[var(--shadow-lift)]",
        layout === "grid" ? "flex-col" : "flex-col sm:flex-row",
      )}
    >
      <div className={clsx("relative overflow-hidden bg-sand", layout === "grid" ? "aspect-[4/3]" : "aspect-[4/3] sm:aspect-auto sm:w-80 sm:shrink-0")}>
        <PropertyImage
          variants={p.cover_variants}
          alt={p.cover_alt || p.title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
          priority={priority}
          sizes={layout === "grid" ? undefined : "(min-width: 640px) 320px, 100vw"}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <TransactionBadge type={p.transaction_type} />
          <StatusBadge status={p.status} />
          {p.is_featured && <FlagBadge>Featured</FlagBadge>}
          {isNew && !p.is_featured && <FlagBadge tone="light">New</FlagBadge>}
          {p.is_demo && <FlagBadge tone="demo">Demo listing</FlagBadge>}
        </div>
        {(p.image_count > 0 || p.video_count > 0) && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {p.image_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-[3px] bg-navy-950/75 px-1.5 py-0.5 text-xs font-medium text-white">
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                {p.image_count}
                <span className="sr-only">photos</span>
              </span>
            )}
            {p.video_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-[3px] bg-navy-950/75 px-1.5 py-0.5 text-xs font-medium text-white">
                <Video className="h-3.5 w-3.5" aria-hidden="true" />
                {p.video_count}
                <span className="sr-only">videos</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Price price={p.price} price_on_request={p.price_on_request} currency={p.currency} billing_frequency={p.billing_frequency} />
        <h3 className="mt-1.5 text-[1.0625rem] font-semibold leading-snug text-charcoal">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline">
            {p.title}
          </Link>
        </h3>
        {location && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-slate">
            <MapPin className="h-4 w-4 shrink-0 text-gold-ink" aria-hidden="true" />
            {location}
          </p>
        )}
        <PropertySpecs p={p} className="mt-3" />
        {layout === "list" && p.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate">{p.description}</p>
        )}
        <div className="flex-1" />
        <p className="mt-4 border-t border-line pt-4 text-xs text-slate">
          {p.category_name}
          <span className="mx-2 text-navy-200" aria-hidden="true">
            /
          </span>
          Ref {p.reference}
        </p>
        <div className="relative z-10 mt-3 flex gap-2">
          <Link
            href={href}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[var(--radius-control)] bg-navy-800 px-3 text-sm font-semibold text-white hover:bg-navy-700"
          >
            View property
          </Link>
          <Link
            href={isRental ? `/schedule-inspection?ref=${p.reference}` : `${href}#enquire`}
            data-track={isRental ? "inspection_cta_click" : "enquiry_cta_click"}
            data-track-ref={p.reference}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[var(--radius-control)] border border-navy-800 px-3 text-sm font-semibold text-navy-800 hover:bg-navy-100"
          >
            {isRental ? "Book inspection" : "Enquire now"}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PropertyGrid({ items, layout = "grid", priorityCount = 0 }: { items: PropertyCardData[]; layout?: "grid" | "list"; priorityCount?: number }) {
  return (
    <ul className={clsx("grid gap-6", layout === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
      {items.map((p, i) => (
        <li key={p.id} className="flex">
          <div className="w-full h-full">
            <PropertyCard p={p} layout={layout} priority={i < priorityCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}
