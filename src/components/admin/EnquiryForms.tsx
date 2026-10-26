// src/components/admin/EnquiryForms.tsx
"use client";

import { useActionState, useEffect, useRef } from "react";
import { addEnquiryNote, updateEnquiry } from "@/app/actions/enquiries";
import { FormMessage, SubmitButton } from "@/components/forms/FormBits";
import { ENQUIRY_STATUS_LABEL } from "@/lib/format";
import { initialFormState } from "@/lib/form-state";

export function EnquiryUpdateForm({
  id,
  status,
  assignedTo,
  followUp,
  agents,
}: {
  id: string;
  status: string;
  assignedTo: string | null;
  followUp: string | null;
  agents: { id: string; full_name: string }[];
}) {
  const [state, action] = useActionState(updateEnquiry, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <FormMessage state={state} />
      <div>
        <label htmlFor="status" className="field-label">
          Status
        </label>
        <select id="status" name="status" defaultValue={status} className="field-input">
          {Object.entries(ENQUIRY_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="assigned_to" className="field-label">
          Assigned to
        </label>
        <select id="assigned_to" name="assigned_to" defaultValue={assignedTo ?? ""} className="field-input">
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="follow_up_at" className="field-label">
          Follow-up date
        </label>
        <input id="follow_up_at" name="follow_up_at" type="date" defaultValue={followUp ? followUp.slice(0, 10) : ""} className="field-input" />
      </div>
      <SubmitButton pendingLabel="Saving" className="min-h-10 w-full">
        Save
      </SubmitButton>
    </form>
  );
}

export function EnquiryNoteForm({ id }: { id: string }) {
  const [state, action] = useActionState(addEnquiryNote, initialFormState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <FormMessage state={state} />
      <label htmlFor="note" className="field-label">
        Add an internal note
      </label>
      <textarea id="note" name="note" rows={3} maxLength={3000} required className="field-input" placeholder="e.g. Called, prefers weekend inspection" />
      <SubmitButton pendingLabel="Saving" className="min-h-10">
        Add note
      </SubmitButton>
    </form>
  );
}
