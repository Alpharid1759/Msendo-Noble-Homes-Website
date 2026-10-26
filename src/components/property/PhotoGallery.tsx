// src/components/property/PhotoGallery.tsx
"use client";

import clsx from "clsx";
import { Images } from "lucide-react";
import { useState } from "react";
import { PropertyImage } from "./PropertyImage";
import { Lightbox, type LightboxImage } from "./Lightbox";

export function PhotoGallery({ images, title }: { images: LightboxImage[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] overflow-hidden rounded-[var(--radius-card)]">
        <PropertyImage variants={null} alt={title} className="h-full w-full" />
      </div>
    );
  }

  const [first, ...rest] = images;
  const side = rest.slice(0, 4);

  return (
    <>
      <div className={clsx("grid gap-2", side.length > 0 && "md:grid-cols-4 md:grid-rows-2")}>
        <button
          type="button"
          onClick={() => setOpen(0)}
          className={clsx(
            "group relative block overflow-hidden rounded-[var(--radius-card)] bg-sand",
            side.length > 0 ? "aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[26rem]" : "aspect-[16/9]",
          )}
        >
          <PropertyImage
            variants={first.variants}
            alt={first.alt}
            priority
            preferred={1600}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="sr-only">Open photo 1 of {images.length}</span>
        </button>
        {side.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpen(i + 1)}
            className="group relative hidden overflow-hidden rounded-[var(--radius-card)] bg-sand md:block"
          >
            <PropertyImage variants={img.variants} alt={img.alt} sizes="25vw" className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
            <span className="sr-only">Open photo {i + 2} of {images.length}</span>
          </button>
        ))}
      </div>
      {images.length > 1 && (
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-white px-4 text-sm font-semibold text-navy-800 hover:bg-sand"
        >
          <Images className="h-4 w-4" aria-hidden="true" />
          View all {images.length} photos
        </button>
      )}
      {open !== null && <Lightbox images={images} startIndex={open} onClose={() => setOpen(null)} title={title} />}
    </>
  );
}
