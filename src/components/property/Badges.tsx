// src/components/property/Badges.tsx
import clsx from "clsx";
import { STATUS_LABEL, TRANSACTION_LABEL } from "@/lib/format";
import type { PropertyStatus, TransactionType } from "@/types/domain";

const base = "inline-flex items-center rounded-[3px] px-2 py-0.5 text-xs font-semibold";

export function TransactionBadge({ type, className }: { type: TransactionType; className?: string }) {
  return (
    <span
      className={clsx(
        base,
        type === "sale" ? "bg-navy-800 text-white" : type === "rent" ? "bg-white text-navy-800 ring-1 ring-navy-800/20" : "bg-gold-soft text-navy-900",
        className,
      )}
    >
      {TRANSACTION_LABEL[type]}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  if (status === "published") return null;
  const tone =
    status === "reserved"
      ? "bg-[#fff4dc] text-warning"
      : status === "sold" || status === "rented"
        ? "bg-navy-900 text-white"
        : "bg-sand text-slate";
  return <span className={clsx(base, tone, className)}>{STATUS_LABEL[status]}</span>;
}

export function FlagBadge({ children, tone = "gold", className }: { children: React.ReactNode; tone?: "gold" | "light" | "demo"; className?: string }) {
  return (
    <span
      className={clsx(
        base,
        tone === "gold" && "bg-gold text-navy-900",
        tone === "light" && "bg-white/95 text-navy-800",
        tone === "demo" && "bg-[#fde8e6] text-danger",
        className,
      )}
    >
      {children}
    </span>
  );
}
