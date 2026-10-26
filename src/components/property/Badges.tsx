// src/components/property/Badges.tsx
import clsx from "clsx";
import { STATUS_LABEL, TRANSACTION_LABEL } from "@/lib/format";
import type { PropertyStatus, TransactionType } from "@/types/domain";

const base = "inline-flex items-center rounded-[4px] px-2 py-0.5 text-xs font-semibold backdrop-blur-sm";

export function TransactionBadge({ type, className }: { type: TransactionType; className?: string }) {
  return (
    <span
      className={clsx(
        base,
        type === "sale" ? "bg-black/60 text-[#f0bd45] ring-1 ring-[#e6a20c]/50" : type === "rent" ? "bg-black/60 text-white ring-1 ring-white/30" : "bg-black/60 text-[#9fe0bd] ring-1 ring-[#9fe0bd]/40",
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
      ? "bg-[#f0bd45] text-[#0a0d0b]"
      : status === "sold" || status === "rented"
        ? "bg-[#015e36] text-white"
        : "bg-black/60 text-white";
  return <span className={clsx(base, tone, className)}>{STATUS_LABEL[status]}</span>;
}

export function FlagBadge({ children, tone = "gold", className }: { children: React.ReactNode; tone?: "gold" | "light" | "demo"; className?: string }) {
  return (
    <span
      className={clsx(
        base,
        tone === "gold" && "bg-gradient-to-b from-[#f0bd45] to-[#e6a20c] text-[#0a0d0b]",
        tone === "light" && "bg-white/90 text-[#015e36]",
        tone === "demo" && "bg-[#b3261e] text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}
