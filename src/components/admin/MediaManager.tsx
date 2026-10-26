// src/components/admin/MediaManager.tsx
"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, Film, GripVertical, ImageIcon, RotateCcw, Star, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { linkExistingMedia, removeMedia, reorderMedia, setFeaturedMedia, updateMediaMeta } from "@/app/actions/media";
import { publicMediaUrl } from "@/lib/env";
import { formatDuration } from "@/lib/format";
import { variantUrl } from "@/lib/media";
import {
  capturePosterFrame,
  finalizeUpload,
  IMAGE_TYPES,
  readVideoMetadata,
  startResumableUpload,
  VIDEO_TYPES,
  type UploadHandle,
} from "@/lib/upload-client";
import type { ImageVariants } from "@/types/domain";
import { adminBtnGhost, adminBtnPrimary, adminBtnSecondary } from "./ui";

export interface AdminMedia {
  id: string;
  media_type: "image" | "video";
  status: string;
  storage_path: string;
  variants: ImageVariants;
  poster_path: string | null;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  description: string | null;
  duration_seconds: number | null;
  is_published: boolean;
  sort_order: number;
  is_featured: boolean;
}

interface Limits {
  image_max_mb: number;
  video_max_mb: number;
  video_max_seconds: number;
}

type QueueStatus = "staged" | "uploading" | "processing" | "done" | "error" | "cancelled";

interface QueueItem {
  key: string;
  file: File;
  kind: "image" | "video";
  preview: string | null;
  status: QueueStatus;
  progress: number;
  error?: string;
  altText: string;
  caption: string;
  title: string;
  duration?: number;
}

function validate(file: File, limits: Limits): string | null {
  if (IMAGE_TYPES.includes(file.type)) {
    if (file.size > limits.image_max_mb * 1024 * 1024) return `Larger than ${limits.image_max_mb} MB`;
    return null;
  }
  if (VIDEO_TYPES.includes(file.type)) {
    if (file.size > limits.video_max_mb * 1024 * 1024) return `Larger than ${limits.video_max_mb} MB`;
    return null;
  }
  return "Only JPEG, PNG, WebP, AVIF photos and MP4 videos are accepted";
}

export function MediaManager({
  propertyId,
  propertyTitle,
  isLive,
  media,
  limits,
  canDelete,
  linkableVideos,
}: {
  propertyId: string;
  propertyTitle: string;
  isLive: boolean;
  media: AdminMedia[];
  limits: Limits;
  canDelete: boolean;
  linkableVideos: { id: string; title: string | null; caption: string | null }[];
}) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const handles = useRef<Map<string, UploadHandle>>(new Map());
  const inputId = useId();

  useEffect(() => {
    const current = handles.current;
    return () => {
      current.forEach((h) => h.abort());
    };
  }, []);

  const patch = (key: string, p: Partial<QueueItem>) => setQueue((q) => q.map((i) => (i.key === key ? { ...i, ...p } : i)));

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      const items: QueueItem[] = [];
      for (const file of list) {
        const error = validate(file, limits);
        const kind = file.type.startsWith("video/") ? "video" : "image";
        const item: QueueItem = {
          key: crypto.randomUUID(),
          file,
          kind,
          preview: kind === "image" && !error ? URL.createObjectURL(file) : null,
          status: error ? "error" : "staged",
          progress: 0,
          error: error ?? undefined,
          altText: "",
          caption: "",
          title: kind === "video" ? file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") : "",
        };
        if (kind === "video" && !error) {
          try {
            const meta = await readVideoMetadata(file);
            item.duration = meta.duration;
            if (meta.duration > limits.video_max_seconds) {
              item.status = "error";
              item.error = `Longer than ${Math.round(limits.video_max_seconds / 60)} minutes`;
            }
          } catch (e) {
            item.status = "error";
            item.error = e instanceof Error ? e.message : "Unreadable video";
          }
        }
        items.push(item);
      }
      setQueue((q) => [...q, ...items]);
    },
    [limits],
  );

  const uploadOne = async (item: QueueItem) => {
    patch(item.key, { status: "uploading", progress: 0, error: undefined });
    try {
      const handle = await startResumableUpload(item.file, (f) => patch(item.key, { progress: f }));
      handles.current.set(item.key, handle);
      const rawPath = await handle.promise;
      handles.current.delete(item.key);
      patch(item.key, { status: "processing", progress: 1 });
      const result = await finalizeUpload({
        rawPath,
        kind: item.kind,
        propertyId,
        title: item.title || undefined,
        caption: item.caption || undefined,
        altText: item.altText || (item.kind === "image" ? propertyTitle : undefined),
        durationSeconds: item.duration ? Math.round(item.duration) : undefined,
      });
      if (item.kind === "video" && result.mediaId) {
        const poster = await capturePosterFrame(item.file);
        if (poster) {
          try {
            const posterHandle = await startResumableUpload(poster, () => undefined);
            const posterPath = await posterHandle.promise;
            await finalizeUpload({ rawPath: posterPath, kind: "poster", mediaId: result.mediaId });
          } catch {
            setMessage({ tone: "error", text: "Video uploaded, but the poster image could not be generated. Upload one manually." });
          }
        }
      }
      patch(item.key, { status: "done" });
    } catch (e) {
      handles.current.delete(item.key);
      const msg = e instanceof Error ? e.message : "Upload failed";
      setQueue((q) => q.map((i) => (i.key === item.key ? (i.status === "cancelled" ? i : { ...i, status: "error", error: msg }) : i)));
    }
  };

  const uploadAll = async () => {
    const pending = queue.filter((q) => q.status === "staged" || (q.status === "error" && !validate(q.file, limits) && q.error?.startsWith("The upload")));
    const images = pending.filter((p) => p.kind === "image");
    const videos = pending.filter((p) => p.kind === "video");
    const runPool = async (items: QueueItem[], size: number) => {
      const copy = [...items];
      await Promise.all(
        Array.from({ length: Math.min(size, copy.length) }).map(async () => {
          while (copy.length) {
            const next = copy.shift();
            if (next) await uploadOne(next);
          }
        }),
      );
    };
    await runPool(images, 3);
    await runPool(videos, 1);
    router.refresh();
  };

  const cancel = (key: string) => {
    handles.current.get(key)?.abort();
    handles.current.delete(key);
    patch(key, { status: "cancelled" });
  };

  const removeFromQueue = (key: string) => {
    setQueue((q) => {
      const item = q.find((i) => i.key === key);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return q.filter((i) => i.key !== key);
    });
  };

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const r = await fn();
      setMessage({ tone: r.ok ? "success" : "error", text: r.message });
      if (r.ok) router.refresh();
    });

  const images = media.filter((m) => m.media_type === "image").sort((a, b) => a.sort_order - b.sort_order);
  const videos = media.filter((m) => m.media_type === "video").sort((a, b) => a.sort_order - b.sort_order);
  const staged = queue.filter((q) => q.status === "staged").length;
  const activeUploads = queue.some((q) => q.status === "uploading" || q.status === "processing");

  return (
    <div className="space-y-6">
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={clsx("rounded-[var(--radius-control)] px-4 py-2.5 text-sm", message.tone === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success")}>
          {message.text}
        </p>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
        }}
        className={clsx(
          "flex flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-navy-700 bg-navy-100" : "border-navy-200 bg-ivory",
        )}
      >
        <Upload className="h-8 w-8 text-navy-600" aria-hidden="true" />
        <p className="mt-3 font-semibold">Drag photos and videos here</p>
        <p className="mt-1 text-sm text-slate">
          JPEG, PNG, WebP or AVIF up to {limits.image_max_mb} MB. MP4 video up to {limits.video_max_mb} MB and {Math.round(limits.video_max_seconds / 60)} minutes.
        </p>
        <label htmlFor={inputId} className={`${adminBtnSecondary} mt-4 cursor-pointer`}>
          Browse files
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h3 className="font-semibold">Upload queue</h3>
            <div className="flex gap-2">
              <button type="button" className={adminBtnGhost} onClick={() => setQueue((q) => q.filter((i) => i.status === "uploading" || i.status === "processing"))} disabled={activeUploads}>
                Clear
              </button>
              <button type="button" className={adminBtnPrimary} onClick={uploadAll} disabled={staged === 0 || activeUploads}>
                Upload {staged} {staged === 1 ? "file" : "files"}
              </button>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {queue.map((q) => (
              <li key={q.key} className="grid gap-3 p-4 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-start">
                <div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-[3px] bg-sand">
                  {q.preview ? <img src={q.preview} alt="" className="h-full w-full object-cover" /> : <Film className="h-6 w-6 text-slate" aria-hidden="true" />}
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="truncate text-sm font-semibold">
                    {q.file.name} <span className="font-normal text-slate">({(q.file.size / 1024 / 1024).toFixed(1)} MB{q.duration ? `, ${formatDuration(q.duration)}` : ""})</span>
                  </p>
                  {q.status === "staged" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.kind === "video" ? (
                        <input aria-label="Video title" placeholder="Video title" value={q.title} onChange={(e) => patch(q.key, { title: e.target.value })} className="field-input min-h-9 py-1.5 text-sm" />
                      ) : (
                        <input aria-label="Alt text" placeholder="Alt text: what the photo shows" value={q.altText} onChange={(e) => patch(q.key, { altText: e.target.value })} className="field-input min-h-9 py-1.5 text-sm" />
                      )}
                      <input aria-label="Caption" placeholder="Caption (optional)" value={q.caption} onChange={(e) => patch(q.key, { caption: e.target.value })} className="field-input min-h-9 py-1.5 text-sm" />
                    </div>
                  )}
                  {(q.status === "uploading" || q.status === "processing") && (
                    <div>
                      <div className="h-2 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(q.progress * 100)} aria-label={`Uploading ${q.file.name}`}>
                        <div className="h-full bg-navy-700 transition-[width]" style={{ width: `${Math.round(q.progress * 100)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate">{q.status === "processing" ? "Processing on the server" : `${Math.round(q.progress * 100)}% uploaded`}</p>
                    </div>
                  )}
                  {q.status === "done" && <p className="text-sm font-semibold text-success">Uploaded</p>}
                  {q.status === "cancelled" && <p className="text-sm text-slate">Cancelled</p>}
                  {q.status === "error" && (
                    <p className="text-sm text-danger" role="alert">
                      {q.error}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {(q.status === "uploading" || q.status === "processing") && (
                    <button type="button" onClick={() => cancel(q.key)} className={adminBtnGhost} disabled={q.status === "processing"}>
                      Cancel
                    </button>
                  )}
                  {(q.status === "error" || q.status === "cancelled") && !validate(q.file, limits) && !q.error?.startsWith("Longer") && (
                    <button type="button" onClick={() => uploadOne(q).then(() => router.refresh())} className={adminBtnGhost}>
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Retry
                    </button>
                  )}
                  {q.status !== "uploading" && q.status !== "processing" && (
                    <button type="button" onClick={() => removeFromQueue(q.key)} className={adminBtnGhost} aria-label={`Remove ${q.file.name} from queue`}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <MediaList
        title={`Photos (${images.length})`}
        items={images}
        propertyId={propertyId}
        isLive={isLive}
        canDelete={canDelete}
        busy={busy}
        run={run}
        empty="No photos yet. Listings with at least five clear photos get more enquiries."
      />
      <MediaList
        title={`Videos (${videos.length})`}
        items={videos}
        propertyId={propertyId}
        isLive={isLive}
        canDelete={canDelete}
        busy={busy}
        run={run}
        empty="No videos yet."
        onPosterSelected={async (mediaId, file) => {
          try {
            const h = await startResumableUpload(file, () => undefined);
            const raw = await h.promise;
            await finalizeUpload({ rawPath: raw, kind: "poster", mediaId });
            setMessage({ tone: "success", text: "Poster updated." });
            router.refresh();
          } catch (e) {
            setMessage({ tone: "error", text: e instanceof Error ? e.message : "Poster upload failed." });
          }
        }}
      />

      {linkableVideos.length > 0 && (
        <form
          className="flex flex-wrap items-end gap-2 rounded-[var(--radius-card)] border border-line bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const id = new FormData(e.currentTarget).get("media") as string;
            if (id) run(() => linkExistingMedia(propertyId, id));
          }}
        >
          <div className="min-w-64 flex-1">
            <label htmlFor="link-video" className="field-label">
              Add a video already uploaded for another listing
            </label>
            <select id="link-video" name="media" className="field-input" defaultValue="">
              <option value="">Choose a video</option>
              {linkableVideos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title || v.caption || v.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={adminBtnSecondary} disabled={busy}>
            Link video
          </button>
        </form>
      )}
    </div>
  );
}

function MediaList({
  title,
  items,
  propertyId,
  isLive,
  canDelete,
  busy,
  run,
  empty,
  onPosterSelected,
}: {
  title: string;
  items: AdminMedia[];
  propertyId: string;
  isLive: boolean;
  canDelete: boolean;
  busy: boolean;
  run: (fn: () => Promise<{ ok: boolean; message: string }>) => void;
  empty: string;
  onPosterSelected?: (mediaId: string, file: File) => void;
}) {
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const itemKey = items.map((i) => `${i.id}:${i.sort_order}`).join(",");
  const [syncedKey, setSyncedKey] = useState(itemKey);
  if (syncedKey !== itemKey) {
    setSyncedKey(itemKey);
    setOrder(items.map((i) => i.id));
  }

  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean) as AdminMedia[];

  const move = (id: string, delta: number) => {
    const idx = order.indexOf(id);
    const target = idx + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
    run(() => reorderMedia(propertyId, next));
  };

  return (
    <section>
      <h3 className="mb-3 font-semibold">{title}</h3>
      {ordered.length === 0 ? (
        <p className="text-sm text-slate">{empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((m, i) => {
            const thumb = m.media_type === "image" ? variantUrl(m.variants, 400) : publicMediaUrl(m.poster_path);
            return (
              <li
                key={m.id}
                draggable
                onDragStart={() => setDragging(m.id)}
                onDragEnd={() => setDragging(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragging || dragging === m.id) return;
                  const next = order.filter((id) => id !== dragging);
                  next.splice(next.indexOf(m.id), 0, dragging);
                  setOrder(next);
                  run(() => reorderMedia(propertyId, next));
                }}
                className={clsx("rounded-[var(--radius-card)] border bg-white", dragging === m.id ? "border-navy-700 opacity-60" : "border-line")}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-card)] bg-sand">
                  {thumb ? <img src={thumb} alt={m.alt_text ?? ""} className="h-full w-full object-cover" loading="lazy" /> : (
                    <div className="flex h-full items-center justify-center text-slate">
                      {m.media_type === "video" ? <Film className="h-8 w-8" aria-hidden="true" /> : <ImageIcon className="h-8 w-8" aria-hidden="true" />}
                    </div>
                  )}
                  <span className="absolute left-2 top-2 inline-flex cursor-grab items-center rounded-[3px] bg-white/90 p-1 text-slate" aria-hidden="true">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <div className="absolute right-2 top-2 flex gap-1">
                    {m.is_featured && <span className="rounded-[3px] bg-gold px-1.5 py-0.5 text-xs font-semibold text-navy-900">Main photo</span>}
                    {!m.is_published && <span className="rounded-[3px] bg-navy-900 px-1.5 py-0.5 text-xs font-semibold text-white">Hidden</span>}
                    {m.duration_seconds ? <span className="rounded-[3px] bg-black/70 px-1.5 py-0.5 text-xs text-white">{formatDuration(m.duration_seconds)}</span> : null}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm">{m.title || m.caption || m.alt_text || <span className="text-slate">No caption</span>}</p>
                  <div className="flex flex-wrap gap-1">
                    <button type="button" className={`${adminBtnGhost} min-h-8 px-2`} onClick={() => move(m.id, -1)} disabled={i === 0 || busy} aria-label="Move earlier">
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" className={`${adminBtnGhost} min-h-8 px-2`} onClick={() => move(m.id, 1)} disabled={i === ordered.length - 1 || busy} aria-label="Move later">
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {m.media_type === "image" && !m.is_featured && (
                      <button type="button" className={`${adminBtnGhost} min-h-8 px-2`} onClick={() => run(() => setFeaturedMedia(propertyId, m.id))} disabled={busy}>
                        <Star className="h-4 w-4" aria-hidden="true" />
                        Main photo
                      </button>
                    )}
                    <button type="button" className={`${adminBtnGhost} min-h-8 px-2`} onClick={() => setEditing(editing === m.id ? null : m.id)} aria-expanded={editing === m.id}>
                      Edit details
                    </button>
                    <button
                      type="button"
                      className={`${adminBtnGhost} min-h-8 px-2 text-danger`}
                      disabled={busy}
                      onClick={() => {
                        const permanent = canDelete && window.confirm("Delete this file permanently? Press Cancel to only remove it from this listing.");
                        if (!permanent && !window.confirm(isLive ? "This listing is live. Remove this item from the public page?" : "Remove this item from the listing?")) return;
                        if (permanent && isLive && !window.confirm("This listing is live and visitors will stop seeing this file. Delete permanently?")) return;
                        run(() => removeMedia(propertyId, m.id, permanent));
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                  {editing === m.id && (
                    <MediaMetaForm
                      media={m}
                      onSave={(meta) => {
                        run(() => updateMediaMeta(m.id, meta));
                        setEditing(null);
                      }}
                      onPosterSelected={onPosterSelected}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MediaMetaForm({
  media,
  onSave,
  onPosterSelected,
}: {
  media: AdminMedia;
  onSave: (meta: { title: string | null; caption: string | null; alt_text: string | null; description: string | null; is_published: boolean }) => void;
  onPosterSelected?: (mediaId: string, file: File) => void;
}) {
  const id = useId();
  return (
    <form
      className="space-y-2 border-t border-line pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const val = (k: string) => {
          const v = String(f.get(k) ?? "").trim();
          return v || null;
        };
        onSave({ title: val("title"), caption: val("caption"), alt_text: val("alt_text"), description: val("description"), is_published: f.get("is_published") === "on" });
      }}
    >
      {media.media_type === "video" && (
        <div>
          <label htmlFor={`${id}-title`} className="text-xs font-semibold">
            Title
          </label>
          <input id={`${id}-title`} name="title" defaultValue={media.title ?? ""} maxLength={160} className="field-input min-h-9 py-1.5 text-sm" />
        </div>
      )}
      <div>
        <label htmlFor={`${id}-alt`} className="text-xs font-semibold">
          {media.media_type === "image" ? "Alt text (describe the photo)" : "Accessible description"}
        </label>
        <input id={`${id}-alt`} name="alt_text" defaultValue={media.alt_text ?? ""} maxLength={300} className="field-input min-h-9 py-1.5 text-sm" />
      </div>
      <div>
        <label htmlFor={`${id}-cap`} className="text-xs font-semibold">
          Caption
        </label>
        <input id={`${id}-cap`} name="caption" defaultValue={media.caption ?? ""} maxLength={300} className="field-input min-h-9 py-1.5 text-sm" />
      </div>
      {media.media_type === "video" && (
        <>
          <div>
            <label htmlFor={`${id}-desc`} className="text-xs font-semibold">
              Description or transcript
            </label>
            <textarea id={`${id}-desc`} name="description" defaultValue={media.description ?? ""} rows={3} maxLength={1000} className="field-input text-sm" />
          </div>
          {onPosterSelected && (
            <div>
              <label htmlFor={`${id}-poster`} className="text-xs font-semibold">
                Replace poster image
              </label>
              <input
                id={`${id}-poster`}
                type="file"
                accept={IMAGE_TYPES.join(",")}
                className="block w-full text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPosterSelected(media.id, file);
                }}
              />
            </div>
          )}
        </>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_published" defaultChecked={media.is_published} className="h-4 w-4 accent-navy-800" />
        Show on the public website
      </label>
      <button type="submit" className={`${adminBtnPrimary} min-h-9`}>
        Save details
      </button>
    </form>
  );
}
