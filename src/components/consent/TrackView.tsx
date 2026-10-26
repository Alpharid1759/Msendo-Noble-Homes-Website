// src/components/consent/TrackView.tsx
"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function TrackView({ event, params }: { event: string; params?: Record<string, string | number | undefined> }) {
  const key = JSON.stringify(params ?? {});
  useEffect(() => {
    const t = window.setTimeout(() => track(event, JSON.parse(key)), 800);
    return () => window.clearTimeout(t);
  }, [event, key]);
  return null;
}
