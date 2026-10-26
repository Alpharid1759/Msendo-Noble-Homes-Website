// src/components/property/Price.tsx
import clsx from "clsx";
import { formatPrice } from "@/lib/format";
import type { BillingFrequency } from "@/types/domain";

export function Price({
  price,
  price_on_request,
  currency,
  billing_frequency,
  className,
  size = "md",
}: {
  price: number | null;
  price_on_request: boolean;
  currency: string;
  billing_frequency: BillingFrequency;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const p = formatPrice({ price, price_on_request, currency, billing_frequency });
  return (
    <p className={clsx("text-navy-900", className)}>
      <span
        className={clsx(
          "font-bold tabular-nums",
          size === "lg" && "text-3xl md:text-[2.25rem]",
          size === "md" && "text-xl",
          size === "sm" && "text-base",
        )}
      >
        {p.amount}
      </span>
      {p.suffix && <span className="ml-1.5 text-sm font-medium text-slate">{p.suffix}</span>}
    </p>
  );
}
