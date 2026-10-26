// src/components/ui/Button.tsx
import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "gold" | "ghost" | "outline-light" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-navy-800 text-white hover:bg-navy-700 active:bg-navy-900",
  secondary: "border border-accent/70 text-accent bg-transparent hover:bg-accent/10",
  gold: "bg-gradient-to-b from-gold-light to-gold text-navy-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] hover:from-gold hover:to-[#c98c08]",
  ghost: "text-accent hover:bg-sand",
  "outline-light": "border border-white/40 text-white hover:bg-white/10",
  danger: "bg-danger text-white hover:bg-[#8a2a24]",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-5 text-[0.9375rem]",
  lg: "min-h-12 px-6 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({ variant, size, className, children, ...rest }: CommonProps & ComponentProps<"button">) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  children,
  href,
  external,
  ...rest
}: CommonProps & { href: string; external?: boolean } & Omit<ComponentProps<"a">, "href">) {
  const cls = buttonClasses(variant, size, className);
  if (external || /^(https?:|tel:|mailto:)/.test(href)) {
    const isWeb = /^https?:/.test(href);
    return (
      <a
        href={href}
        className={cls}
        {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
