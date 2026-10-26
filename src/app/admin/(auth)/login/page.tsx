// src/app/admin/(auth)/login/page.tsx
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/AuthForms";
import { isSupabaseConfigured } from "@/lib/env";
import { getStaffContext } from "@/lib/auth/staff";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextRaw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = nextRaw && nextRaw.startsWith("/admin") && !nextRaw.startsWith("//") ? nextRaw : "/admin";
  if (isSupabaseConfigured() && (await getStaffContext())) redirect(next);
  return (
    <>
      <h1 className="text-2xl font-semibold text-navy-900">Staff sign in</h1>
      <p className="mt-1 text-sm text-slate">Manage listings, enquiries, inspections and articles.</p>
      <div className="mt-6">
        {isSupabaseConfigured() ? (
          <LoginForm next={next} linkError={sp.error === "link"} />
        ) : (
          <p role="alert" className="rounded-[var(--radius-control)] bg-warning/10 px-4 py-3 text-sm text-warning">
            Supabase is not configured. Add the environment variables described in docs/DEPLOYMENT.md, then restart the app.
          </p>
        )}
      </div>
    </>
  );
}
