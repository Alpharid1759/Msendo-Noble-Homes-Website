// src/components/site/Nav.tsx
"use client";

import clsx from "clsx";
import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { telUrl } from "@/lib/contact-links";
import { NAV_ITEMS } from "./nav-items";

function isActive(pathname: string, item: (typeof NAV_ITEMS)[number]) {
  const target = "match" in item ? item.match : item.href;
  if (target === "/") return pathname === "/";
  if (item.href === "/properties") {
    return pathname === "/properties" || (pathname.startsWith("/properties/") && !pathname.startsWith("/properties/for-"));
  }
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden xl:block">
      <ul className="flex items-center gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative block rounded-sm px-2.5 py-2 text-[0.875rem] font-medium transition-colors",
                  active ? "text-navy-900" : "text-slate hover:text-navy-900",
                )}
              >
                {item.label}
                {active && <span className="absolute inset-x-2.5 -bottom-[0.9rem] h-0.5 bg-gold" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav({ phone, phoneDisplay }: { phone: string; phoneDisplay: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trigger = triggerRef.current;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>("a, button");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-navy-800 hover:bg-sand"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">Open menu</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/50"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-nav"
            ref={panelRef}
            className="on-dark absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-navy-900 text-white shadow-2xl"
          >
            <div className="flex h-[4.5rem] items-center justify-between border-b border-white/10 px-5">
              <span className="text-sm font-semibold text-navy-200">Menu</span>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <X className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={clsx(
                          "flex min-h-12 items-center rounded-sm px-3 text-[1.0625rem]",
                          active ? "bg-white/10 font-semibold text-white" : "text-navy-100 hover:bg-white/5",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="space-y-3 border-t border-white/10 p-5">
              <Link
                href="/list-your-property"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-gold font-semibold text-navy-900"
              >
                List Your Property
              </Link>
              <a
                href={telUrl(phone)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white/30 font-semibold"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
