// src/app/(site)/legal/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CookieSettingsButton } from "@/components/consent/Analytics";
import { PageHeader } from "@/components/site/PageHeader";
import { FOOTER_LINKS } from "@/components/site/nav-items";
import { legalDocs } from "@/content/legal";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ["privacy", "terms", "cookies", "listing-disclaimer", "accessibility"].map((slug) => ({ slug }));
}

async function getDoc(slug: string) {
  const s = await getSettings();
  const docs = legalDocs({
    legalName: s.company.legal_name,
    brand: s.company.brand_name,
    email: s.contact.email,
    dpEmail: s.privacy.data_protection_email || DEFAULT_SETTINGS.privacy.data_protection_email,
    address: `${s.contact.address_line}, ${s.contact.city}`,
    retentionMonths: s.privacy.enquiry_retention_months,
  });
  return docs.find((d) => d.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await getDoc((await params).slug);
  if (!doc) return {};
  return { title: doc.title, description: doc.description, alternates: { canonical: `/legal/${doc.slug}` } };
}

export default async function LegalPage({ params }: Props) {
  const doc = await getDoc((await params).slug);
  if (!doc) notFound();
  return (
    <>
      <PageHeader title={doc.title} crumbs={[{ label: "Legal" }, { label: doc.title }]} intro={<p>Last updated {doc.updated}.</p>} />
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="prose-article max-w-3xl">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </section>
          ))}
          {doc.slug === "cookies" && (
            <p>
              <CookieSettingsButton />
            </p>
          )}
        </div>
        <nav aria-label="Legal pages" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="space-y-2 text-sm">
            {FOOTER_LINKS.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={l.href.endsWith(doc.slug) ? "page" : undefined} className="font-semibold text-navy-700 hover:underline aria-[current=page]:text-charcoal">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
