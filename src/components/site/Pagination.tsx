// src/components/site/Pagination.tsx
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  if (pageCount <= 1) return null;
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push("gap");
    items.push(p);
  });
  const linkCls = "inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] px-3 text-sm font-semibold";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={clsx(linkCls, "text-navy-800 hover:bg-sand")} rel="prev">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Previous</span>
        </Link>
      ) : null}
      <ul className="flex items-center gap-1">
        {items.map((it, i) =>
          it === "gap" ? (
            <li key={`gap-${i}`} className="px-1 text-slate" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={it}>
              <Link
                href={hrefFor(it)}
                aria-current={it === page ? "page" : undefined}
                className={clsx(linkCls, it === page ? "bg-navy-800 text-white" : "text-navy-800 hover:bg-sand")}
              >
                <span className="sr-only">Page </span>
                {it}
              </Link>
            </li>
          ),
        )}
      </ul>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={clsx(linkCls, "text-navy-800 hover:bg-sand")} rel="next">
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
