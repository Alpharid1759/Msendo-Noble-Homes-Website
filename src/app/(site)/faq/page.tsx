// src/app/(site)/faq/page.tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { FAQ_GROUPS } from "@/content/faq";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about buying, renting, inspections, listing a property and data privacy with Msendo Noble Homes.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_GROUPS.flatMap((g) => g.items).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <PageHeader title="Frequently asked questions" crumbs={[{ label: "FAQs" }]} />
      <div className="container-page max-w-4xl py-14">
        {FAQ_GROUPS.map((g) => (
          <section key={g.title} aria-labelledby={`faq-${g.title}`} className="mb-12">
            <h2 id={`faq-${g.title}`} className="display text-[2rem] text-heading">
              {g.title}
            </h2>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {g.items.map((f) => (
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
        ))}
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center">
          <h2 className="text-lg font-semibold">Still have a question?</h2>
          <div className="mt-4">
            <ButtonLink href="/contact">Speak to Our Team</ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
