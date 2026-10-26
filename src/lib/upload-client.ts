// src/lib/upload-client.ts
"use client";

import * as tus from "tus-js-client";
import { publicEnv } from "@/lib/env";
import { getBrowserSupabase } from "@/lib/supabase/client";

export type FinalizeKind = "image" | "video" | "poster" | "blog-image";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const VIDEO_TYPES = ["video/mp4"];

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
};

function resumableEndpoint() {
  const url = new URL(publicEnv.supabaseUrl);
  if (url.hostname.endsWith(".supabase.co") && !url.hostname.includes(".storage.")) {
    url.hostname = url.hostname.replace(".supabase.co", ".storage.supabase.co");
  }
  return `${url.origin}/storage/v1/upload/resumable`;
}

export interface UploadHandle {
  promise: Promise<string>;
  abort: () => void;
}

export async function startResumableUpload(file: File, onProgress: (fraction: number) => void): Promise<UploadHandle> {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) throw new Error("Your session has expired. Sign in again.");
  const ext = EXT[file.type];
  if (!ext) throw new Error("Unsupported file type.");
  const objectName = `${session.user.id}/${crypto.randomUUID()}.${ext}`;

  let upload: tus.Upload | null = null;
  const promise = new Promise<string>((resolve, reject) => {
    upload = new tus.Upload(file, {
      endpoint: resumableEndpoint(),
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: publicEnv.supabaseAnonKey,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: "media-raw",
        objectName,
        contentType: file.type,
        cacheControl: "3600",
      },
      onError: (err) => {
        const msg = String(err?.message ?? err);
        if (/413|too large|exceeded/i.test(msg)) reject(new Error("This file is larger than the storage limit allows."));
        else if (/403|unauthorized|row-level/i.test(msg)) reject(new Error("You do not have permission to upload. Sign in again."));
        else reject(new Error("The upload was interrupted. Check your connection and press Retry."));
      },
      onProgress: (sent, total) => onProgress(total ? sent / total : 0),
      onSuccess: () => resolve(objectName),
    });
    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload?.resumeFromPreviousUpload(previous[0]);
      upload?.start();
    });
  });

  return {
    promise,
    abort: () => {
      void upload?.abort(true);
    },
  };
}

export async function finalizeUpload(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/media/finalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({ ok: false, message: "Unexpected server response." }))) as {
    ok: boolean;
    message?: string;
    mediaId?: string;
    url?: string;
    posterUrl?: string;
  };
  if (!res.ok || !json.ok) throw new Error(json.message ?? "Upload processing failed.");
  return json;
}

export function readVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This video could not be read. Use an MP4 file encoded with H.264."));
    };
    video.src = url;
  });
}

export function capturePosterFrame(file: File, atSeconds = 1.5): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const done = (f: File | null) => {
      URL.revokeObjectURL(url);
      resolve(f);
    };
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(atSeconds, Math.max(0, video.duration / 3));
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1600 / (video.videoWidth || 1600));
        canvas.width = Math.round((video.videoWidth || 1280) * scale);
        canvas.height = Math.round((video.videoHeight || 720) * scale);
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => done(blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null), "image/jpeg", 0.85);
      } catch {
        done(null);
      }
    };
    video.onerror = () => done(null);
    window.setTimeout(() => done(null), 15000);
    video.src = url;
  });
}
