// src/app/(site)/services/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { SERVICES } from "@/content/services";

export const metadata: Metadata = {
  title: "Real Estate Services in Abuja",
  description:
    "Property sales, rentals, land acquisition, property and facility management, investment consultancy, short-lets and listing services from Msendo Noble Homes.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        title="Our services"
        crumbs={[{ label: "Services" }]}
        intro={<p>One team for buying, renting, managing and investing in property across Abuja.</p>}
      />
      <div className="container-page py-14">
        <ul className="divide-y divide-line border-y border-line">
          {SERVICES.map((s) => (
            <li key={s.slug} className="grid gap-4 py-8 md:grid-cols-[3rem_1fr_auto] md:items-start md:gap-8">
              <CategoryIcon name={s.icon} className="h-7 w-7 text-gold-ink" />
              <div>
                <h2 className="text-xl font-semibold">
                  <Link href={`/services/${s.slug}`} className="hover:underline">
                    {s.name}
                  </Link>
                </h2>
                <p className="mt-2 max-w-2xl leading-relaxed text-slate">{s.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={`/services/${s.slug}`} variant="secondary" size="sm">
                  Learn more
                </ButtonLink>
                <ButtonLink href={s.cta.href} size="sm">
                  {s.cta.label}
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
