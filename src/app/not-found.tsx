// src/app/not-found.tsx
import Link from "next/link";
import { Logo } from "@/components/site/Logo";

export default function NotFound() {
  return (
    <div className="site-dark flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="container-page flex h-[4.5rem] items-center">
          <Link href="/" aria-label="Msendo Noble Homes home">
            <Logo tone="light" />
          </Link>
        </div>
      </header>
      <main className="container-page flex flex-1 flex-col items-start justify-center py-20">
        <p className="text-sm font-semibold text-gold-ink">Error 404</p>
        <h1 className="display mt-3 text-[2.5rem] text-heading md:text-[3.5rem]">We cannot find that page</h1>
        <p className="mt-4 max-w-xl text-lg text-slate">
          The link may be out of date, or the property may have been withdrawn. Try searching current listings.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/properties" className="inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-navy-800 px-6 font-semibold text-white hover:bg-navy-700">
            Explore properties
          </Link>
          <Link href="/contact" className="inline-flex min-h-12 items-center rounded-[var(--radius-control)] border border-accent px-6 font-semibold text-accent hover:bg-sand">
            Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
