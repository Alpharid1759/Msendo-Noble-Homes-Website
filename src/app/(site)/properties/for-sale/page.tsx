// src/app/(site)/properties/for-sale/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ListingsView } from "@/components/property/ListingsView";
import { PageHeader } from "@/components/site/PageHeader";
import { listingMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return listingMetadata({
    title: "Property for Sale in Abuja",
    description: "Houses, duplexes, apartments, land and commercial property for sale in Abuja, with asking prices in naira and clear title information.",
    path: "/properties/for-sale",
    params: await searchParams,
  });
}

export default async function ForSalePage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        title="Property for sale"
        crumbs={[{ label: "Properties", href: "/properties" }, { label: "For sale" }]}
        intro={
          <p>
            Asking prices are shown in naira. Title documents are marked as verified only after our team has checked them;
            otherwise they are the seller&apos;s stated documents. Read the{" "}
            <Link href="/legal/listing-disclaimer" className="font-semibold text-white underline underline-offset-4">
              listing disclaimer
            </Link>
            .
          </p>
        }
      />
      <ListingsView scope="sale" rawParams={params} basePath="/properties/for-sale" />
    </>
  );
}
