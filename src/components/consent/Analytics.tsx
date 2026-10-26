// src/components/consent/Analytics.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import { CONSENT_KEY, track, writeConsent, type ConsentState } from "@/lib/analytics";

const SERVER = "__server__";

function subscribe(cb: () => void) {
  window.addEventListener("mnh-consent-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("mnh-consent-change", cb);
    window.removeEventListener("storage", cb);
  };
}

function snapshot() {
  try {
    return window.localStorage.getItem(CONSENT_KEY) ?? "";
  } catch {
    return "";
  }
}

function parseConsent(raw: string, version: string): ConsentState | null | undefined {
  if (raw === SERVER) return undefined;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentState;
    return parsed.version === version ? parsed : null;
  } catch {
    return null;
  }
}

export function Analytics({
  measurementId,
  requireConsent,
  consentVersion,
}: {
  measurementId: string | null;
  requireConsent: boolean;
  consentVersion: string;
}) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  const consent = parseConsent(raw, consentVersion);
  const pathname = usePathname();

  const allowed = Boolean(measurementId) && (!requireConsent || consent?.analytics === true);

  useEffect(() => {
    if (!allowed) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      track(el.dataset.track as string, {
        property_reference: el.dataset.trackRef,
        location: el.dataset.trackLocation ?? pathname,
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [allowed, pathname]);

  const decide = (analytics: boolean) => {
    writeConsent({ analytics, decidedAt: new Date().toISOString(), version: consentVersion });
  };

  const showBanner = Boolean(measurementId) && requireConsent && consent === null;

  return (
    <>
      {allowed && measurementId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false});`}
          </Script>
        </>
      )}
      {showBanner && (
        <div
          role="region"
          aria-label="Cookie preferences"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-lift)] no-print sm:inset-x-6"
        >
          <p className="text-sm leading-relaxed text-charcoal">
            We use essential cookies to run this site. With your permission we also use analytics cookies to understand which
            pages and listings are useful. We never send your contact details to analytics providers.{" "}
            <Link href="/legal/cookies" className="font-semibold text-accent underline underline-offset-2">
              Cookie policy
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide(true)}
              className="min-h-11 rounded-[var(--radius-control)] bg-navy-800 px-5 text-sm font-semibold text-white hover:bg-navy-700"
            >
              Allow analytics
            </button>
            <button
              type="button"
              onClick={() => decide(false)}
              className="min-h-11 rounded-[var(--radius-control)] border border-accent px-5 text-sm font-semibold text-accent hover:bg-sand"
            >
              Essential only
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      className="font-semibold text-accent underline underline-offset-2"
      onClick={() => {
        try {
          window.localStorage.removeItem("mnh-consent");
        } catch {
          return;
        }
        window.dispatchEvent(new CustomEvent("mnh-consent-change", { detail: null }));
      }}
    >
      Change cookie preferences
    </button>
  );
}
