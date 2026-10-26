// src/lib/media-processing.ts
import "server-only";
import sharp from "sharp";

export const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif"]);
export const VARIANT_WIDTHS = [400, 800, 1600] as const;

export interface ProcessedImage {
  width: number;
  height: number;
  variants: { width: number; buffer: Buffer }[];
}

export async function processImage(input: Buffer, widths: readonly number[] = VARIANT_WIDTHS): Promise<ProcessedImage> {
  const image = sharp(input, { limitInputPixels: 80_000_000, failOn: "error" });
  const meta = await image.metadata();
  if (!meta.format || !ALLOWED_IMAGE_FORMATS.has(meta.format)) {
    throw new Error("Unsupported image type. Upload a JPEG, PNG, WebP or AVIF photo.");
  }
  if (!meta.width || !meta.height) throw new Error("This image could not be read.");
  if (meta.width < 300 || meta.height < 200) throw new Error("This image is too small. Use photos at least 300 pixels wide.");

  const oriented = await sharp(input, { limitInputPixels: 80_000_000 }).rotate().toBuffer({ resolveWithObject: true });
  const width = oriented.info.width;
  const height = oriented.info.height;

  const variants = await Promise.all(
    widths.map(async (w) => ({
      width: w,
      buffer: await sharp(oriented.data)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: w >= 1600 ? 80 : 78, effort: 4 })
        .toBuffer(),
    })),
  );

  return { width, height, variants };
}

const MP4_BRANDS = new Set(["isom", "iso2", "iso3", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V ", "M4A ", "dash", "mmp4", "msnv", "3gp4", "3gp5", "3gp6", "qt  "]);

export function looksLikeMp4(header: Uint8Array) {
  if (header.length < 12) return false;
  const box = String.fromCharCode(...header.slice(4, 8));
  const brand = String.fromCharCode(...header.slice(8, 12));
  return box === "ftyp" && MP4_BRANDS.has(brand);
}
