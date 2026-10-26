// src/app/admin/(auth)/layout.tsx
import type { Metadata } from "next";
import { Logo } from "@/components/site/Logo";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-navy-900 px-4 py-12 on-dark">
      <div className="mb-8">
        <Logo tone="light" />
      </div>
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-white p-8 text-charcoal shadow-[var(--shadow-lift)]">{children}</div>
      <p className="mt-6 text-xs text-navy-200">Authorised staff only. Access is logged.</p>
    </div>
  );
}
