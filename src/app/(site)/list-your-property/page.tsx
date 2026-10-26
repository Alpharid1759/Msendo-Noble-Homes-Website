// src/app/(site)/list-your-property/page.tsx
import type { Metadata } from "next";
import { TrackView } from "@/components/consent/TrackView";
import { ListPropertyForm } from "@/components/forms/ListPropertyForm";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = {
  title: "List Your Property",
  description: "Submit a house, apartment, land or commercial property in Abuja for sale or rent. Our team reviews every submission before it is published.",
  alternates: { canonical: "/list-your-property" },
};

const STEPS = [
  "Submit the details using this form.",
  "We call you to discuss the property, terms and documents.",
  "We inspect, photograph and film the property.",
  "Your listing is published once approved by our team.",
];

export default function ListYourPropertyPage() {
  return (
    <>
      <TrackView event="listing_submission_started" />
      <PageHeader
        title="List your property"
        crumbs={[{ label: "List your property" }]}
        intro={<p>For owners, landlords and developers in Abuja. Nothing is published until our team has reviewed it with you.</p>}
      />
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-10" aria-label="Property submission form">
          <ListPropertyForm />
        </section>
        <aside>
          <h2 className="text-lg font-semibold">What happens next</h2>
          <ol className="mt-5 space-y-5">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-semibold text-white">{i + 1}</span>
                <span className="pt-1 text-[0.9375rem] leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
