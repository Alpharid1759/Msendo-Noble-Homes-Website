// src/components/forms/FormBits.tsx
"use client";

import clsx from "clsx";
import Link from "next/link";
import Script from "next/script";
import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { publicEnv } from "@/lib/env";
import type { FormState } from "@/lib/form-state";

export function SpamGuard() {
  const [startedAt] = useState(() => Date.now());
  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company website
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name="form_started_at" value={startedAt} />
      {publicEnv.turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={publicEnv.turnstileSiteKey} data-theme="light" />
        </>
      )}
    </>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="field-label">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="font-normal text-slate"> (optional)</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function inputProps(name: string, state: FormState, opts: { hint?: boolean } = {}) {
  const error = state.fieldErrors?.[name];
  const describedBy = [error ? `${name}-error` : null, opts.hint && !error ? `${name}-hint` : null].filter(Boolean).join(" ");
  return {
    id: name,
    name,
    defaultValue: state.values?.[name],
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy || undefined,
  };
}

export function ConsentCheckbox({ state, purpose }: { state: FormState; purpose: string }) {
  const error = state.fieldErrors?.consent;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-charcoal">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-4 w-4 shrink-0 accent-gold"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "consent-error" : undefined}
        />
        <span>
          I agree that Msendo Noble Homes may use these details to {purpose}, as described in the{" "}
          <Link href="/legal/privacy" className="font-semibold text-accent underline underline-offset-2">
            privacy policy
          </Link>
          .
        </span>
      </label>
      {error && (
        <p id="consent-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel, className }: { children: ReactNode; pendingLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={clsx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-navy-800 px-6 font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-70",
        className,
      )}
    >
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <div
      role={state.status === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-[var(--radius-control)] border px-4 py-3 text-sm",
        state.status === "error" ? "border-danger/30 bg-danger/10 text-danger" : "border-success/30 bg-success/10 text-success",
      )}
    >
      {state.message}
    </div>
  );
}
