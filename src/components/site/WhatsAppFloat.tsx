// src/components/site/WhatsAppFloat.tsx
import { WhatsAppIcon } from "@/components/ui/icons";

export function WhatsAppFloat({ link }: { link: string }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      data-track="whatsapp_click"
      data-track-location="floating_button"
      className="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1f7a4d] text-white shadow-[var(--shadow-lift)] transition-transform hover:scale-105 no-print"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="sr-only">Chat with us on WhatsApp</span>
    </a>
  );
}
