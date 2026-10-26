// src/app/admin/(auth)/mfa/page.tsx
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { MfaForm } from "@/components/admin/AuthForms";
import { createServerSupabase } from "@/lib/supabase/server";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MfaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextRaw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = nextRaw && nextRaw.startsWith("/admin") && !nextRaw.startsWith("//") ? nextRaw : "/admin";
  const supabase = await createServerSupabase();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/admin/login");
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel !== "aal2" || aal.currentLevel === "aal2") redirect(next);
  return (
    <>
      <h1 className="text-2xl font-semibold text-navy-900">Two-step verification</h1>
      <p className="mt-1 text-sm text-slate">Open your authenticator app and enter the current code for Msendo Noble Homes.</p>
      <div className="mt-6">
        <MfaForm next={next} />
      </div>
      <form action={signOut} className="mt-6 text-center">
        <button type="submit" className="text-sm font-semibold text-navy-700 underline underline-offset-2">
          Sign in as someone else
        </button>
      </form>
    </>
  );
}
