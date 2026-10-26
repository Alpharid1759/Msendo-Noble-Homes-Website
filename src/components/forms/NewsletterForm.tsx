// src/components/forms/NewsletterForm.tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions/public";
import { initialFormState } from "@/lib/form-state";
import { FormMessage, SpamGuard, SubmitButton } from "./FormBits";

export function NewsletterForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [state, action] = useActionState(subscribeNewsletter, initialFormState);
  const onDark = tone === "dark";

  if (state.status === "success") {
    return (
      <p role="status" className={onDark ? "text-navy-100" : "text-success"}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="relative space-y-3" noValidate>
      <SpamGuard />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          defaultValue={state.values?.email}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={state.fieldErrors?.email ? "newsletter-email-error" : undefined}
          className={
            onDark
              ? "min-h-12 w-full rounded-[var(--radius-control)] border border-white/20 bg-white/5 px-3 text-white placeholder:text-navy-200 focus:border-gold focus:outline-none"
              : "field-input"
          }
        />
        <SubmitButton pendingLabel="Subscribing" className={onDark ? "bg-gold text-navy-950 hover:bg-[#cdb27f]" : ""}>
          Subscribe
        </SubmitButton>
      </div>
      {state.fieldErrors?.email && (
        <p id="newsletter-email-error" className={onDark ? "text-sm text-[#f2b8b3]" : "field-error"} role="alert">
          {state.fieldErrors.email}
        </p>
      )}
      <label className={`flex items-start gap-2.5 text-xs leading-relaxed ${onDark ? "text-navy-200" : "text-slate"}`}>
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-gold" />
        <span>
          Send me occasional property insights and listing updates. I can unsubscribe at any time. See our{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </span>
      </label>
      {state.fieldErrors?.consent && (
        <p className={onDark ? "text-sm text-[#f2b8b3]" : "field-error"} role="alert">
          {state.fieldErrors.consent}
        </p>
      )}
      {state.status === "error" && !state.fieldErrors && <FormMessage state={state} />}
    </form>
  );
}
