// src/components/forms/ListPropertyForm.tsx
"use client";

import { useActionState } from "react";
import { submitListing } from "@/app/actions/public";
import { initialFormState } from "@/lib/form-state";
import { ConsentCheckbox, Field, FormMessage, inputProps, SpamGuard, SubmitButton } from "./FormBits";

export function ListPropertyForm() {
  const [state, action] = useActionState(submitListing, initialFormState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="relative space-y-8" noValidate>
      <SpamGuard />
      <FormMessage state={state} />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">About you</legend>
        <Field label="Full name" name="full_name" error={e.full_name} required>
          <input {...inputProps("full_name", state)} type="text" autoComplete="name" className="field-input" required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone or WhatsApp" name="phone" error={e.phone} required>
            <input {...inputProps("phone", state)} type="tel" autoComplete="tel" inputMode="tel" className="field-input" required />
          </Field>
          <Field label="Email" name="email" error={e.email}>
            <input {...inputProps("email", state)} type="email" autoComplete="email" className="field-input" />
          </Field>
        </div>
        <Field label="Your relationship to the property" name="relationship" error={e.relationship} required>
          <select {...inputProps("relationship", state)} defaultValue={v.relationship ?? ""} className="field-input" required>
            <option value="" disabled>
              Choose one
            </option>
            <option value="owner">Owner</option>
            <option value="landlord">Landlord</option>
            <option value="developer">Developer</option>
            <option value="agent">Agent with the owner&apos;s authority</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">About the property</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="I want to" name="transaction_type" error={e.transaction_type} required>
            <select {...inputProps("transaction_type", state)} defaultValue={v.transaction_type ?? ""} className="field-input" required>
              <option value="" disabled>
                Choose one
              </option>
              <option value="sale">Sell</option>
              <option value="rent">Rent it out</option>
              <option value="short_let">Offer as a short-let</option>
              <option value="lease">Lease (land or commercial)</option>
            </select>
          </Field>
          <Field label="Property type" name="property_type" error={e.property_type} hint="For example 4-bedroom duplex, 600 m² plot, office floor" required>
            <input {...inputProps("property_type", state, { hint: true })} type="text" maxLength={80} className="field-input" required />
          </Field>
        </div>
        <Field label="Location" name="location" error={e.location} hint="District, estate or street" required>
          <input {...inputProps("location", state, { hint: true })} type="text" maxLength={200} className="field-input" required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bedrooms" name="bedrooms" error={e.bedrooms}>
            <input {...inputProps("bedrooms", state)} type="number" min={0} max={50} inputMode="numeric" className="field-input" />
          </Field>
          <Field label="Asking price or rent" name="asking_price" error={e.asking_price} className="sm:col-span-2">
            <input {...inputProps("asking_price", state)} type="text" maxLength={60} placeholder="e.g. ₦85m, or ₦6m per year" className="field-input" />
          </Field>
        </div>
        <Field label="Title document" name="title_document" error={e.title_document} hint="For example C of O, R of O, Governor's consent">
          <input {...inputProps("title_document", state, { hint: true })} type="text" maxLength={120} className="field-input" />
        </Field>
        <Field label="Description" name="description" error={e.description} hint="Condition, features, access, and anything a buyer or tenant should know" required>
          <textarea {...inputProps("description", state, { hint: true })} rows={6} maxLength={4000} className="field-input" required />
        </Field>
        <p className="text-sm text-slate">
          Please do not send documents through this form. Once we review your submission, we will share a secure way to
          provide photos and documents.
        </p>
      </fieldset>

      <ConsentCheckbox state={state} purpose="review this submission and contact me about listing the property" />
      <SubmitButton pendingLabel="Submitting">Submit property for review</SubmitButton>
    </form>
  );
}
