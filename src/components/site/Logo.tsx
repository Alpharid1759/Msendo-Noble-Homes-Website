// src/components/site/Logo.tsx
import clsx from "clsx";

export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const stroke = tone === "dark" ? "#13233a" : "#ffffff";
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={clsx("shrink-0", className)}>
      <path d="M4 18 L20 5 L36 18" fill="none" stroke="#c2a46d" strokeWidth="2.4" strokeLinecap="square" />
      <path d="M9 17 V35 H31 V17" fill="none" stroke={stroke} strokeWidth="2.4" />
      <path d="M15 35 V22 L25 30 V22" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinejoin="miter" />
    </svg>
  );
}

export function Logo({
  tone = "dark",
  logoUrl,
  className,
  compact = false,
}: {
  tone?: "dark" | "light";
  logoUrl?: string | null;
  className?: string;
  compact?: boolean;
}) {
  if (logoUrl) {
    return (
      <img src={logoUrl} alt="Msendo Noble Homes" className={clsx("h-10 w-auto", className)} height={40} />
    );
  }
  const primary = tone === "dark" ? "text-navy-800" : "text-white";
  const secondary = tone === "dark" ? "text-gold-ink" : "text-gold";
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" tone={tone} />
      <span className="flex flex-col leading-none">
        <span className={clsx("text-[1.05rem] font-extrabold tracking-[0.22em]", primary)}>MSENDO</span>
        {!compact && (
          <span className={clsx("mt-1 text-[0.62rem] font-semibold tracking-[0.34em]", secondary)}>NOBLE HOMES</span>
        )}
      </span>
      <span className="sr-only">Msendo Noble Homes</span>
    </span>
  );
}
