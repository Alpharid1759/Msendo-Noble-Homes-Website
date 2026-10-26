// src/app/(site)/thank-you/page.tsx
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { TrackView } from "@/components/consent/TrackView";
import { ButtonLink } from "@/components/ui/Button";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const COPY = {
  enquiry: {
    title: "Your enquiry has been received",
    body: "A member of our team will contact you using the details you gave. We aim to reply within one working day.",
    event: "enquiry_submitted",
  },
  inspection: {
    title: "Your inspection request has been received",
    body: "This is not yet a confirmed appointment. We will call you to agree a time before you travel.",
    event: "inspection_requested",
  },
  listing: {
    title: "Thank you for submitting your property",
    body: "Our team will review the details and call you to discuss next steps. Nothing will be published until we have agreed it with you.",
    event: "listing_submitted",
  },
} as const;

export default async function ThankYouPage({ searchParams }: Props) {
  const sp = await searchParams;
  const type = (Array.isArray(sp.type) ? sp.type[0] : sp.type) as keyof typeof COPY | undefined;
  const copy = COPY[type && type in COPY ? type : "enquiry"];
  const ref = (Array.isArray(sp.ref) ? sp.ref[0] : sp.ref)?.toUpperCase().match(/^[A-Z0-9-]{3,20}$/)?.[0];
  const duplicate = sp.duplicate === "1";
  const settings = await getSettings();

  return (
    <div className="container-page flex min-h-[60vh] max-w-2xl flex-col items-center justify-center py-20 text-center">
      {!duplicate && <TrackView event={copy.event} params={{ property_reference: ref }} />}
      <CheckCircle2 className="h-14 w-14 text-success" aria-hidden="true" />
      <h1 className="display mt-6 text-[2.25rem] text-heading md:text-[2.75rem]">{copy.title}</h1>
      {ref && <p className="mt-2 font-semibold text-slate">Property reference {ref}</p>}
      <p className="mt-4 text-lg leading-relaxed text-slate">
        {duplicate ? "We already have this request from you today, so there is no need to send it again. " : ""}
        {copy.body}
      </p>
      <p className="mt-4 text-slate">
        Need us sooner? Call <a href={`tel:${settings.contact.phone}`} className="font-semibold text-accent underline">{settings.contact.phone_display}</a> or{" "}
        <a href={settings.contact.whatsapp_link} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">
          message us on WhatsApp
        </a>
        .
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/properties">Explore Properties</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
