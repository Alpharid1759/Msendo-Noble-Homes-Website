// src/app/(site)/gallery/videos/for-sale/page.tsx
import type { Metadata } from "next";
import { GalleryPage } from "@/components/gallery/GalleryPage";
import { listingMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return listingMetadata({
    title: "Video Tours: Property for Sale in Abuja",
    description: "Video tours of properties for sale in Abuja. Watch before you book an inspection.",
    path: "/gallery/videos/for-sale",
    params: await searchParams,
  });
}

export default async function Page({ searchParams }: Props) {
  return <GalleryPage kind="videos" tx="for-sale" rawParams={await searchParams} />;
}
