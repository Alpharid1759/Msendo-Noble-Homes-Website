// src/components/property/ContactActions.tsx
import { CalendarCheck, Mail, MessageSquareText, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { mailtoUrl, propertyWhatsAppMessage, telUrl, whatsappUrl } from "@/lib/contact-links";
import type { PublicProperty, SiteSettings } from "@/types/domain";

export function ContactActions({ property, settings, pageUrl }: { property: PublicProperty; settings: SiteSettings; pageUrl: string }) {
  const message = propertyWhatsAppMessage(settings.company.brand_name, property, pageUrl);
  const subject = `Enquiry about ${property.reference}: ${property.title}`;
  const body = `Hello ${settings.company.brand_name},\n\nI am interested in ${property.reference} (${property.title}).\n${pageUrl}\n\nPlease share more information and inspection availability.\n\nThank you.`;
  const row =
    "flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-[0.9375rem] font-semibold transition-colors";

  return (
    <div className="space-y-2.5">
      <a
        href={whatsappUrl(settings.contact.whatsapp_number, message)}
        target="_blank"
        rel="noopener noreferrer"
        data-track="whatsapp_click"
        data-track-ref={property.reference}
        className={`${row} bg-[#1f7a4d] text-white hover:bg-[#19663f]`}
      >
        <WhatsAppIcon className="h-5 w-5" />
        Chat on WhatsApp
      </a>
      {property.is_listed && (
        <a href="#inspection" data-track="inspection_cta_click" data-track-ref={property.reference} className={`${row} bg-navy-800 text-white hover:bg-navy-700`}>
          <CalendarCheck className="h-5 w-5" aria-hidden="true" />
          Book an inspection
        </a>
      )}
      <a href="#enquire" data-track="enquiry_cta_click" data-track-ref={property.reference} className={`${row} border border-navy-800 text-navy-800 hover:bg-navy-100`}>
        <MessageSquareText className="h-5 w-5" aria-hidden="true" />
        Enquire about this property
      </a>
      <div className="grid grid-cols-2 gap-2.5">
        <a href={telUrl(settings.contact.phone)} data-track="phone_click" data-track-ref={property.reference} className={`${row} border border-line bg-white text-navy-800 hover:bg-sand`}>
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call an agent
        </a>
        <a href={mailtoUrl(settings.contact.email, subject, body)} data-track="email_click" data-track-ref={property.reference} className={`${row} border border-line bg-white text-navy-800 hover:bg-sand`}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          Send an email
        </a>
      </div>
    </div>
  );
}
