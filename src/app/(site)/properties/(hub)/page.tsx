// src/app/(site)/properties/(hub)/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ListingsView } from "@/components/property/ListingsView";
import { PageHeader } from "@/components/site/PageHeader";
import { listingMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return listingMetadata({
    title: "Properties in Abuja",
    description: "Search houses, apartments, land, offices, warehouses and short-let apartments for sale and rent across Abuja.",
    path: "/properties",
    params: await searchParams,
  });
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        title="Properties in Abuja"
        crumbs={[{ label: "Properties" }]}
        intro={
          <p>
            Every published listing for sale, rent and short-let. Narrow the search with the filters, or go straight to{" "}
            <Link href="/properties/for-sale" className="font-semibold text-white underline underline-offset-4">
              homes for sale
            </Link>{" "}
            or{" "}
            <Link href="/properties/for-rent" className="font-semibold text-white underline underline-offset-4">
              homes for rent
            </Link>
            .
          </p>
        }
      />
      <ListingsView scope="all" rawParams={params} basePath="/properties" />
    </>
  );
}
