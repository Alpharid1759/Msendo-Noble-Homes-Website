// src/components/forms/EnquiryForm.tsx
"use client";

import { useActionState } from "react";
import { submitEnquiry } from "@/app/actions/public";
import { ENQUIRY_CATEGORY_LABEL } from "@/lib/format";
import { initialFormState } from "@/lib/form-state";
import { enquiryCategoryValues } from "@/lib/validation/public-forms";
import { ConsentCheckbox, Field, FormMessage, inputProps, SpamGuard, SubmitButton } from "./FormBits";

export function EnquiryForm({
  propertyReference,
  defaultCategory = "general",
  defaultMessage,
  showCategory = true,
  showSubject = false,
  sourcePath,
  submitLabel = "Send enquiry",
}: {
  propertyReference?: string;
  defaultCategory?: (typeof enquiryCategoryValues)[number];
  defaultMessage?: string;
  showCategory?: boolean;
  showSubject?: boolean;
  sourcePath?: string;
  submitLabel?: string;
}) {
  const [state, action] = useActionState(submitEnquiry, initialFormState);
  const v = state.values ?? {};

  return (
    <form action={action} className="relative space-y-4" noValidate>
      <SpamGuard />
      {propertyReference && <input type="hidden" name="property_reference" value={propertyReference} />}
      {sourcePath && <input type="hidden" name="source_path" value={sourcePath} />}
      <FormMessage state={state} />

      <Field label="Full name" name="full_name" error={state.fieldErrors?.full_name} required>
        <input {...inputProps("full_name", state)} type="text" autoComplete="name" className="field-input" required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone or WhatsApp" name="phone" error={state.fieldErrors?.phone} hint="Phone or email is required">
          <input {...inputProps("phone", state, { hint: true })} type="tel" autoComplete="tel" inputMode="tel" className="field-input" />
        </Field>
        <Field label="Email" name="email" error={state.fieldErrors?.email}>
          <input {...inputProps("email", state)} type="email" autoComplete="email" className="field-input" />
        </Field>
      </div>

      {showCategory && (
        <Field label="What can we help with?" name="category" error={state.fieldErrors?.category} required>
          <select {...inputProps("category", state)} defaultValue={v.category ?? defaultCategory} className="field-input">
            {enquiryCategoryValues
              .filter((c) => c !== "property_enquiry" || propertyReference)
              .map((c) => (
                <option key={c} value={c}>
                  {ENQUIRY_CATEGORY_LABEL[c]}
                </option>
              ))}
          </select>
        </Field>
      )}
      {!showCategory && <input type="hidden" name="category" value={defaultCategory} />}

      {showSubject && (
        <Field label="Subject" name="subject" error={state.fieldErrors?.subject}>
          <input {...inputProps("subject", state)} type="text" maxLength={150} className="field-input" />
        </Field>
      )}

      <Field label="Message" name="message" error={state.fieldErrors?.message} required>
        <textarea {...inputProps("message", state)} defaultValue={v.message ?? defaultMessage} rows={5} maxLength={4000} className="field-input min-h-32" required />
      </Field>

      <fieldset>
        <legend className="field-label">
          How should we contact you? <span className="font-normal text-slate">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {[
            ["phone", "Phone call"],
            ["whatsapp", "WhatsApp"],
            ["email", "Email"],
          ].map(([value, label]) => (
            <label key={value} className="inline-flex min-h-10 items-center gap-2 text-sm">
              <input type="radio" name="preferred_contact" value={value} defaultChecked={v.preferred_contact === value} className="h-4 w-4 accent-gold" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <ConsentCheckbox state={state} purpose="respond to this enquiry" />

      <SubmitButton pendingLabel="Sending" className="w-full sm:w-auto">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
