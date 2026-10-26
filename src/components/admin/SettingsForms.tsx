// src/components/admin/SettingsForms.tsx
"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { saveSetting, saveTaxonomyItem } from "@/app/actions/settings";
import { FormMessage, SubmitButton } from "@/components/forms/FormBits";
import { initialFormState } from "@/lib/form-state";
import { finalizeUpload, IMAGE_TYPES, startResumableUpload } from "@/lib/upload-client";
import type { Testimonial } from "@/types/domain";
import { adminBtnGhost, adminBtnSecondary } from "./ui";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "email" | "url" | "number" | "checkbox" | "textarea" | "image";
  hint?: string;
  full?: boolean;
}

export function SettingsSection({ settingKey, fields, values }: { settingKey: string; fields: FieldDef[]; values: Record<string, unknown> }) {
  const [state, action] = useActionState(saveSetting, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="key" value={settingKey} />
      <FormMessage state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => {
          const err = state.fieldErrors?.[f.name];
          const id = `${settingKey}-${f.name}`;
          const raw = values[f.name];
          const value = Array.isArray(raw) ? raw.join(", ") : raw === null || raw === undefined ? "" : String(raw);
          if (f.type === "checkbox") {
            return (
              <label key={f.name} className="flex items-center gap-2.5 text-sm md:col-span-2">
                <input type="checkbox" name={f.name} defaultChecked={raw === true} className="h-4 w-4 accent-navy-800" />
                {f.label}
              </label>
            );
          }
          return (
            <div key={f.name} className={f.full || f.type === "textarea" ? "md:col-span-2" : undefined}>
              <label htmlFor={id} className="field-label">
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <textarea id={id} name={f.name} defaultValue={value} rows={3} className="field-input" aria-invalid={err ? true : undefined} />
              ) : f.type === "image" ? (
                <ImageUrlField id={id} name={f.name} initial={value} />
              ) : (
                <input id={id} name={f.name} type={f.type ?? "text"} defaultValue={value} className="field-input" aria-invalid={err ? true : undefined} />
              )}
              {err ? <p className="field-error">{err}</p> : f.hint ? <p className="field-hint">{f.hint}</p> : null}
            </div>
          );
        })}
      </div>
      <SubmitButton pendingLabel="Saving" className="min-h-10">
        Save
      </SubmitButton>
    </form>
  );
}

function ImageUrlField({ id, name, initial }: { id: string; name: string; initial: string }) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <input id={id} name={name} value={url} onChange={(e) => setUrl(e.target.value)} className="field-input" placeholder="https://" />
      {url && <img src={url} alt="" className="h-16 w-auto rounded-[3px] border border-line bg-navy-900 p-2" />}
      <input
        type="file"
        accept={IMAGE_TYPES.join(",")}
        aria-label="Upload image"
        disabled={busy}
        className="block text-sm"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setError(null);
          try {
            const h = await startResumableUpload(f, () => undefined);
            const raw = await h.promise;
            const res = await finalizeUpload({ rawPath: raw, kind: "blog-image" });
            if (res.url) setUrl(res.url);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function TestimonialsEditor({ initial }: { initial: Testimonial[] }) {
  const [state, action] = useActionState(saveSetting, initialFormState);
  const [items, setItems] = useState<Testimonial[]>(initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="key" value="testimonials" />
      <input type="hidden" name="items_json" value={JSON.stringify(items)} />
      <FormMessage state={state} />
      {state.fieldErrors?.items_json && <p className="field-error">{state.fieldErrors.items_json}</p>}
      <p className="text-sm text-slate">Only testimonials marked as permission confirmed appear on the website. Never publish invented or edited reviews.</p>
      <ul className="space-y-3">
        {items.map((t, i) => (
          <li key={i} className="grid gap-2 rounded-[var(--radius-control)] border border-line p-3 md:grid-cols-2">
            <input aria-label="Name" placeholder="Client name" value={t.name} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="field-input" />
            <input aria-label="Context" placeholder="e.g. Bought a home in Guzape, 2026" value={t.context ?? ""} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, context: e.target.value || null } : x)))} className="field-input" />
            <textarea aria-label="Quote" placeholder="Their words, exactly as given" value={t.quote} rows={3} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)))} className="field-input md:col-span-2" />
            <div className="flex items-center justify-between md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={t.permission_confirmed} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, permission_confirmed: e.target.checked } : x)))} className="h-4 w-4 accent-navy-800" />
                Client gave written permission to publish this
              </label>
              <button type="button" className={`${adminBtnGhost} text-danger`} onClick={() => setItems(items.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button type="button" className={adminBtnSecondary} onClick={() => setItems([...items, { name: "", context: null, quote: "", permission_confirmed: false }])}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add testimonial
        </button>
        <SubmitButton pendingLabel="Saving" className="min-h-10">
          Save testimonials
        </SubmitButton>
      </div>
    </form>
  );
}

export function TaxonomyItemForm({
  table,
  item,
  parents,
  submitLabel,
}: {
  table: "categories" | "locations" | "blog_categories";
  item?: Record<string, unknown>;
  parents?: { id: string; name: string; type: string }[];
  submitLabel: string;
}) {
  const [state, action] = useActionState(saveTaxonomyItem, initialFormState);
  const v = (k: string) => (item?.[k] === null || item?.[k] === undefined ? "" : String(item[k]));
  const prefix = `${table}-${v("id") || "new"}`;
  return (
    <form action={action} className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
      <input type="hidden" name="table" value={table} />
      {item?.id ? <input type="hidden" name="id" value={String(item.id)} /> : null}
      <div>
        <label htmlFor={`${prefix}-name`} className="text-xs font-semibold">
          Name
        </label>
        <input id={`${prefix}-name`} name="name" defaultValue={v("name")} required className="field-input min-h-9 py-1.5 text-sm" />
      </div>
      <div>
        <label htmlFor={`${prefix}-slug`} className="text-xs font-semibold">
          Slug
        </label>
        <input id={`${prefix}-slug`} name="slug" defaultValue={v("slug")} required className="field-input min-h-9 py-1.5 text-sm" />
      </div>
      <div>
        <label htmlFor={`${prefix}-sort`} className="text-xs font-semibold">
          Order
        </label>
        <input id={`${prefix}-sort`} name="sort_order" type="number" min={0} defaultValue={v("sort_order") || "0"} className="field-input min-h-9 w-20 py-1.5 text-sm" />
      </div>
      <SubmitButton pendingLabel="Saving" className="min-h-9 px-4 text-sm">
        {submitLabel}
      </SubmitButton>
      {table === "categories" && (
        <div className="flex flex-wrap items-center gap-3 md:col-span-4">
          <label className="text-xs font-semibold" htmlFor={`${prefix}-icon`}>
            Icon
          </label>
          <select id={`${prefix}-icon`} name="icon" defaultValue={v("icon") || "home"} className="field-input min-h-9 w-40 py-1 text-sm">
            {["home", "building", "map", "store", "briefcase", "warehouse", "key", "gem", "landmark"].map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={item ? item.is_active === true : true} className="h-4 w-4 accent-navy-800" />
            Active
          </label>
          <input name="description" defaultValue={v("description")} placeholder="Description (optional)" aria-label="Description" className="field-input min-h-9 flex-1 py-1.5 text-sm" />
        </div>
      )}
      {table === "locations" && (
        <div className="flex flex-wrap items-center gap-3 md:col-span-4">
          <label className="text-xs font-semibold" htmlFor={`${prefix}-type`}>
            Type
          </label>
          <select id={`${prefix}-type`} name="type" defaultValue={v("type") || "district"} className="field-input min-h-9 w-32 py-1 text-sm">
            <option value="state">State</option>
            <option value="city">City</option>
            <option value="district">District</option>
          </select>
          <label className="text-xs font-semibold" htmlFor={`${prefix}-parent`}>
            Parent
          </label>
          <select id={`${prefix}-parent`} name="parent_id" defaultValue={v("parent_id")} className="field-input min-h-9 w-56 py-1 text-sm">
            <option value="">None</option>
            {(parents ?? [])
              .filter((p) => p.id !== item?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" name="is_featured" defaultChecked={item?.is_featured === true} className="h-4 w-4 accent-navy-800" />
            Featured on home page
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={item ? item.is_active === true : true} className="h-4 w-4 accent-navy-800" />
            Active
          </label>
          <textarea name="description" defaultValue={v("description")} rows={2} placeholder="Area guide for the location page (optional)" aria-label="Description" className="field-input w-full text-sm" />
        </div>
      )}
      {state.status !== "idle" && <p className={`text-sm md:col-span-4 ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>}
    </form>
  );
}
