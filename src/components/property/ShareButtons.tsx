// src/components/property/ShareButtons.tsx
"use client";

import { Check, Link2, Printer, Share2 } from "lucide-react";
import { useState } from "react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { track } from "@/lib/analytics";

export function ShareButtons({ url, title, reference, showPrint = false }: { url: string; title: string; reference?: string; showPrint?: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = `${title}${reference ? ` (Ref ${reference})` : ""}`;

  const share = async () => {
    track("share_clicked", { property_reference: reference });
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return;
      }
    }
    await copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  const btn = "inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-3 text-sm font-semibold text-accent hover:bg-sand";

  return (
    <div className="flex flex-wrap gap-2 no-print">
      <button type="button" onClick={share} className={btn}>
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={btn} data-track="share_whatsapp" data-track-ref={reference}>
        <WhatsAppIcon className="h-4 w-4" />
        Send on WhatsApp
      </a>
      <button type="button" onClick={copy} className={btn}>
        {copied ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
      </button>
      {showPrint && (
        <button type="button" onClick={() => window.print()} className={btn}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print or save PDF
        </button>
      )}
    </div>
  );
}
