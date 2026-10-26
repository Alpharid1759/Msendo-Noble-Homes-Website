// src/app/(site)/error.tsx
"use client";

import Link from "next/link";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-start justify-center py-20">
      <h1 className="display text-[2.25rem] text-heading">This page did not load</h1>
      <p className="mt-3 max-w-xl text-slate">
        Something went wrong on our side. Try again, and if the problem continues, call or WhatsApp us.
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-navy-800 px-5 font-semibold text-white">
          Try again
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-accent px-5 font-semibold text-accent">
          Go to home page
        </Link>
      </div>
    </div>
  );
}
