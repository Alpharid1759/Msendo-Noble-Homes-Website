// src/components/gallery/PhotoGalleryGrid.tsx
"use client";

import { Camera, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Lightbox, type LightboxImage } from "@/components/property/Lightbox";
import { Price } from "@/components/property/Price";
import { PropertyImage } from "@/components/property/PropertyImage";
import { formatLocation } from "@/lib/format";
import type { PropertyCardData } from "@/types/domain";

export interface GalleryItem {
  property: PropertyCardData;
  images: LightboxImage[];
  url: string;
}

export function PhotoGalleryGrid({ items }: { items: GalleryItem[] }) {
  const [open, setOpen] = useState<{ item: number; image: number } | null>(null);
  const active = open ? items[open.item] : null;

  return (
    <>
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => {
          const p = item.property;
          const thumbs = item.images.slice(0, 4);
          return (
            <li key={p.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                <div className={`grid gap-1 p-1 ${thumbs.length >= 3 ? "grid-cols-3 grid-rows-2" : thumbs.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {thumbs.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setOpen({ item: idx, image: i })}
                      className={`relative overflow-hidden rounded-[3px] bg-sand ${i === 0 && thumbs.length >= 3 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-[4/3]"}`}
                    >
                      <PropertyImage variants={img.variants} alt={img.alt} preferred={i === 0 ? 800 : 400} sizes={i === 0 ? "(min-width: 1024px) 22vw, 66vw" : "15vw"} className="h-full w-full transition-transform duration-500 hover:scale-105" />
                      <span className="sr-only">
                        Open photo {i + 1} of {item.images.length} for {p.title}
                      </span>
                      {i === 3 && item.images.length > 4 && (
                        <span className="absolute inset-0 flex items-center justify-center bg-navy-950/60 text-sm font-semibold text-white" aria-hidden="true">
                          +{item.images.length - 4}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <Price size="sm" price={p.price} price_on_request={p.price_on_request} currency={p.currency} billing_frequency={p.billing_frequency} />
                  <h3 className="mt-1 font-semibold leading-snug">
                    <Link href={item.url} className="hover:underline">
                      {p.title}
                    </Link>
                  </h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate">
                    <MapPin className="h-4 w-4 text-gold-ink" aria-hidden="true" />
                    {formatLocation(p) || "Abuja"}
                  </p>
                  {p.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate">{p.description}</p>}
                  <div className="flex-1" />
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate">Ref {p.reference}</span>
                    <button type="button" onClick={() => setOpen({ item: idx, image: 0 })} className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline">
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      {item.images.length} photo{item.images.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      {open && active && (
        <Lightbox
          images={active.images}
          startIndex={open.image}
          title={active.property.title}
          onClose={() => setOpen(null)}
          footer={() => (
            <div className="mx-auto mt-2 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold text-white">{active.property.title}</span>
              <span className="text-navy-200">Ref {active.property.reference}</span>
              <Link href={active.url} className="font-semibold text-gold underline underline-offset-2">
                View full property details
              </Link>
            </div>
          )}
        />
      )}
    </>
  );
}
