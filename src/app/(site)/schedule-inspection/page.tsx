// src/app/(site)/schedule-inspection/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { InspectionForm } from "@/components/forms/InspectionForm";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getPropertyByReference } from "@/lib/properties";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Book a Property Inspection",
  description: "Request an inspection of a property listed by Msendo Noble Homes in Abuja. Our team confirms every inspection time by phone.",
  alternates: { canonical: "/schedule-inspection" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ScheduleInspectionPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ref) ? sp.ref[0] : sp.ref;
  const ref = raw?.toUpperCase().match(/^[A-Z0-9-]{3,20}$/)?.[0];
  const [settings, property] = await Promise.all([getSettings(), ref ? getPropertyByReference(ref) : Promise.resolve(null)]);

  return (
    <>
      <PageHeader
        title="Book an inspection"
        crumbs={[{ label: "Book an inspection" }]}
        intro={<p>Choose a preferred time. This sends a request; a member of our team will call to confirm before you travel.</p>}
      />
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-10" aria-label="Inspection request form">
          {ref && !property && (
            <p role="alert" className="mb-6 rounded-[var(--radius-control)] border border-warning/30 bg-[#fff6e5] px-4 py-3 text-sm text-warning">
              We could not find an available property with reference {ref}. Check the reference, or{" "}
              <Link href="/properties" className="font-semibold underline">
                browse current listings
              </Link>
              .
            </p>
          )}
          <InspectionForm propertyReference={property?.reference ?? ref} rules={settings.inspections} allowReferenceEdit />
        </section>
        <aside>
          {property ? (
            <>
              <h2 className="mb-4 text-sm font-semibold text-slate">You are booking</h2>
              <PropertyCard p={property} />
            </>
          ) : (
            <div className="rounded-[var(--radius-card)] border border-line bg-white p-6">
              <h2 className="font-semibold">Where do I find the reference?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Every listing shows a reference such as MNH-S-01001 under the price. You can also press Book inspection on any
                property page.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
