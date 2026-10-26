// src/components/site/Breadcrumbs.tsx
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { JsonLd } from "./JsonLd";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, tone = "dark" }: { items: Crumb[]; tone?: "dark" | "light" }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  const muted = tone === "dark" ? "text-slate hover:text-heading" : "text-navy-200 hover:text-white";
  const current = tone === "dark" ? "text-charcoal" : "text-white";
  return (
    <>
      <nav aria-label="Breadcrumb" className="no-print">
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
                {c.href && !last ? (
                  <Link href={c.href} className={muted}>
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined} className={last ? current : muted}>
                    {c.label}
                  </span>
                )}
                {!last && <ChevronRight className={`h-3.5 w-3.5 ${tone === "dark" ? "text-navy-200" : "text-gold"}`} aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: `${publicEnv.siteUrl}${c.href}` } : {}),
          })),
        }}
      />
    </>
  );
}
