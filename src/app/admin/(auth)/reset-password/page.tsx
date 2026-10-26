// src/app/admin/(auth)/reset-password/page.tsx
import Link from "next/link";
import { ResetPasswordForm } from "@/components/admin/AuthForms";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return (
    <>
      <h1 className="text-2xl font-semibold text-navy-900">Set a new password</h1>
      <div className="mt-6">
        {data.user ? (
          <ResetPasswordForm />
        ) : (
          <p className="text-sm text-slate">
            This link has expired.{" "}
            <Link href="/admin/forgot-password" className="font-semibold text-navy-700 underline">
              Request a new reset link
            </Link>
            .
          </p>
        )}
      </div>
    </>
  );
}
