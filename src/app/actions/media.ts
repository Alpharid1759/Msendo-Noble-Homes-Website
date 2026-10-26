// src/app/actions/media.ts
"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/staff";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

type Result = { ok: boolean; message: string };

function invalidate() {
  revalidateTag("media", { expire: 0 });
  revalidateTag("properties", { expire: 0 });
}

const uuid = z.uuid();

const metaSchema = z.object({
  title: z.string().trim().max(160).nullable(),
  caption: z.string().trim().max(300).nullable(),
  alt_text: z.string().trim().max(300).nullable(),
  description: z.string().trim().max(1000).nullable(),
  is_published: z.boolean(),
});

export async function updateMediaMeta(mediaId: string, meta: z.input<typeof metaSchema>): Promise<Result> {
  try {
    await assertPermission("media.upload");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Not allowed." };
  }
  const parsed = metaSchema.safeParse(meta);
  if (!uuid.safeParse(mediaId).success || !parsed.success) return { ok: false, message: "Invalid details." };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("media_assets").update(parsed.data).eq("id", mediaId);
  if (error) return { ok: false, message: "Could not save media details." };
  invalidate();
  return { ok: true, message: "Saved." };
}

export async function reorderMedia(propertyId: string, orderedIds: string[]): Promise<Result> {
  try {
    await assertPermission("properties.edit");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Not allowed." };
  }
  if (!uuid.safeParse(propertyId).success || !orderedIds.every((id) => uuid.safeParse(id).success)) return { ok: false, message: "Invalid order." };
  const supabase = await createServerSupabase();
  const results = await Promise.all(
    orderedIds.map((id, i) => supabase.from("property_media").update({ sort_order: i }).eq("property_id", propertyId).eq("media_id", id)),
  );
  if (results.some((r) => r.error)) return { ok: false, message: "Could not save the new order." };
  invalidate();
  return { ok: true, message: "Order saved." };
}

export async function setFeaturedMedia(propertyId: string, mediaId: string): Promise<Result> {
  try {
    await assertPermission("properties.edit");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Not allowed." };
  }
  const supabase = await createServerSupabase();
  await supabase.from("property_media").update({ is_featured: false }).eq("property_id", propertyId).eq("is_featured", true);
  const { error } = await supabase.from("property_media").update({ is_featured: true }).eq("property_id", propertyId).eq("media_id", mediaId);
  if (error) return { ok: false, message: "Could not set the main photo." };
  invalidate();
  return { ok: true, message: "Main photo updated." };
}

export async function linkExistingMedia(propertyId: string, mediaId: string): Promise<Result> {
  try {
    await assertPermission("properties.edit");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Not allowed." };
  }
  const supabase = await createServerSupabase();
  const { data: maxRow } = await supabase.from("property_media").select("sort_order").eq("property_id", propertyId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("property_media").insert({ property_id: propertyId, media_id: mediaId, sort_order: (maxRow?.sort_order ?? -1) + 1 });
  if (error) return { ok: false, message: error.code === "23505" ? "Already linked to this property." : "Could not link this media." };
  invalidate();
  return { ok: true, message: "Linked." };
}

export async function removeMedia(propertyId: string, mediaId: string, deletePermanently: boolean): Promise<Result> {
  try {
    await assertPermission("properties.edit");
    if (deletePermanently) await assertPermission("media.delete");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Not allowed." };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("property_media").delete().eq("property_id", propertyId).eq("media_id", mediaId);
  if (error) return { ok: false, message: "Could not remove this media." };

  if (deletePermanently) {
    const service = createServiceSupabase();
    const { count } = await service.from("property_media").select("media_id", { count: "exact", head: true }).eq("media_id", mediaId);
    if ((count ?? 0) > 0) {
      invalidate();
      return { ok: true, message: "Removed from this property. It is still used by other listings, so the file was kept." };
    }
    const { data: asset } = await service.from("media_assets").select("storage_path, variants, poster_path").eq("id", mediaId).maybeSingle();
    if (asset) {
      const paths = [asset.storage_path as string, ...Object.values((asset.variants as Record<string, string>) ?? {}), ...(asset.poster_path ? [asset.poster_path as string] : [])];
      await service.storage.from("public-media").remove([...new Set(paths)]);
      const { error: delErr } = await supabase.from("media_assets").delete().eq("id", mediaId);
      if (delErr) return { ok: false, message: "Files removed, but the media record could not be deleted." };
    }
  }

  const { data: featured } = await supabase.from("property_media").select("media_id").eq("property_id", propertyId).eq("is_featured", true).maybeSingle();
  if (!featured) {
    const { data: firstImage } = await supabase
      .from("property_media")
      .select("media_id, media_assets!inner(media_type)")
      .eq("property_id", propertyId)
      .eq("media_assets.media_type", "image")
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (firstImage) await supabase.from("property_media").update({ is_featured: true }).eq("property_id", propertyId).eq("media_id", firstImage.media_id);
  }

  invalidate();
  return { ok: true, message: deletePermanently ? "Deleted permanently." : "Removed from this property." };
}
