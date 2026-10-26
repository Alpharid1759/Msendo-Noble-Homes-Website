// src/components/admin/MfaSetup.tsx
"use client";

import { useActionState, useState, useTransition } from "react";
import { confirmMfaEnrollment, startMfaEnrollment } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/forms/FormBits";
import { initialFormState } from "@/lib/form-state";
import { adminBtnPrimary } from "./ui";

export function MfaSetup() {
  const [enrollment, setEnrollment] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [state, action] = useActionState(confirmMfaEnrollment, initialFormState);

  if (state.status === "success") return <FormMessage state={state} />;

  if (!enrollment) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate">Use an authenticator app such as Google Authenticator, Microsoft Authenticator or 1Password.</p>
        {error && <p className="field-error">{error}</p>}
        <button
          type="button"
          className={adminBtnPrimary}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await startMfaEnrollment();
              if ("error" in r) setError(r.error);
              else setEnrollment(r);
            })
          }
        >
          Set up two-step verification
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="factorId" value={enrollment.factorId} />
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>Scan this code with your authenticator app.</li>
        <li>Enter the 6-digit code the app shows.</li>
      </ol>
      <img src={enrollment.qr} alt="QR code for your authenticator app" className="h-44 w-44 rounded-[3px] border border-line bg-white p-2" />
      <p className="text-xs text-slate">
        Cannot scan? Enter this key manually: <code className="break-all rounded bg-sand px-1">{enrollment.secret}</code>
      </p>
      <FormMessage state={state} />
      <div>
        <label htmlFor="code" className="field-label">
          6-digit code
        </label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="field-input w-40 text-center tracking-[0.3em]" />
        {state.fieldErrors?.code && <p className="field-error">{state.fieldErrors.code}</p>}
      </div>
      <SubmitButton pendingLabel="Verifying" className="min-h-10">
        Turn on
      </SubmitButton>
    </form>
  );
}
