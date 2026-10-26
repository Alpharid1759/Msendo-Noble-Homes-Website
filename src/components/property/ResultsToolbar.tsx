// src/components/property/ResultsToolbar.tsx
"use client";

import clsx from "clsx";
import { LayoutGrid, List } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SORT_OPTIONS } from "@/lib/search-params";

export function ResultsToolbar({ total, sort, view, from, to }: { total: number; sort: string; view: "grid" | "list"; from: number; to: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "view") next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3" aria-busy={pending}>
      <p className="text-sm text-slate" aria-live="polite">
        {total === 0 ? (
          "No properties match these filters"
        ) : (
          <>
            Showing <strong className="text-charcoal">{from}–{to}</strong> of <strong className="text-charcoal">{total}</strong>{" "}
            {total === 1 ? "property" : "properties"}
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="sr-only">
          Sort by
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => update("sort", e.target.value === "newest" ? null : e.target.value)}
          className="h-10 rounded-[var(--radius-control)] border border-line bg-white px-3 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="hidden rounded-[var(--radius-control)] border border-line bg-white p-0.5 sm:flex" role="group" aria-label="Display mode">
          {(["grid", "list"] as const).map((v) => {
            const Icon = v === "grid" ? LayoutGrid : List;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => update("view", v === "grid" ? null : v)}
                className={clsx("inline-flex h-9 w-9 items-center justify-center rounded-[3px]", view === v ? "bg-navy-800 text-white" : "text-slate hover:bg-sand")}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{v === "grid" ? "Grid view" : "List view"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
