// src/app/(site)/properties/for-rent/page.tsx
import type { Metadata } from "next";
import { ListingsView } from "@/components/property/ListingsView";
import { PageHeader } from "@/components/site/PageHeader";
import { listingMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return listingMetadata({
    title: "Property for Rent in Abuja",
    description: "Apartments, houses, offices and short-let accommodation for rent in Abuja. Rent is shown separately from deposits, agency and legal fees.",
    path: "/properties/for-rent",
    params: await searchParams,
  });
}

export default async function ForRentPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        title="Property for rent"
        crumbs={[{ label: "Properties", href: "/properties" }, { label: "For rent" }]}
        intro={
          <p>
            Long-term rentals and short-lets. The rent shown is the rent alone. Caution deposits, agency, legal and service
            charges are listed separately on each property page.
          </p>
        }
      />
      <ListingsView scope="rent" rawParams={params} basePath="/properties/for-rent" />
    </>
  );
}
