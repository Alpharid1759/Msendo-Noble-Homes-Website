// src/components/admin/AdminNav.tsx
"use client";

import clsx from "clsx";
import {
  CalendarCheck,
  FileText,
  History,
  Home,
  Inbox,
  LayoutDashboard,
  Mail,
  Menu,
  Settings,
  Tags,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

const ICONS = {
  dashboard: LayoutDashboard,
  properties: Home,
  enquiries: Inbox,
  inspections: CalendarCheck,
  blog: FileText,
  newsletter: Mail,
  taxonomy: Tags,
  staff: Users,
  settings: Settings,
  audit: History,
  account: UserRound,
};

function NavList({ items, onNavigate }: { items: AdminNavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex min-h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium",
                active ? "bg-white/10 text-white" : "text-navy-200 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={clsx("h-4 w-4", active ? "text-gold" : "")} aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? <span className="rounded-full bg-gold px-1.5 text-xs font-semibold text-navy-900">{item.badge}</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebar({ items }: { items: AdminNavItem[] }) {
  return (
    <nav aria-label="Admin" className="px-3 py-4">
      <NavList items={items} />
    </nav>
  );
}

export function AdminMobileNav({ items }: { items: AdminNavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-expanded={open} className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-navy-800 hover:bg-sand">
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Open admin menu</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" tabIndex={-1} aria-label="Close menu" className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} />
          <div className="on-dark absolute inset-y-0 left-0 w-72 overflow-y-auto bg-navy-900">
            <div className="flex items-center justify-end p-3">
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-white hover:bg-white/10">
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <nav aria-label="Admin" className="px-3 pb-6">
              <NavList items={items} onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
