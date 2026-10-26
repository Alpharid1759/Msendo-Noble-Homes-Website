// src/components/admin/StaffForms.tsx
"use client";

import { useActionState } from "react";
import { inviteStaff, updateStaff, type InviteState } from "@/app/actions/staff";
import { FormMessage, SubmitButton } from "@/components/forms/FormBits";
import { initialFormState } from "@/lib/form-state";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrator",
  admin: "Administrator",
  property_manager: "Property Manager",
  listing_editor: "Listing Editor",
  content_editor: "Marketing and Content Editor",
  support_officer: "Enquiry and Customer Support Officer",
};

export function InviteStaffForm({ canGrantSuper }: { canGrantSuper: boolean }) {
  const [state, action] = useActionState<InviteState, FormData>(inviteStaff, { status: "idle" });
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      {state.inviteLink && <input readOnly value={state.inviteLink} className="field-input text-xs" onFocus={(e) => e.currentTarget.select()} aria-label="One-time invitation link" />}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="field-label">
            Full name
          </label>
          <input id="full_name" name="full_name" defaultValue={state.values?.full_name} className="field-input" required />
          {state.fieldErrors?.full_name && <p className="field-error">{state.fieldErrors.full_name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Work email
          </label>
          <input id="email" name="email" type="email" defaultValue={state.values?.email} className="field-input" required />
          {state.fieldErrors?.email && <p className="field-error">{state.fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="role_key" className="field-label">
            Role
          </label>
          <select id="role_key" name="role_key" defaultValue={state.values?.role_key ?? "listing_editor"} className="field-input">
            {Object.entries(ROLE_LABELS)
              .filter(([k]) => canGrantSuper || k !== "super_admin")
              .map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="job_title" className="field-label">
            Job title <span className="font-normal text-slate">(optional)</span>
          </label>
          <input id="job_title" name="job_title" defaultValue={state.values?.job_title} className="field-input" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_agent" className="h-4 w-4 accent-navy-800" />
        Can be assigned to inspections as an agent
      </label>
      <SubmitButton pendingLabel="Sending invitation">Send invitation</SubmitButton>
    </form>
  );
}

export function StaffRowForm({
  id,
  role,
  isActive,
  isAgent,
  jobTitle,
  isSelf,
  canGrantSuper,
}: {
  id: string;
  role: string;
  isActive: boolean;
  isAgent: boolean;
  jobTitle: string | null;
  isSelf: boolean;
  canGrantSuper: boolean;
}) {
  const [state, action] = useActionState(updateStaff, initialFormState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`role-${id}`}>
        Role
      </label>
      <select id={`role-${id}`} name="role_key" defaultValue={role} disabled={isSelf} className="field-input min-h-9 w-56 py-1 text-sm">
        {Object.entries(ROLE_LABELS)
          .filter(([k]) => canGrantSuper || k !== "super_admin" || role === "super_admin")
          .map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
      </select>
      {isSelf && <input type="hidden" name="role_key" value={role} />}
      <label className="sr-only" htmlFor={`title-${id}`}>
        Job title
      </label>
      <input id={`title-${id}`} name="job_title" defaultValue={jobTitle ?? ""} placeholder="Job title" className="field-input min-h-9 w-40 py-1 text-sm" />
      <label className="flex items-center gap-1.5 text-sm">
        <input type="checkbox" name="is_agent" defaultChecked={isAgent} className="h-4 w-4 accent-navy-800" />
        Agent
      </label>
      <label className="flex items-center gap-1.5 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={isActive} disabled={isSelf} className="h-4 w-4 accent-navy-800" />
        Active
      </label>
      {isSelf && <input type="hidden" name="is_active" value="on" />}
      <SubmitButton pendingLabel="Saving" className="min-h-9 px-4 text-sm">
        Save
      </SubmitButton>
      {state.status !== "idle" && <span className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</span>}
    </form>
  );
}
