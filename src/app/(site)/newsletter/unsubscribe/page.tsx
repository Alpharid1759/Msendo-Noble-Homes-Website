// src/app/(site)/newsletter/unsubscribe/page.tsx
import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/forms/UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = (Array.isArray(sp.token) ? sp.token[0] : sp.token) ?? "";
  return (
    <div className="container-page flex min-h-[50vh] max-w-xl flex-col justify-center py-20">
      <h1 className="display text-[2.25rem] text-heading">Unsubscribe from our newsletter</h1>
      <p className="mt-3 text-slate">Press the button to stop receiving property updates by email.</p>
      <div className="mt-6">
        <UnsubscribeForm token={token} />
      </div>
    </div>
  );
}
