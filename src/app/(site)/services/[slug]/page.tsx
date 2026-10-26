// src/app/(site)/services/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { getService, SERVICES } from "@/content/services";
import { publicEnv } from "@/lib/env";
import type { enquiryCategoryValues } from "@/lib/validation/public-forms";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getService((await params).slug);
  if (!service) return {};
  return {
    title: `${service.name} in Abuja`,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

const CATEGORY_FOR: Record<string, (typeof enquiryCategoryValues)[number]> = {
  "property-sales": "buying",
  rentals: "renting",
  "land-and-documentation": "buying",
  "property-management": "property_management",
  "facility-management": "property_management",
  "investment-advisory": "investment",
  "development-and-project-marketing": "investment",
  "short-let": "short_let",
  "commercial-and-industrial": "general",
  "list-your-property": "general",
};

export default async function ServicePage({ params }: Props) {
  const service = getService((await params).slug);
  if (!service) notFound();
  const others = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.name,
            description: service.summary,
            areaServed: { "@type": "City", name: "Abuja" },
            provider: { "@type": "RealEstateAgent", name: "Msendo Noble Homes", url: publicEnv.siteUrl },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: service.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]}
      />
      <PageHeader title={service.name} crumbs={[{ label: "Services", href: "/services" }, { label: service.name }]} intro={<p>{service.summary}</p>}>
        <ButtonLink href={service.cta.href} variant="gold">
          {service.cta.label}
        </ButtonLink>
      </PageHeader>

      <div className="container-page grid gap-14 py-14 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-14">
          <section>
            <div className="space-y-4 text-[1.0625rem] leading-relaxed">
              {service.description.map((p) => (
                <p key={p.slice(0, 30)}>{p}</p>
              ))}
            </div>
          </section>

          <section aria-labelledby="benefits">
            <h2 id="benefits" className="display text-[2rem] text-navy-900">
              What you get
            </h2>
            <ul className="mt-5 space-y-3">
              {service.benefits.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="process">
            <h2 id="process" className="display text-[2rem] text-navy-900">
              How it works
            </h2>
            <ol className="mt-6 space-y-5">
              {service.process.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="faqs">
            <h2 id="faqs" className="display text-[2rem] text-navy-900">
              Questions
            </h2>
            <div className="mt-5 divide-y divide-line border-y border-line">
              {service.faqs.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {f.q}
                    <span className="text-xl text-gold-ink transition-transform group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-slate">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <div className="rounded-[var(--radius-card)] border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">Talk to us about {service.name.toLowerCase()}</h2>
            <div className="mt-5">
              <EnquiryForm defaultCategory={CATEGORY_FOR[service.slug] ?? "general"} showCategory={false} sourcePath={`/services/${service.slug}`} submitLabel="Get Property Assistance" />
            </div>
          </div>
          <nav aria-label="Other services">
            <h2 className="text-sm font-semibold text-slate">Other services</h2>
            <ul className="mt-3 space-y-2">
              {others.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="font-semibold text-navy-700 hover:underline">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}
