// src/components/forms/InspectionForm.tsx
"use client";

import { useActionState, useMemo, useState } from "react";
import { requestInspection } from "@/app/actions/public";
import { initialFormState } from "@/lib/form-state";
import { describeHours, lagosParts, timeOptions } from "@/lib/inspection-rules";
import type { SiteSettings } from "@/types/domain";
import { ConsentCheckbox, Field, FormMessage, inputProps, SpamGuard, SubmitButton } from "./FormBits";

export function InspectionForm({
  propertyReference,
  rules,
  allowReferenceEdit = false,
}: {
  propertyReference?: string;
  rules: SiteSettings["inspections"];
  allowReferenceEdit?: boolean;
}) {
  const [state, action] = useActionState(requestInspection, initialFormState);
  const v0 = state.values ?? {};
  const [date, setDate] = useState(v0.preferred_date ?? "");
  const [altDate, setAltDate] = useState(v0.alternative_date ?? "");
  const times = useMemo(() => timeOptions(rules, date || undefined), [rules, date]);
  const altTimes = useMemo(() => timeOptions(rules, altDate || undefined), [rules, altDate]);
  const [now] = useState(() => Date.now());
  const minDate = lagosParts(new Date(now + rules.min_notice_hours * 3_600_000)).date;
  const maxDate = lagosParts(new Date(now + rules.max_days_ahead * 86_400_000)).date;
  const v = state.values ?? {};

  return (
    <form action={action} className="relative space-y-4" noValidate>
      <SpamGuard />
      <FormMessage state={state} />

      {allowReferenceEdit || !propertyReference ? (
        <Field label="Property reference" name="property_reference" error={state.fieldErrors?.property_reference} hint="Shown on every listing, for example MNH-R-01002" required>
          <input
            {...inputProps("property_reference", state, { hint: true })}
            defaultValue={v.property_reference ?? propertyReference}
            type="text"
            autoCapitalize="characters"
            className="field-input uppercase"
            required
          />
        </Field>
      ) : (
        <input type="hidden" name="property_reference" value={propertyReference} />
      )}

      <Field label="Full name" name="full_name" error={state.fieldErrors?.full_name} required>
        <input {...inputProps("full_name", state)} type="text" autoComplete="name" className="field-input" required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone or WhatsApp" name="phone" error={state.fieldErrors?.phone} required>
          <input {...inputProps("phone", state)} type="tel" autoComplete="tel" inputMode="tel" className="field-input" required />
        </Field>
        <Field label="Email" name="email" error={state.fieldErrors?.email} hint="For written confirmation">
          <input {...inputProps("email", state, { hint: true })} type="email" autoComplete="email" className="field-input" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Preferred date" name="preferred_date" error={state.fieldErrors?.preferred_date} required>
          <input {...inputProps("preferred_date", state)} type="date" min={minDate} max={maxDate} className="field-input" required onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Preferred time" name="preferred_time" error={state.fieldErrors?.preferred_time} required>
          <select {...inputProps("preferred_time", state)} defaultValue={v.preferred_time ?? ""} className="field-input" required>
            <option value="" disabled>
              {date && times.length === 0 ? "Closed on this day" : "Choose a time"}
            </option>
            {times.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Alternative date" name="alternative_date" error={state.fieldErrors?.alternative_date}>
          <input {...inputProps("alternative_date", state)} type="date" min={minDate} max={maxDate} className="field-input" onChange={(e) => setAltDate(e.target.value)} />
        </Field>
        <Field label="Alternative time" name="alternative_time" error={state.fieldErrors?.alternative_time}>
          <select {...inputProps("alternative_time", state)} defaultValue={v.alternative_time ?? ""} className="field-input">
            <option value="">No preference</option>
            {altTimes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Number of people attending" name="attendees" error={state.fieldErrors?.attendees}>
        <input {...inputProps("attendees", state)} defaultValue={v.attendees ?? "1"} type="number" min={1} max={20} inputMode="numeric" className="field-input max-w-32" />
      </Field>

      <Field label="Anything we should know?" name="notes" error={state.fieldErrors?.notes}>
        <textarea {...inputProps("notes", state)} rows={3} maxLength={1500} className="field-input" />
      </Field>

      <p className="text-sm leading-relaxed text-slate">
        Inspection hours (Abuja time): {describeHours(rules)}. This is a request: we will call to confirm before you travel.
      </p>

      <ConsentCheckbox state={state} purpose="arrange this inspection" />

      <SubmitButton pendingLabel="Sending request" className="w-full sm:w-auto">
        Request inspection
      </SubmitButton>
    </form>
  );
}
