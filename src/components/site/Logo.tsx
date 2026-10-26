// src/components/site/Logo.tsx
import clsx from "clsx";

export function LogoMark({ className, tile = false }: { className?: string; tile?: boolean }) {
  if (tile) {
    return (
      <span className={clsx("inline-flex shrink-0 items-center justify-center rounded-[8px] bg-[#fffdf7] p-1.5 shadow-sm", className)}>
        <img src="/brand/mark.png" alt="" width={400} height={199} className="h-full w-auto" />
      </span>
    );
  }
  return <img src="/brand/mark.png" alt="" width={400} height={199} className={clsx("w-auto shrink-0", className)} />;
}

export function Logo({
  tone = "dark",
  logoUrl,
  className,
}: {
  tone?: "dark" | "light";
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return <img src={logoUrl} alt="Msendo Noble Homes" className={clsx("h-11 w-auto", className)} height={44} />;
  }
  const onDark = tone === "light";
  return (
    <span className={clsx("inline-flex items-center gap-3", className)}>
      <LogoMark tile={onDark} className={onDark ? "h-11 w-14" : "h-9"} />
      <span className="flex flex-col leading-none">
        <span className={clsx("font-serif text-[1.45rem] font-semibold tracking-[0.02em]", onDark ? "text-[#f6f1e6]" : "text-[#015e36]")}>Msendo</span>
        <span className={clsx("mt-1 text-[0.6rem] font-bold tracking-[0.32em]", onDark ? "text-gold-light" : "text-[#3b3b46]")}>NOBLE HOMES</span>
      </span>
      <span className="sr-only">Msendo Noble Homes</span>
    </span>
  );
}
