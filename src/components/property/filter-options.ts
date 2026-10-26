// src/components/property/filter-options.ts
import { formatCompactMoney } from "@/lib/format";

const PRICE_POINTS = [
  250_000, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000,
  200_000_000, 500_000_000, 1_000_000_000, 2_000_000_000,
];

export const PRICE_OPTIONS = PRICE_POINTS.map((v) => ({ value: String(v), label: formatCompactMoney(v) ?? String(v) }));

export const ROOM_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n}+` }));

export const FURNISHING_OPTIONS = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "furnished", label: "Furnished" },
  { value: "serviced", label: "Serviced" },
];

export const TX_OPTIONS = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "short_let", label: "Short-let" },
];
