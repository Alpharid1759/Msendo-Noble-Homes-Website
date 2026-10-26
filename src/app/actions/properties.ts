// src/app/actions/properties.ts
"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { assertPermission, PermissionError } from "@/lib/auth/staff";
import { slugify } from "@/lib/format";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/public-forms";
import { propertySchema } from "@/lib/validation/admin";
import type { PropertyStatus } from "@/types/domain";

export interface PropertyFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  savedAt?: number;
}

function omit(obj: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}

function invalidate() {
  revalidateTag("properties", { expire: 0 });
  revalidateTag("media", { expire: 0 });
}

function dbMessage(error: { code?: string; message: string }) {
  if (error.code === "42501") return error.message.includes("row-level security") ? "You do not have permission to do that." : error.message;
  if (error.code === "23505") return "That web address (slug) is already used by another listing. Choose a different one.";
  if (error.code === "23503") return "This item is linked to other records and cannot be removed.";
  return "The change could not be saved. Check the form and try again.";
}

function parseForm(form: FormData) {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string" && !["amenities_json", "attributes_json", "charges_json"].includes(k)) raw[k] = v;
  }
  const json = <T>(key: string, fallback: T): T => {
    try {
      return JSON.parse(String(form.get(key) ?? "")) as T;
    } catch {
      return fallback;
    }
  };
  raw.amenities = json<string[]>("amenities_json", []);
  const attrs = json<{ key: string; value: string }[]>("attributes_json", []);
  raw.attributes = Object.fromEntries(attrs.filter((a) => a.key.trim()).map((a) => [a.key.trim(), a.value.trim()]));
  raw.charges = json<unknown[]>("charges_json", []);
  return raw;
}

export async function saveProperty(_prev: PropertyFormState, form: FormData): Promise<PropertyFormState> {
  const id = String(form.get("id") ?? "") || null;
  try {
    await assertPermission(id ? "properties.edit" : "properties.create");
  } catch (e) {
    return { status: "error", message: e instanceof PermissionError ? e.message : "Not allowed." };
  }

  const parsed = propertySchema.safeParse(parseForm(form));
  if (!parsed.success) {
    return { status: "error", message: "Some fields need attention.", fieldErrors: fieldErrors(parsed.error) };
  }
  const { charges, ...input } = parsed.data;
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  let slug = input.slug;
  if (!slug) {
    const { data: loc } = await supabase.from("locations").select("name").eq("id", input.location_id).maybeSingle();
    const district = loc?.name && !input.title.toLowerCase().includes(loc.name.toLowerCase()) ? ` ${loc.name}` : "";
    slug = slugify(`${input.title}${district}`);
    const { data: clash } = await supabase.from("properties").select("id").eq("slug", slug).maybeSingle();
    if (clash && clash.id !== id) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const row = {
    ...input,
    slug,
    price: input.price_on_request ? null : input.price,
    billing_frequency: input.transaction_type === "sale" ? "one_off" : input.billing_frequency,
    updated_by: userId,
  };

  let propertyId = id;
  if (id) {
    const { error } = await supabase.from("properties").update(row).eq("id", id);
    if (error) return { status: "error", message: dbMessage(error), fieldErrors: error.code === "23505" ? { slug: "Already in use" } : undefined };
  } else {
    const { data, error } = await supabase
      .from("properties")
      .insert({ ...row, reference: "", created_by: userId })
      .select("id")
      .single();
    if (error) return { status: "error", message: dbMessage(error), fieldErrors: error.code === "23505" ? { slug: "Already in use" } : undefined };
    propertyId = data.id;
  }

  const { error: delErr } = await supabase.from("property_charges").delete().eq("property_id", propertyId);
  if (!delErr && charges.length) {
    await supabase.from("property_charges").insert(charges.map((c, i) => ({ ...c, property_id: propertyId, sort_order: i })));
  }

  invalidate();
  if (!id) redirect(`/admin/properties/${propertyId}?created=1`);
  return { status: "success", message: "Saved.", savedAt: Date.now() };
}

export async function setPropertyStatus(id: string, status: PropertyStatus): Promise<{ ok: boolean; message: string }> {
  try {
    await assertPermission(status === "draft" || status === "pending_review" ? "properties.edit" : "properties.publish");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Not allowed." };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("properties").update({ status }).eq("id", id);
  if (error) return { ok: false, message: dbMessage(error) };
  invalidate();
  return { ok: true, message: "Status updated." };
}

export async function duplicateProperty(id: string) {
  await assertPermission("properties.create");
  const supabase = await createServerSupabase();
  const { data: src } = await supabase.from("properties").select("*").eq("id", id).single();
  if (!src) redirect("/admin/properties");
  const { data: auth } = await supabase.auth.getUser();
  const rest = omit(src as Record<string, unknown>, ["id", "reference", "search_vector", "created_at", "updated_at", "published_at", "title_verified_at"]);
  const { data: copy, error } = await supabase
    .from("properties")
    .insert({
      ...rest,
      reference: "",
      title: `${String(src.title).slice(0, 150)} (copy)`,
      slug: `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`,
      status: "draft",
      is_featured: false,
      title_verified: false,
      created_by: auth.user?.id ?? null,
      updated_by: auth.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !copy) redirect(`/admin/properties/${id}?error=duplicate`);
  const { data: charges } = await supabase.from("property_charges").select("*").eq("property_id", id);
  if (charges?.length) {
    await supabase.from("property_charges").insert(charges.map((c) => ({ ...omit(c as Record<string, unknown>, ["id"]), property_id: copy.id })));
  }
  redirect(`/admin/properties/${copy.id}?duplicated=1`);
}

export async function deleteProperty(id: string): Promise<{ ok: boolean; message: string }> {
  try {
    await assertPermission("properties.delete");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Not allowed." };
  }
  const supabase = await createServerSupabase();
  const { data: links } = await supabase.from("property_media").select("media_id").eq("property_id", id);
  const mediaIds = (links ?? []).map((l) => l.media_id as string);
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      message: error.code === "23503" ? "This property has inspection records. Archive it instead of deleting." : dbMessage(error),
    };
  }
  if (mediaIds.length) {
    const service = createServiceSupabase();
    const { data: stillLinked } = await service.from("property_media").select("media_id").in("media_id", mediaIds);
    const linked = new Set((stillLinked ?? []).map((l) => l.media_id as string));
    const orphanIds = mediaIds.filter((m) => !linked.has(m));
    if (orphanIds.length) {
      const { data: assets } = await service.from("media_assets").select("id, bucket, storage_path, variants, poster_path").in("id", orphanIds);
      const paths = (assets ?? []).flatMap((a) => [
        a.storage_path as string,
        ...Object.values((a.variants as Record<string, string>) ?? {}),
        ...(a.poster_path ? [a.poster_path as string] : []),
      ]);
      if (paths.length) await service.storage.from("public-media").remove([...new Set(paths)]);
      await service.from("media_assets").delete().in("id", orphanIds);
    }
  }
  invalidate();
  return { ok: true, message: "Property deleted." };
}
