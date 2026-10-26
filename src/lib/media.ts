// src/lib/media.ts
import { publicMediaUrl } from "@/lib/env";
import type { ImageVariants } from "@/types/domain";

export const IMAGE_WIDTHS = [400, 800, 1600] as const;

export function variantUrl(variants: ImageVariants | null | undefined, preferred: 400 | 800 | 1600 = 800) {
  if (!variants) return null;
  const order = [preferred, ...IMAGE_WIDTHS.filter((w) => w !== preferred)];
  for (const w of order) {
    const path = variants[String(w) as keyof ImageVariants];
    if (path) return publicMediaUrl(path);
  }
  return null;
}

export function variantSrcSet(variants: ImageVariants | null | undefined) {
  if (!variants) return undefined;
  const parts = IMAGE_WIDTHS.flatMap((w) => {
    const path = variants[String(w) as keyof ImageVariants];
    const url = publicMediaUrl(path);
    return url ? [`${url} ${w}w`] : [];
  });
  return parts.length ? parts.join(", ") : undefined;
}
