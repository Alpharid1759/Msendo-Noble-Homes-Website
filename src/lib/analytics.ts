// src/lib/analytics.ts
"use client";

export const CONSENT_KEY = "mnh-consent";

export interface ConsentState {
  analytics: boolean;
  decidedAt: string;
  version: string;
}

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export function readConsent(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

export function writeConsent(state: ConsentState) {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent("mnh-consent-change", { detail: state }));
}

const SAFE_PARAM = /^[\w\s./:-]{0,100}$/;

export function track(event: string, params: Record<string, string | number | undefined> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (typeof v === "number" || SAFE_PARAM.test(v)) clean[k] = v;
  }
  window.gtag("event", event, clean);
}
