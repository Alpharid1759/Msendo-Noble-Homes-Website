// src/components/admin/PropertyForm.tsx
"use client";

import clsx from "clsx";
import { Plus, Trash2, X } from "lucide-react";
import { useActionState, useState } from "react";
import { saveProperty, type PropertyFormState } from "@/app/actions/properties";
import { CHARGE_LABEL, slugify, STATUS_LABEL } from "@/lib/format";
import type { ChargeType, PropertyStatus } from "@/types/domain";
import { adminBtnGhost, adminBtnPrimary, adminBtnSecondary } from "./ui";

export interface EditableProperty {
  id: string;
  reference: string;
  title: string;
  slug: string;
  description: string;
  transaction_type: "sale" | "rent" | "short_let";
  category_id: string;
  status: PropertyStatus;
  price: number | null;
  price_on_request: boolean;
  currency: string;
  billing_frequency: string;
  is_negotiable: boolean;
  location_id: string;
  address_line: string | null;
  show_exact_address: boolean;
  latitude: number | null;
  longitude: number | null;
  show_map_pin: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  parking_spaces: number | null;
  land_area: number | null;
  floor_area: number | null;
  area_unit: string;
  furnishing: string | null;
  available_from: string | null;
  lease_min_months: number | null;
  title_document: string | null;
  title_verified: boolean;
  title_notes: string | null;
  virtual_tour_url: string | null;
  is_featured: boolean;
  is_demo: boolean;
  keep_public_page: boolean;
  seo_title: string | null;
  seo_description: string | null;
  amenities: string[];
  attributes: Record<string, string>;
}

export interface EditableCharge {
  charge_type: ChargeType;
  label: string;
  amount: number | null;
  is_percentage: boolean;
  billing_frequency: string;
  notes: string | null;
}

const COMMON_AMENITIES = [
  "24-hour power",
  "Borehole water",
  "Swimming pool",
  "Gym",
  "Security",
  "CCTV",
  "Boys' quarters",
  "Fitted kitchen",
  "Air conditioning",
  "Parking",
  "Gated estate",
  "Elevator",
  "Internet",
  "Garden",
];

function Section({ title, children, description }: { title: string; children: React.ReactNode; description?: string }) {
  return (
    <fieldset className="rounded-[var(--radius-card)] border border-line bg-white p-5">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </fieldset>
  );
}

function F({ label, name, error, hint, children, className }: { label: string; name: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

function Check({ name, label, defaultChecked, disabled, error }: { name: string; label: string; defaultChecked?: boolean; disabled?: boolean; error?: string }) {
  return (
    <div>
      <label className={clsx("flex items-center gap-2.5 text-sm", disabled && "opacity-60")}>
        <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="h-4 w-4 accent-navy-800" />
        {label}
      </label>
      {error && <p className="field-error">{error}</p>}
      {disabled && defaultChecked && <input type="hidden" name={name} value="on" />}
    </div>
  );
}

const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function PropertyForm({
  property,
  charges: initialCharges,
  categories,
  locations,
  canPublish,
}: {
  property: EditableProperty | null;
  charges: EditableCharge[];
  categories: { id: string; name: string }[];
  locations: { id: string; name: string; type: string; parent_name: string | null }[];
  canPublish: boolean;
}) {
  const [state, action, pending] = useActionState<PropertyFormState, FormData>(saveProperty, { status: "idle" });
  const [tx, setTx] = useState(property?.transaction_type ?? "sale");
  const [onRequest, setOnRequest] = useState(property?.price_on_request ?? false);
  const [title, setTitle] = useState(property?.title ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(property));
  const [slug, setSlug] = useState(property?.slug ?? "");
  const [amenities, setAmenities] = useState<string[]>(property?.amenities ?? []);
  const [amenityInput, setAmenityInput] = useState("");
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>(
    Object.entries(property?.attributes ?? {}).map(([key, value]) => ({ key, value: String(value) })),
  );
  const [charges, setCharges] = useState<EditableCharge[]>(initialCharges);
  const e = state.fieldErrors ?? {};

  const statusOptions: PropertyStatus[] = canPublish
    ? ["draft", "pending_review", "published", "reserved", "sold", "rented", "unavailable", "archived"]
    : property && !["draft", "pending_review"].includes(property.status)
      ? [property.status]
      : ["draft", "pending_review"];

  const addAmenity = (a: string) => {
    const v = a.trim();
    if (v && !amenities.some((x) => x.toLowerCase() === v.toLowerCase())) setAmenities([...amenities, v].slice(0, 60));
    setAmenityInput("");
  };

  const isSale = tx === "sale";

  return (
    <form action={action} className="space-y-6" noValidate>
      {property && <input type="hidden" name="id" value={property.id} />}
      <input type="hidden" name="amenities_json" value={JSON.stringify(amenities)} />
      <input type="hidden" name="attributes_json" value={JSON.stringify(attributes)} />
      <input type="hidden" name="charges_json" value={JSON.stringify(charges)} />

      {state.status !== "idle" && state.message && (
        <p role={state.status === "error" ? "alert" : "status"} className={clsx("rounded-[var(--radius-control)] px-4 py-3 text-sm", state.status === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success")}>
          {state.message}
          {state.status === "error" && Object.keys(e).length > 0 && ` (${Object.keys(e).length} field${Object.keys(e).length === 1 ? "" : "s"})`}
        </p>
      )}

      <Section title="Basics">
        <F label="Title" name="title" error={e.title} hint="Be specific, e.g. 4-bedroom terrace duplex with BQ, Jabi">
          <input
            id="title"
            name="title"
            value={title}
            onChange={(ev) => {
              setTitle(ev.target.value);
              if (!slugTouched) setSlug(slugify(ev.target.value));
            }}
            maxLength={160}
            required
            className="field-input"
          />
        </F>
        <F label="Web address (slug)" name="slug" error={e.slug} hint={`/properties/${slug || "auto-generated-from-title"}${property?.status === "published" ? ". Changing it keeps the old link working with a redirect." : ""}`}>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(ev) => {
              setSlugTouched(true);
              setSlug(ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
            }}
            maxLength={100}
            className="field-input"
          />
        </F>
        <div className="grid gap-4 md:grid-cols-3">
          <F label="Transaction" name="transaction_type" error={e.transaction_type}>
            <select id="transaction_type" name="transaction_type" value={tx} onChange={(ev) => setTx(ev.target.value as typeof tx)} className="field-input">
              <option value="sale">For sale</option>
              <option value="rent">For rent (long-term)</option>
              <option value="short_let">Short-let</option>
            </select>
          </F>
          <F label="Property type" name="category_id" error={e.category_id}>
            <select id="category_id" name="category_id" defaultValue={property?.category_id ?? ""} className="field-input" required>
              <option value="" disabled>
                Choose a type
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </F>
          <F label="Status" name="status" error={e.status} hint={canPublish ? undefined : "A publisher will review and publish this listing."}>
            <select id="status" name="status" defaultValue={property?.status ?? "draft"} className="field-input">
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </F>
        </div>
        <F label="Description" name="description" error={e.description} hint="Plain text. Leave a blank line between paragraphs.">
          <textarea id="description" name="description" defaultValue={property?.description ?? ""} rows={8} maxLength={10000} className="field-input" />
        </F>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Check name="is_featured" label="Feature on the home page" defaultChecked={property?.is_featured} disabled={!canPublish} />
          <Check name="keep_public_page" label="Keep page online with a status message after it is sold, let or unavailable" defaultChecked={property?.keep_public_page ?? true} />
          <Check name="is_demo" label="Demonstration listing (labelled as not real)" defaultChecked={property?.is_demo} />
        </div>
      </Section>

      <Section title={isSale ? "Asking price" : "Rent"} description={isSale ? undefined : "Enter the rent alone. Add deposits and fees as separate charges below."}>
        <div className="grid gap-4 md:grid-cols-4">
          <F label={isSale ? "Asking price" : "Rent amount"} name="price" error={e.price} className="md:col-span-2">
            <input id="price" name="price" inputMode="decimal" defaultValue={num(property?.price)} disabled={onRequest} className="field-input" placeholder="e.g. 150000000" />
          </F>
          <F label="Currency" name="currency" error={e.currency}>
            <select id="currency" name="currency" defaultValue={property?.currency ?? "NGN"} className="field-input">
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
            </select>
          </F>
          {!isSale && (
            <F label="Paid" name="billing_frequency" error={e.billing_frequency}>
              <select id="billing_frequency" name="billing_frequency" defaultValue={property?.billing_frequency && property.billing_frequency !== "one_off" ? property.billing_frequency : tx === "short_let" ? "per_night" : "per_year"} className="field-input">
                <option value="per_year">Per year</option>
                <option value="per_month">Per month</option>
                <option value="per_week">Per week</option>
                <option value="per_night">Per night</option>
              </select>
            </F>
          )}
          {isSale && <input type="hidden" name="billing_frequency" value="one_off" />}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="price_on_request" checked={onRequest} onChange={(ev) => setOnRequest(ev.target.checked)} className="h-4 w-4 accent-navy-800" />
            Price on request
          </label>
          <Check name="is_negotiable" label="Open to offers" defaultChecked={property?.is_negotiable} />
        </div>
      </Section>

      <Section title="Additional charges" description="Each charge is shown on its own line. Never fold these into the headline price.">
        {charges.length === 0 && <p className="text-sm text-slate">No additional charges.</p>}
        <ul className="space-y-3">
          {charges.map((c, i) => (
            <li key={i} className="grid gap-2 rounded-[var(--radius-control)] border border-line p-3 md:grid-cols-[10rem_1fr_9rem_8rem_8rem_auto] md:items-end">
              <div>
                <label className="text-xs font-semibold" htmlFor={`ct-${i}`}>
                  Type
                </label>
                <select
                  id={`ct-${i}`}
                  value={c.charge_type}
                  onChange={(ev) => {
                    const t = ev.target.value as ChargeType;
                    setCharges(charges.map((x, j) => (j === i ? { ...x, charge_type: t, label: x.label && x.label !== CHARGE_LABEL[x.charge_type] ? x.label : CHARGE_LABEL[t] } : x)));
                  }}
                  className="field-input min-h-10 py-2 text-sm"
                >
                  {Object.entries(CHARGE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold" htmlFor={`cl-${i}`}>
                  Label
                </label>
                <input id={`cl-${i}`} value={c.label} onChange={(ev) => setCharges(charges.map((x, j) => (j === i ? { ...x, label: ev.target.value } : x)))} className="field-input min-h-10 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold" htmlFor={`ca-${i}`}>
                  Amount {c.is_percentage ? "(%)" : ""}
                </label>
                <input
                  id={`ca-${i}`}
                  inputMode="decimal"
                  value={c.amount ?? ""}
                  placeholder="To be confirmed"
                  onChange={(ev) => {
                    const v = ev.target.value.replace(/[^\d.]/g, "");
                    setCharges(charges.map((x, j) => (j === i ? { ...x, amount: v === "" ? null : Number(v) } : x)));
                  }}
                  className="field-input min-h-10 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold" htmlFor={`cf-${i}`}>
                  Frequency
                </label>
                <select id={`cf-${i}`} value={c.billing_frequency} onChange={(ev) => setCharges(charges.map((x, j) => (j === i ? { ...x, billing_frequency: ev.target.value } : x)))} className="field-input min-h-10 py-2 text-sm">
                  <option value="one_off">One-off</option>
                  <option value="per_year">Per year</option>
                  <option value="per_month">Per month</option>
                  <option value="per_night">Per night</option>
                </select>
              </div>
              <label className="flex min-h-10 items-center gap-2 text-sm">
                <input type="checkbox" checked={c.is_percentage} onChange={(ev) => setCharges(charges.map((x, j) => (j === i ? { ...x, is_percentage: ev.target.checked } : x)))} className="h-4 w-4 accent-navy-800" />
                Percentage
              </label>
              <button type="button" onClick={() => setCharges(charges.filter((_, j) => j !== i))} className={`${adminBtnGhost} text-danger`} aria-label={`Remove ${c.label}`}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <input
                aria-label="Notes"
                placeholder="Notes, e.g. refundable at end of tenancy"
                value={c.notes ?? ""}
                onChange={(ev) => setCharges(charges.map((x, j) => (j === i ? { ...x, notes: ev.target.value || null } : x)))}
                className="field-input min-h-10 py-2 text-sm md:col-span-6"
              />
            </li>
          ))}
        </ul>
        {e.charges && <p className="field-error">{e.charges}</p>}
        <button
          type="button"
          className={adminBtnSecondary}
          onClick={() => setCharges([...charges, { charge_type: "caution_deposit", label: CHARGE_LABEL.caution_deposit, amount: null, is_percentage: false, billing_frequency: "one_off", notes: null }])}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add charge
        </button>
      </Section>

      <Section title="Location" description="Visitors only see the district unless you choose to show the exact address or map pin.">
        <div className="grid gap-4 md:grid-cols-2">
          <F label="District or area" name="location_id" error={e.location_id}>
            <select id="location_id" name="location_id" defaultValue={property?.location_id ?? ""} className="field-input" required>
              <option value="" disabled>
                Choose a location
              </option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.parent_name ? `, ${l.parent_name}` : ""}
                </option>
              ))}
            </select>
          </F>
          <F label="Street address (private unless shown)" name="address_line" error={e.address_line}>
            <input id="address_line" name="address_line" defaultValue={property?.address_line ?? ""} maxLength={200} className="field-input" />
          </F>
          <F label="Latitude" name="latitude" error={e.latitude}>
            <input id="latitude" name="latitude" inputMode="decimal" defaultValue={num(property?.latitude)} className="field-input" placeholder="9.0765" />
          </F>
          <F label="Longitude" name="longitude" error={e.longitude}>
            <input id="longitude" name="longitude" inputMode="decimal" defaultValue={num(property?.longitude)} className="field-input" placeholder="7.3986" />
          </F>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Check name="show_exact_address" label="Show street address publicly" defaultChecked={property?.show_exact_address} error={e.show_exact_address} />
          <Check name="show_map_pin" label="Show map pin publicly" defaultChecked={property?.show_map_pin} error={e.show_map_pin} />
        </div>
      </Section>

      <Section title="Specifications">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <F label="Bedrooms" name="bedrooms" error={e.bedrooms}>
            <input id="bedrooms" name="bedrooms" inputMode="numeric" defaultValue={num(property?.bedrooms)} className="field-input" />
          </F>
          <F label="Bathrooms" name="bathrooms" error={e.bathrooms}>
            <input id="bathrooms" name="bathrooms" inputMode="numeric" defaultValue={num(property?.bathrooms)} className="field-input" />
          </F>
          <F label="Toilets" name="toilets" error={e.toilets}>
            <input id="toilets" name="toilets" inputMode="numeric" defaultValue={num(property?.toilets)} className="field-input" />
          </F>
          <F label="Parking spaces" name="parking_spaces" error={e.parking_spaces}>
            <input id="parking_spaces" name="parking_spaces" inputMode="numeric" defaultValue={num(property?.parking_spaces)} className="field-input" />
          </F>
          <F label="Floor area" name="floor_area" error={e.floor_area}>
            <input id="floor_area" name="floor_area" inputMode="decimal" defaultValue={num(property?.floor_area)} className="field-input" />
          </F>
          <F label="Land area" name="land_area" error={e.land_area}>
            <input id="land_area" name="land_area" inputMode="decimal" defaultValue={num(property?.land_area)} className="field-input" />
          </F>
          <F label="Area unit" name="area_unit" error={e.area_unit}>
            <select id="area_unit" name="area_unit" defaultValue={property?.area_unit ?? "sqm"} className="field-input">
              <option value="sqm">Square metres (m²)</option>
              <option value="sqft">Square feet</option>
              <option value="hectare">Hectares</option>
              <option value="acre">Acres</option>
              <option value="plot">Plots</option>
            </select>
          </F>
          <F label="Furnishing" name="furnishing" error={e.furnishing}>
            <select id="furnishing" name="furnishing" defaultValue={property?.furnishing ?? ""} className="field-input">
              <option value="">Not specified</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi_furnished">Semi-furnished</option>
              <option value="furnished">Furnished</option>
              <option value="serviced">Serviced</option>
            </select>
          </F>
          <F label="Available from" name="available_from" error={e.available_from}>
            <input id="available_from" name="available_from" type="date" defaultValue={property?.available_from ?? ""} className="field-input" />
          </F>
          {!isSale && (
            <F label="Minimum lease (months)" name="lease_min_months" error={e.lease_min_months}>
              <input id="lease_min_months" name="lease_min_months" inputMode="numeric" defaultValue={num(property?.lease_min_months)} className="field-input" />
            </F>
          )}
        </div>

        <div>
          <p className="field-label">Amenities</p>
          <ul className="flex flex-wrap gap-2">
            {amenities.map((a) => (
              <li key={a} className="inline-flex items-center gap-1 rounded-[3px] bg-sand px-2 py-1 text-sm">
                {a}
                <button type="button" onClick={() => setAmenities(amenities.filter((x) => x !== a))} aria-label={`Remove ${a}`} className="text-slate hover:text-danger">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <label htmlFor="amenity-input" className="sr-only">
              Add amenity
            </label>
            <input
              id="amenity-input"
              list="amenity-suggestions"
              value={amenityInput}
              onChange={(ev) => setAmenityInput(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  addAmenity(amenityInput);
                }
              }}
              placeholder="Type an amenity and press Enter"
              className="field-input"
            />
            <datalist id="amenity-suggestions">
              {COMMON_AMENITIES.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <button type="button" className={adminBtnSecondary} onClick={() => addAmenity(amenityInput)}>
              Add
            </button>
          </div>
        </div>

        <div>
          <p className="field-label">Other attributes</p>
          <p className="field-hint mb-2">For details specific to this property type, e.g. Floor: 3rd, Ceiling height: 6 m, Power: 3-phase.</p>
          <ul className="space-y-2">
            {attributes.map((a, i) => (
              <li key={i} className="flex gap-2">
                <input aria-label="Attribute name" value={a.key} maxLength={40} onChange={(ev) => setAttributes(attributes.map((x, j) => (j === i ? { ...x, key: ev.target.value } : x)))} className="field-input" placeholder="Name" />
                <input aria-label="Attribute value" value={a.value} maxLength={120} onChange={(ev) => setAttributes(attributes.map((x, j) => (j === i ? { ...x, value: ev.target.value } : x)))} className="field-input" placeholder="Value" />
                <button type="button" onClick={() => setAttributes(attributes.filter((_, j) => j !== i))} className={`${adminBtnGhost} text-danger`} aria-label="Remove attribute">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className={`${adminBtnSecondary} mt-2`} onClick={() => setAttributes([...attributes, { key: "", value: "" }])}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add attribute
          </button>
        </div>
      </Section>

      <Section title="Title and documents" description="Only mark as verified after the documents have actually been reviewed.">
        <div className="grid gap-4 md:grid-cols-2">
          <F label="Title document" name="title_document" error={e.title_document} hint="e.g. Certificate of Occupancy (C of O)">
            <input id="title_document" name="title_document" defaultValue={property?.title_document ?? ""} maxLength={160} className="field-input" />
          </F>
          <F label="Virtual tour link" name="virtual_tour_url" error={e.virtual_tour_url}>
            <input id="virtual_tour_url" name="virtual_tour_url" type="url" defaultValue={property?.virtual_tour_url ?? ""} className="field-input" placeholder="https://" />
          </F>
        </div>
        <F label="Internal document notes (never shown publicly)" name="title_notes" error={e.title_notes}>
          <textarea id="title_notes" name="title_notes" defaultValue={property?.title_notes ?? ""} rows={3} maxLength={1000} className="field-input" />
        </F>
        <Check name="title_verified" label="Our team has reviewed and verified the title documents" defaultChecked={property?.title_verified} disabled={!canPublish} />
      </Section>

      <Section title="Search engines" description="Leave blank to use the title and description automatically.">
        <F label="SEO title" name="seo_title" error={e.seo_title} hint="Up to 70 characters">
          <input id="seo_title" name="seo_title" defaultValue={property?.seo_title ?? ""} maxLength={70} className="field-input" />
        </F>
        <F label="Meta description" name="seo_description" error={e.seo_description} hint="Up to 170 characters">
          <textarea id="seo_description" name="seo_description" defaultValue={property?.seo_description ?? ""} rows={2} maxLength={170} className="field-input" />
        </F>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <p className="text-sm text-slate">{property ? `Ref ${property.reference}` : "The reference number is created when you save."}</p>
        <button type="submit" className={adminBtnPrimary} disabled={pending}>
          {pending ? "Saving" : property ? "Save changes" : "Create listing"}
        </button>
      </div>
    </form>
  );
}
