// src/app/(site)/gallery/photos/for-sale/page.tsx
import type { Metadata } from "next";
import { GalleryPage } from "@/components/gallery/GalleryPage";
import { listingMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return listingMetadata({
    title: "Photo Gallery: Property for Sale in Abuja",
    description: "Photographs of properties for sale in Abuja, with prices, locations and references.",
    path: "/gallery/photos/for-sale",
    params: await searchParams,
  });
}

export default async function Page({ searchParams }: Props) {
  return <GalleryPage kind="photos" tx="for-sale" rawParams={await searchParams} />;
}
