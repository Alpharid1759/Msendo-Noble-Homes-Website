// src/components/admin/InspectionManageForm.tsx
"use client";

import { useActionState } from "react";
import { updateInspection } from "@/app/actions/inspections";
import { FormMessage } from "@/components/forms/FormBits";
import { initialFormState } from "@/lib/form-state";
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary } from "./ui";

export function InspectionManageForm({
  id,
  status,
  defaultDate,
  defaultTime,
  durationMinutes,
  agentId,
  agents,
  internalNotes,
}: {
  id: string;
  status: string;
  defaultDate: string;
  defaultTime: string;
  durationMinutes: number;
  agentId: string | null;
  agents: { id: string; full_name: string; is_agent: boolean }[];
  internalNotes: string | null;
}) {
  const [state, action, pending] = useActionState(updateInspection, initialFormState);
  const scheduled = status === "confirmed" || status === "rescheduled";
  const closed = ["cancelled", "completed", "no_show"].includes(status);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <FormMessage state={state} />

      {!closed && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="scheduled_date" className="field-label">
                Date
              </label>
              <input id="scheduled_date" name="scheduled_date" type="date" defaultValue={defaultDate} className="field-input" aria-invalid={state.fieldErrors?.scheduled_date ? true : undefined} />
            </div>
            <div>
              <label htmlFor="scheduled_time" className="field-label">
                Time (Abuja)
              </label>
              <input id="scheduled_time" name="scheduled_time" type="time" step={900} defaultValue={defaultTime} className="field-input" />
            </div>
          </div>
          {state.fieldErrors?.scheduled_date && <p className="field-error" role="alert">{state.fieldErrors.scheduled_date}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="assigned_agent_id" className="field-label">
                Agent
              </label>
              <select id="assigned_agent_id" name="assigned_agent_id" defaultValue={agentId ?? ""} className="field-input" aria-invalid={state.fieldErrors?.assigned_agent_id ? true : undefined}>
                <option value="">Choose an agent</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                    {a.is_agent ? "" : " (staff)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="duration_minutes" className="field-label">
                Duration
              </label>
              <select id="duration_minutes" name="duration_minutes" defaultValue={String(durationMinutes)} className="field-input">
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>
          {state.fieldErrors?.assigned_agent_id && <p className="field-error" role="alert">{state.fieldErrors.assigned_agent_id}</p>}
          <div>
            <label htmlFor="message_to_customer" className="field-label">
              Message to include in the customer email <span className="font-normal text-slate">(optional)</span>
            </label>
            <textarea id="message_to_customer" name="message_to_customer" rows={2} maxLength={1000} className="field-input" placeholder="e.g. Meet the agent at the estate gate" />
          </div>
        </>
      )}

      <div>
        <label htmlFor="internal_notes" className="field-label">
          Internal notes
        </label>
        <textarea id="internal_notes" name="internal_notes" rows={3} maxLength={3000} defaultValue={internalNotes ?? ""} className="field-input" />
      </div>

      <div className="flex flex-wrap gap-2">
        {!closed && (
          <button type="submit" name="action" value={scheduled ? "reschedule" : "confirm"} className={adminBtnPrimary} disabled={pending}>
            {scheduled ? "Reschedule" : "Confirm inspection"}
          </button>
        )}
        {scheduled && (
          <>
            <button type="submit" name="action" value="complete" className={adminBtnSecondary} disabled={pending}>
              Mark completed
            </button>
            <button type="submit" name="action" value="no_show" className={adminBtnSecondary} disabled={pending}>
              Mark no-show
            </button>
          </>
        )}
        {!closed && (
          <button
            type="submit"
            name="action"
            value="cancel"
            onClick={(e) => {
              if (!window.confirm("Cancel this inspection? The customer will be emailed if they gave an address.")) e.preventDefault();
            }}
            className={adminBtnDanger}
            disabled={pending}
          >
            Cancel inspection
          </button>
        )}
        <button type="submit" name="action" value="notes" className={adminBtnSecondary} disabled={pending}>
          Save notes only
        </button>
      </div>
    </form>
  );
}
