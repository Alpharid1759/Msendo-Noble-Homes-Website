// src/components/site/PageHeader.tsx
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

export function PageHeader({
  title,
  intro,
  crumbs,
  children,
}: {
  title: string;
  intro?: ReactNode;
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-navy-900 text-white">
      <BlueprintLines className="pointer-events-none absolute -right-24 top-0 h-full w-[44rem] opacity-[0.12]" />
      <div className="container-page relative py-12 md:py-16">
        <Breadcrumbs items={crumbs} tone="light" />
        <h1 className="display mt-5 max-w-3xl text-[2.25rem] md:text-[3.25rem]">{title}</h1>
        {intro && <div className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-navy-100">{intro}</div>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function BlueprintLines({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 700 400" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" className={className}>
      <g fill="none" stroke="#c2a46d" strokeWidth="1">
        <path d="M60 380 V180 L200 90 L340 180 V380" />
        <path d="M100 380 V230 H160 V380 M240 230 H300 V300 H240 Z M110 190 H290" />
        <path d="M340 380 V140 H520 V380 M370 170 H400 V200 H370 Z M430 170 H460 V200 H430 Z M490 170 H505 V200 H490 Z M370 230 H400 V260 H370 Z M430 230 H460 V260 H430 Z M370 290 H400 V320 H370 Z M430 290 H460 V320 H430 Z" />
        <path d="M520 380 V240 L600 200 L680 240 V380 M560 380 V300 H600 V380" />
        <path d="M20 380 H700" />
        <path d="M60 395 H340 M60 390 V400 M340 390 V400" strokeDasharray="3 4" />
      </g>
    </svg>
  );
}
