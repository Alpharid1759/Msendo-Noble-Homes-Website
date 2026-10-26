// src/app/api/admin/media/finalize/route.ts
import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertPermission, PermissionError } from "@/lib/auth/staff";
import { publicMediaUrl } from "@/lib/env";
import { looksLikeMp4, processImage } from "@/lib/media-processing";
import { getPrivateSetting } from "@/lib/private-settings";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  rawPath: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpe?g|png|webp|avif|mp4)$/i),
  kind: z.enum(["image", "video", "poster", "blog-image"]),
  propertyId: z.uuid().optional(),
  mediaId: z.uuid().optional(),
  title: z.string().trim().max(160).optional(),
  caption: z.string().trim().max(300).optional(),
  altText: z.string().trim().max(300).optional(),
  description: z.string().trim().max(1000).optional(),
  durationSeconds: z.number().min(0).max(36000).optional(),
});

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  let staff;
  try {
    staff = await assertPermission("media.upload");
  } catch (e) {
    return fail(e instanceof PermissionError ? e.message : "Not allowed", 403);
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid upload details.");
  const body = parsed.data;

  if (!body.rawPath.startsWith(`${staff.userId}/`)) return fail("You can only finalise your own uploads.", 403);
  if (!(await checkRateLimit(`media-finalize:${staff.userId}`, 120, 600))) return fail("Too many uploads at once. Wait a few minutes.", 429);

  const service = createServiceSupabase();
  const userClient = await createServerSupabase();
  const limits = await getPrivateSetting("uploads");
  const removeRaw = () => service.storage.from("media-raw").remove([body.rawPath]);

  const { data: info, error: infoError } = await service.storage.from("media-raw").info(body.rawPath);
  if (infoError || !info) return fail("The uploaded file could not be found. Upload it again.");
  const size = Number(info.size ?? 0);

  if (body.kind === "image" || body.kind === "video") {
    if (!body.propertyId) {
      await removeRaw();
      return fail("Choose a property for this media.");
    }
    if (!staff.permissions.has("properties.edit")) {
      await removeRaw();
      return fail("Your role cannot add media to listings.", 403);
    }
    const { data: prop } = await userClient.from("properties").select("id").eq("id", body.propertyId).maybeSingle();
    if (!prop) {
      await removeRaw();
      return fail("Property not found or you cannot edit it.", 404);
    }
    const { count } = await service.from("property_media").select("media_id", { count: "exact", head: true }).eq("property_id", body.propertyId);
    if ((count ?? 0) >= limits.max_media_per_property) {
      await removeRaw();
      return fail(`This property already has the maximum of ${limits.max_media_per_property} media items.`);
    }
  }

  try {
    if (body.kind === "video") {
      if (size > limits.video_max_mb * 1024 * 1024) {
        await removeRaw();
        return fail(`Videos must be ${limits.video_max_mb} MB or smaller.`);
      }
      if (body.durationSeconds && body.durationSeconds > limits.video_max_seconds) {
        await removeRaw();
        return fail(`Videos must be ${Math.round(limits.video_max_seconds / 60)} minutes or shorter.`);
      }
      const { data: signed } = await service.storage.from("media-raw").createSignedUrl(body.rawPath, 60);
      if (!signed?.signedUrl) throw new Error("Could not read the uploaded video.");
      const head = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-63" }, cache: "no-store" });
      const header = new Uint8Array(await head.arrayBuffer());
      if (!looksLikeMp4(header)) {
        await removeRaw();
        return fail("This file is not a valid MP4 video. Export it as MP4 (H.264) and try again.");
      }

      const finalPath = `videos/${body.propertyId}/${randomUUID()}.mp4`;
      const { error: moveError } = await service.storage.from("media-raw").move(body.rawPath, finalPath, { destinationBucket: "public-media" });
      if (moveError) throw new Error("Could not store the video.");

      const { data: asset, error } = await service
        .from("media_assets")
        .insert({
          media_type: "video",
          status: "ready",
          bucket: "public-media",
          storage_path: finalPath,
          mime_type: "video/mp4",
          file_size: size,
          duration_seconds: body.durationSeconds ?? null,
          title: body.title ?? null,
          caption: body.caption ?? null,
          description: body.description ?? null,
          alt_text: body.altText ?? null,
          created_by: staff.userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { data: maxRow } = await service.from("property_media").select("sort_order").eq("property_id", body.propertyId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
      await service.from("property_media").insert({ property_id: body.propertyId, media_id: asset.id, sort_order: (maxRow?.sort_order ?? -1) + 1 });
      revalidateTag("media", { expire: 0 });
      revalidateTag("properties", { expire: 0 });
      return NextResponse.json({ ok: true, mediaId: asset.id, mediaType: "video", path: finalPath });
    }

    if (size > limits.image_max_mb * 1024 * 1024) {
      await removeRaw();
      return fail(`Images must be ${limits.image_max_mb} MB or smaller.`);
    }

    const { data: blob, error: dlError } = await service.storage.from("media-raw").download(body.rawPath);
    if (dlError || !blob) throw new Error("Could not read the uploaded image.");
    const buffer = Buffer.from(await blob.arrayBuffer());

    let processed;
    try {
      processed = await processImage(buffer, body.kind === "blog-image" ? [800, 1600, 2400] : undefined);
    } catch (e) {
      await removeRaw();
      return fail(e instanceof Error ? e.message : "This image could not be processed.");
    }

    const folder =
      body.kind === "blog-image" ? `blog/${new Date().toISOString().slice(0, 7)}` : body.kind === "poster" ? `posters/${body.mediaId ?? "misc"}` : `properties/${body.propertyId}`;
    const base = randomUUID();
    const variants: Record<string, string> = {};
    for (const v of processed.variants) {
      const path = `${folder}/${base}-${v.width}.webp`;
      const { error } = await service.storage.from("public-media").upload(path, v.buffer, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
      if (error) throw new Error("Could not store the processed image.");
      variants[String(v.width)] = path;
    }
    await removeRaw();

    if (body.kind === "poster") {
      if (!body.mediaId) return fail("Missing video reference for the poster.");
      const { error } = await userClient.from("media_assets").update({ poster_path: variants["1600"] ?? variants["800"] }).eq("id", body.mediaId);
      if (error) return fail("Could not attach the poster to this video.", 403);
      revalidateTag("media", { expire: 0 });
      return NextResponse.json({ ok: true, posterUrl: publicMediaUrl(variants["800"]) });
    }

    if (body.kind === "blog-image") {
      return NextResponse.json({ ok: true, url: publicMediaUrl(variants["2400"] ?? variants["1600"] ?? variants["800"]), variants });
    }

    const { data: asset, error } = await service
      .from("media_assets")
      .insert({
        media_type: "image",
        status: "ready",
        bucket: "public-media",
        storage_path: variants["1600"] ?? variants["800"],
        variants,
        mime_type: "image/webp",
        file_size: size,
        width: processed.width,
        height: processed.height,
        caption: body.caption ?? null,
        alt_text: body.altText ?? null,
        created_by: staff.userId,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { data: existing } = await service.from("property_media").select("sort_order, is_featured, media_assets!inner(media_type)").eq("property_id", body.propertyId).eq("media_assets.media_type", "image");
    const rows = (existing ?? []) as { sort_order: number; is_featured: boolean }[];
    const hasFeatured = rows.some((r) => r.is_featured);
    const nextOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), -1) + 1;
    await service.from("property_media").insert({ property_id: body.propertyId, media_id: asset.id, sort_order: nextOrder, is_featured: !hasFeatured });

    revalidateTag("media", { expire: 0 });
    revalidateTag("properties", { expire: 0 });
    return NextResponse.json({ ok: true, mediaId: asset.id, mediaType: "image", variants });
  } catch (e) {
    await removeRaw();
    return fail(e instanceof Error ? e.message : "Upload processing failed.", 500);
  }
}
