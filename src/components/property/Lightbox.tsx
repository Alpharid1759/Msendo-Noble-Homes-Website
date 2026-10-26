// src/components/property/Lightbox.tsx
"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { variantSrcSet, variantUrl } from "@/lib/media";
import type { ImageVariants } from "@/types/domain";

export interface LightboxImage {
  id: string;
  variants: ImageVariants;
  alt: string;
  caption?: string | null;
}

export function Lightbox({
  images,
  startIndex,
  onClose,
  title,
  footer,
}: {
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
  title: string;
  footer?: (index: number) => React.ReactNode;
}) {
  const [index, setIndex] = useState(startIndex);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>("button, a[href]");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, [go, onClose]);

  useEffect(() => {
    const next = images[(index + 1) % count];
    const url = variantUrl(next?.variants, 1600);
    if (url) {
      const img = new Image();
      img.src = url;
    }
  }, [index, images, count]);

  const current = images[index];
  if (!current) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: photo ${index + 1} of ${count}`}
      tabIndex={-1}
      className="on-dark fixed inset-0 z-[70] flex flex-col bg-navy-950/97 text-white outline-none"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="truncate text-sm text-navy-100">
          <span className="font-semibold text-white">{index + 1}</span> / {count}
          <span className="ml-3 hidden sm:inline">{title}</span>
        </p>
        <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-sm hover:bg-white/10">
          <X className="h-6 w-6" aria-hidden="true" />
          <span className="sr-only">Close photo viewer</span>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        <img
          key={current.id}
          src={variantUrl(current.variants, 1600) ?? ""}
          srcSet={variantSrcSet(current.variants)}
          sizes="100vw"
          alt={current.alt}
          className="max-h-full max-w-full object-contain"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 sm:left-4"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Previous photo</span>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 sm:right-4"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Next photo</span>
            </button>
          </>
        )}
      </div>

      <div className="px-4 pb-4 pt-3 sm:px-6" aria-live="polite">
        {current.caption && <p className="text-center text-sm text-navy-100">{current.caption}</p>}
        {footer?.(index)}
        {count > 1 && (
          <ul className="mx-auto mt-3 flex max-w-4xl gap-2 overflow-x-auto pb-1" aria-label="Thumbnails">
            {images.map((img, i) => (
              <li key={img.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? "true" : undefined}
                  className={`block h-14 w-20 overflow-hidden rounded-[3px] ring-2 ${i === index ? "ring-gold" : "ring-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={variantUrl(img.variants, 400) ?? ""} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <span className="sr-only">Show photo {i + 1}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
