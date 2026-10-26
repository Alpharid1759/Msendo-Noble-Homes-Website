// src/components/gallery/GalleryNav.tsx
import clsx from "clsx";
import Link from "next/link";

const TABS = [
  { href: "/gallery/photos/for-sale", label: "Photos: for sale", kind: "photos", tx: "for-sale" },
  { href: "/gallery/photos/for-rent", label: "Photos: for rent", kind: "photos", tx: "for-rent" },
  { href: "/gallery/videos/for-sale", label: "Videos: for sale", kind: "videos", tx: "for-sale" },
  { href: "/gallery/videos/for-rent", label: "Videos: for rent", kind: "videos", tx: "for-rent" },
] as const;

export function GalleryNav({ kind, tx }: { kind: "photos" | "videos"; tx: "for-sale" | "for-rent" }) {
  return (
    <nav aria-label="Galleries" className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max gap-1 px-1">
        {TABS.map((t) => {
          const active = t.kind === kind && t.tx === tx;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "inline-flex min-h-10 items-center rounded-[var(--radius-control)] px-4 text-sm font-semibold",
                  active ? "bg-gold text-navy-950" : "border border-white/25 text-white hover:bg-white/10",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
