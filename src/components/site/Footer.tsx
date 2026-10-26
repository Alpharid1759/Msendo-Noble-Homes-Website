// src/components/site/Footer.tsx
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { mailtoUrl, telUrl } from "@/lib/contact-links";
import { getSettings } from "@/lib/settings";
import { Logo } from "./Logo";
import { FOOTER_LINKS } from "./nav-items";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export async function Footer() {
  const settings = await getSettings();
  const { contact, company } = settings;
  const socials = Object.entries(settings.social).filter(([, url]) => Boolean(url)) as [string, string][];
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark bg-navy-900 text-navy-100 no-print">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tone="light" logoUrl={settings.brand.logo_white_url} />
          <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-navy-200">{company.short_description}</p>
          <ul className="mt-6 space-y-3 text-[0.9375rem]">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <a href={contact.maps_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {contact.address_line}, {contact.city}
              </a>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <a href={telUrl(contact.phone)} className="hover:text-white">
                {contact.phone_display}
              </a>
            </li>
            <li className="flex gap-3">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <a href={contact.whatsapp_link} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Chat on WhatsApp
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <a href={mailtoUrl(contact.email)} className="break-all hover:text-white">
                {contact.email}
              </a>
            </li>
          </ul>
          {contact.business_hours && <p className="mt-4 text-sm text-navy-200">{contact.business_hours}</p>}
        </div>

        <nav aria-label="Explore" className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {FOOTER_LINKS.explore.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-navy-200 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company" className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Company</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {FOOTER_LINKS.company.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-navy-200 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <h2 className="text-sm font-semibold text-white">Property insights by email</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy-200">
            New listings and practical guidance on buying, renting and investing in Abuja. No more than twice a month.
          </p>
          <div className="mt-4">
            <NewsletterForm tone="dark" />
          </div>
          {socials.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Social media">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-navy-200 hover:text-white">
                    {SOCIAL_LABELS[key] ?? key}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-xs text-navy-200 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {company.legal_name}. {company.brand_name} is the real estate division of {company.legal_name}.
            {company.rc_number ? ` RC ${company.rc_number}.` : ""}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {FOOTER_LINKS.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
