// src/app/(site)/gallery/videos/for-rent/page.tsx
import type { Metadata } from "next";
import { GalleryPage } from "@/components/gallery/GalleryPage";
import { listingMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return listingMetadata({
    title: "Video Tours: Property for Rent in Abuja",
    description: "Video tours of properties for rent in Abuja. Watch before you book an inspection.",
    path: "/gallery/videos/for-rent",
    params: await searchParams,
  });
}

export default async function Page({ searchParams }: Props) {
  return <GalleryPage kind="videos" tx="for-rent" rawParams={await searchParams} />;
}
