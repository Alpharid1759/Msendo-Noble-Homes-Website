// src/components/property/VideoPlayer.tsx
"use client";

import { Play, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { publicMediaUrl } from "@/lib/env";
import { formatDuration } from "@/lib/format";

export function VideoPlayer({
  src,
  poster,
  title,
  duration,
  propertyReference,
  className,
}: {
  src: string;
  poster: string | null;
  title: string;
  duration?: number | null;
  propertyReference?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = publicMediaUrl(src) ?? src;
  const posterUrl = publicMediaUrl(poster);
  const durationLabel = formatDuration(duration);

  return (
    <div className={`relative aspect-video overflow-hidden rounded-[var(--radius-card)] bg-navy-950 ${className ?? ""}`}>
      {state === "idle" ? (
        <button
          type="button"
          onClick={() => {
            setState("loading");
            track("property_video_played", { property_reference: propertyReference });
          }}
          className="group absolute inset-0 flex h-full w-full items-center justify-center"
        >
          {posterUrl ? (
            <img src={posterUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-br from-navy-800 to-navy-950" aria-hidden="true" />
          )}
          <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface/95 text-heading shadow-lg transition-transform group-hover:scale-105">
            <Play className="ml-1 h-7 w-7" aria-hidden="true" />
          </span>
          {durationLabel && (
            <span className="absolute bottom-3 right-3 rounded-[3px] bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">{durationLabel}</span>
          )}
          <span className="sr-only">Play video: {title}</span>
        </button>
      ) : state === "error" ? (
        <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <TriangleAlert className="h-8 w-8 text-gold" aria-hidden="true" />
          <p className="font-semibold">This video could not be played.</p>
          <p className="text-sm text-navy-200">Check your connection and try again, or ask us to send the video on WhatsApp.</p>
          <button type="button" onClick={() => setState("idle")} className="mt-1 rounded-[var(--radius-control)] border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10">
            Try again
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl ?? undefined}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="h-full w-full"
            aria-label={title}
            onPlaying={() => setState("playing")}
            onError={() => setState("error")}
            controlsList="nodownload"
          />
          {state === "loading" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
