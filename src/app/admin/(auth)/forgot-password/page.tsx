// src/app/admin/(auth)/forgot-password/page.tsx
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/admin/AuthForms";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-navy-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate">We will email a link to set a new password.</p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/admin/login" className="font-semibold text-navy-700 underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
