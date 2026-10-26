// src/components/forms/UnsubscribeForm.tsx
"use client";

import { useActionState } from "react";
import { unsubscribeNewsletter } from "@/app/actions/public";
import { initialFormState } from "@/lib/form-state";
import { FormMessage, SubmitButton } from "./FormBits";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action] = useActionState(unsubscribeNewsletter, initialFormState);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Unsubscribing">Unsubscribe</SubmitButton>
    </form>
  );
}
