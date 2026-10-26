// src/components/admin/ui.tsx
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={clsx("rounded-[var(--radius-card)] border border-line bg-white", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          {title && <h2 className="text-[0.9375rem] font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, href, hint }: { label: string; value: number | string; href?: string; hint?: string }) {
  const inner = (
    <>
      <p className="text-sm text-slate">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-navy-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-[var(--radius-card)] border border-line bg-white p-5 hover:border-navy-700">
      {inner}
    </Link>
  ) : (
    <div className="rounded-[var(--radius-card)] border border-line bg-white p-5">{inner}</div>
  );
}

const PILL_TONES: Record<string, string> = {
  neutral: "bg-sand text-slate",
  info: "bg-navy-100 text-navy-800",
  success: "bg-[#e5f2eb] text-success",
  warning: "bg-[#fff1d6] text-warning",
  danger: "bg-[#fbe7e5] text-danger",
  dark: "bg-navy-800 text-white",
};

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof PILL_TONES }) {
  return <span className={clsx("inline-flex items-center whitespace-nowrap rounded-[3px] px-2 py-0.5 text-xs font-semibold", PILL_TONES[tone])}>{children}</span>;
}

export function statusTone(status: string): keyof typeof PILL_TONES {
  switch (status) {
    case "published":
    case "confirmed":
    case "converted":
    case "completed":
    case "ready":
    case "subscribed":
      return "success";
    case "pending_review":
    case "requested":
    case "new":
    case "scheduled":
    case "processing":
    case "rescheduled":
      return "warning";
    case "reserved":
    case "contacted":
    case "inspection_scheduled":
    case "in_progress":
      return "info";
    case "sold":
    case "rented":
      return "dark";
    case "cancelled":
    case "failed":
    case "spam":
    case "no_show":
      return "danger";
    default:
      return "neutral";
  }
}

export function Table({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th scope="col" className={clsx("border-b border-line bg-sand/60 px-4 py-2.5 font-semibold text-slate", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={clsx("border-b border-line px-4 py-3 align-top", className)}>{children}</td>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-navy-200 bg-white p-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-slate">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "danger"; children: ReactNode }) {
  const cls = {
    info: "border-navy-200 bg-navy-100 text-navy-900",
    success: "border-success/30 bg-[#e9f4ee] text-success",
    warning: "border-warning/30 bg-[#fff6e5] text-warning",
    danger: "border-danger/30 bg-[#fbeeed] text-danger",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={clsx("rounded-[var(--radius-control)] border px-4 py-3 text-sm", cls)}>
      {children}
    </div>
  );
}

export const adminInput = "field-input";
export const adminBtn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-sm font-semibold transition-colors disabled:opacity-60";
export const adminBtnPrimary = `${adminBtn} bg-navy-800 text-white hover:bg-navy-700`;
export const adminBtnSecondary = `${adminBtn} border border-navy-800 bg-white text-navy-800 hover:bg-navy-100`;
export const adminBtnGhost = `${adminBtn} text-navy-800 hover:bg-sand`;
export const adminBtnDanger = `${adminBtn} border border-danger/40 bg-white text-danger hover:bg-[#fbeeed]`;
