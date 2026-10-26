// src/components/admin/AuthForms.tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, updatePassword, verifyMfa } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/forms/FormBits";
import { initialFormState } from "@/lib/form-state";

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, action] = useActionState(signIn, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {linkError && state.status === "idle" && (
        <p role="alert" className="rounded-[var(--radius-control)] bg-danger/10 px-4 py-3 text-sm text-danger">
          That link has expired or was already used. Request a new one.
        </p>
      )}
      <FormMessage state={state} />
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.values?.email} className="field-input" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field-input" />
      </div>
      <SubmitButton pendingLabel="Signing in" className="w-full">
        Sign in
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/admin/forgot-password" className="font-semibold text-navy-700 underline underline-offset-2">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label htmlFor="email" className="field-label">
          Staff email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} className="field-input" />
      </div>
      <SubmitButton pendingLabel="Sending" className="w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);
  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <FormMessage state={state} />
        <Link href="/admin" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-navy-800 font-semibold text-white">
          Go to the dashboard
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label htmlFor="password" className="field-label">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby="password-hint"
          className="field-input"
        />
        <p id="password-hint" className={state.fieldErrors?.password ? "field-error" : "field-hint"}>
          {state.fieldErrors?.password ?? "At least 12 characters, with upper and lower case letters and a number."}
        </p>
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">
          Confirm new password
        </label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field-input" aria-invalid={state.fieldErrors?.confirm ? true : undefined} />
        {state.fieldErrors?.confirm && <p className="field-error">{state.fieldErrors.confirm}</p>}
      </div>
      <SubmitButton pendingLabel="Saving" className="w-full">
        Save new password
      </SubmitButton>
    </form>
  );
}

export function MfaForm({ next }: { next: string }) {
  const [state, action] = useActionState(verifyMfa, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <div>
        <label htmlFor="code" className="field-label">
          6-digit code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          aria-invalid={state.fieldErrors?.code ? true : undefined}
          className="field-input text-center text-2xl tracking-[0.5em]"
        />
        {state.fieldErrors?.code && <p className="field-error">{state.fieldErrors.code}</p>}
      </div>
      <SubmitButton pendingLabel="Verifying" className="w-full">
        Verify
      </SubmitButton>
    </form>
  );
}
