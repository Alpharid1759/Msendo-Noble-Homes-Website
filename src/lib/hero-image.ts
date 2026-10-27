// src/lib/hero-image.ts
const UNSPLASH_PHOTO = "https://images.unsplash.com/photo-1613490493576-7fde63acd811";

const unsplashUrl = (width: number) => `${UNSPLASH_PHOTO}?auto=format&fit=crop&q=70&w=${width}`;

export const defaultHeroImage = {
  src: unsplashUrl(1920),
  srcSet: [1080, 1600, 1920, 2560].map((w) => `${unsplashUrl(w)} ${w}w`).join(", "),
  credit: "Avi Werde",
  creditUrl: "https://unsplash.com/photos/white-and-brown-concrete-building-hHz4yrvxwlA",
};

export function resolveHeroImage(customUrl: string | null | undefined) {
  if (customUrl) return { src: customUrl, srcSet: undefined, credit: null, creditUrl: null };
  return defaultHeroImage;
}
