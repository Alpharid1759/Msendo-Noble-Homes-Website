// src/app/(site)/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { ABOUT } from "@/content/about";
import { SERVICES } from "@/content/services";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Msendo Noble Homes is the real estate division of Msendo Integrated Limited, based in Jabi, Abuja. Sales, rentals, land, property management and investment advisory.",
  alternates: { canonical: "/about" },
};

function DraftNote({ approved }: { approved: boolean }) {
  if (approved) return null;
  return <p className="mt-2 text-xs font-medium text-warning">Draft wording awaiting management approval.</p>;
}

export default async function AboutPage() {
  const settings = await getSettings();
  const { company, contact } = settings;

  return (
    <>
      <PageHeader
        title={`About ${company.brand_name}`}
        crumbs={[{ label: "About us" }]}
        intro={
          <p>
            {company.brand_name} is the real estate division of {company.legal_name}, a Nigerian multi-sector enterprise. We
            work from {contact.address_line}, {contact.city}.
          </p>
        }
      />

      <section className="container-page grid gap-12 py-16 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="display text-[2.25rem] text-navy-900">Who we are</h2>
          <div className="mt-4 space-y-4 text-[1.0625rem] leading-relaxed">
            <p>
              We help buyers, tenants, investors, landlords, developers and corporate clients find, let, manage and invest in
              property across Abuja. Our work covers homes, land, offices, retail, warehouses, short-let apartments and
              development projects.
            </p>
            <p>
              As part of {company.legal_name}, we bring the accountability of an established company to a market where
              buyers and tenants often struggle to get straight answers. Our tagline sets the standard: {company.tagline}
            </p>
          </div>
        </div>
        <div className="space-y-8">
          <div className="rounded-[var(--radius-card)] border border-line bg-white p-6">
            <h2 className="text-sm font-semibold text-gold-ink">Our mission</h2>
            <p className="display mt-2 text-[1.5rem] leading-snug text-navy-900">{ABOUT.mission.value}</p>
            <DraftNote approved={ABOUT.mission.approved} />
          </div>
          <div className="rounded-[var(--radius-card)] border border-line bg-white p-6">
            <h2 className="text-sm font-semibold text-gold-ink">Our vision</h2>
            <p className="display mt-2 text-[1.5rem] leading-snug text-navy-900">{ABOUT.vision.value}</p>
            <DraftNote approved={ABOUT.vision.approved} />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white py-16">
        <div className="container-page">
          <h2 className="display text-[2.25rem] text-navy-900">What we value</h2>
          <DraftNote approved={ABOUT.values.approved} />
          <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT.values.value.map((v) => (
              <div key={v.name} className="border-t-2 border-gold pt-4">
                <dt className="font-semibold">{v.name}</dt>
                <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-slate">{v.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="display text-[2.25rem] text-navy-900">What we cover</h2>
        <p className="mt-2 max-w-2xl text-slate">
          Our primary market is Abuja and the Federal Capital Territory. We plan to extend our services to other Nigerian
          cities as the business grows.
        </p>
        <ul className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <li key={s.slug} className="flex gap-3">
              <CategoryIcon name={s.icon} className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" />
              <Link href={`/services/${s.slug}`} className="font-semibold hover:underline">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-navy-900 py-16 text-white on-dark">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="display text-[2.25rem]">How we handle transactions</h2>
            <p className="mt-3 text-navy-100">
              Our website and our team work to the same rules, so you see the facts before you are asked to decide.
            </p>
          </div>
          <ul className="space-y-4 text-navy-100">
            <li>Every listing separates the price from deposits, agency, legal and service charges.</li>
            <li>Title documents are labelled as verified only after our review, and we encourage independent legal checks.</li>
            <li>Inspection requests are confirmed by a member of staff before the visit.</li>
          </ul>
        </div>
      </section>

      {ABOUT.leadership.value.length > 0 && (
        <section className="container-page py-16">
          <h2 className="display text-[2.25rem] text-navy-900">Leadership</h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {ABOUT.leadership.value.map((p) => (
              <li key={p.name}>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-gold-ink">{p.role}</p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate">{p.bio}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ABOUT.milestones.value.length > 0 && (
        <section className="container-page py-16">
          <h2 className="display text-[2.25rem] text-navy-900">Milestones</h2>
          <ol className="mt-8 space-y-4">
            {ABOUT.milestones.value.map((m) => (
              <li key={m.year} className="flex gap-6">
                <span className="w-16 shrink-0 font-semibold text-gold-ink">{m.year}</span>
                <span>{m.text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="container-page py-16">
        <div className="flex flex-col items-start gap-6 rounded-[var(--radius-card)] border border-line bg-white p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="display text-[2rem] text-navy-900">Visit us in Jabi</h2>
            <p className="mt-2 text-slate">
              {contact.address_line}, {contact.city}. Call {contact.phone_display} before you come so the right person is
              available.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/contact">Contact us</ButtonLink>
            <ButtonLink href="/properties" variant="secondary">
              Explore properties
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
