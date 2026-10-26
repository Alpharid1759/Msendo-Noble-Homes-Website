// src/components/property/PropertyImage.tsx
import clsx from "clsx";
import { variantSrcSet, variantUrl } from "@/lib/media";
import type { ImageVariants } from "@/types/domain";

export function PropertyImage({
  variants,
  alt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
  priority = false,
  preferred = 800,
}: {
  variants: ImageVariants | null | undefined;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  preferred?: 400 | 800 | 1600;
}) {
  const src = variantUrl(variants, preferred);
  if (!src) {
    return (
      <div
        className={clsx("flex items-center justify-center bg-sand text-slate", className)}
        role="img"
        aria-label={`${alt} (photo coming soon)`}
      >
        <svg viewBox="0 0 120 80" className="h-1/2 max-h-24 w-auto opacity-60" aria-hidden="true">
          <path d="M10 70 V36 L40 14 L70 36 V70 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M70 70 V44 H110 V70" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M33 70 V50 H47 V70 M80 52 H88 V60 H80 Z M94 52 H102 V60 H94 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M4 70 H116" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      srcSet={variantSrcSet(variants)}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={clsx("object-cover", className)}
    />
  );
}
