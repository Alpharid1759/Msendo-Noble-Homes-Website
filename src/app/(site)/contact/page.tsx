// src/app/(site)/contact/page.tsx
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { PageHeader } from "@/components/site/PageHeader";
import { mailtoUrl, telUrl } from "@/lib/contact-links";
import { getSettings } from "@/lib/settings";
import { enquiryCategoryValues } from "@/lib/validation/public-forms";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Call, WhatsApp, email or visit Msendo Noble Homes at Plot 833 Emmanuel Aguna, Jabi District, Abuja.",
  alternates: { canonical: "/contact" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ContactPage({ searchParams }: Props) {
  const sp = await searchParams;
  const settings = await getSettings();
  const { contact } = settings;
  const rawCategory = one(sp.category);
  const category = (enquiryCategoryValues as readonly string[]).includes(rawCategory ?? "")
    ? (rawCategory as (typeof enquiryCategoryValues)[number])
    : "general";
  const ref = one(sp.ref)?.toUpperCase().match(/^[A-Z0-9-]{3,20}$/)?.[0];
  const defaultMessage =
    category === "report_listing" && ref
      ? `I would like to report a problem with listing ${ref}: `
      : category === "verification_request" && ref
        ? `Please arrange verification of the title documents for ${ref}.`
        : undefined;

  const rows = [
    { icon: Phone, label: "Phone", value: contact.phone_display, href: telUrl(contact.phone), track: "phone_click" },
    { icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: contact.whatsapp_link, track: "whatsapp_click", external: true },
    { icon: Mail, label: "Email", value: contact.email, href: mailtoUrl(contact.email, "Enquiry from the website"), track: "email_click" },
    { icon: MapPin, label: "Office", value: `${contact.address_line}, ${contact.city}, ${contact.state}`, href: contact.maps_url, external: true },
  ];

  return (
    <>
      <PageHeader title="Contact us" crumbs={[{ label: "Contact us" }]} intro={<p>Call, WhatsApp, email, or send the form below. We aim to reply within one working day.</p>} />

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-8">
          <ul className="space-y-5">
            {rows.map(({ icon: Icon, label, value, href, track, external }) => (
              <li key={label} className="flex gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-navy-800 text-gold">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-slate">{label}</p>
                  <a
                    href={href}
                    data-track={track}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="break-words font-semibold text-navy-900 hover:underline"
                  >
                    {value}
                  </a>
                </div>
              </li>
            ))}
            <li className="flex gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-navy-800 text-gold">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-slate">Business hours</p>
                <p className="font-semibold text-navy-900">{contact.business_hours ?? "Call ahead to arrange a visit"}</p>
              </div>
            </li>
          </ul>

          <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-line bg-sand">
            <iframe
              title="Map showing the Msendo Noble Homes office in Jabi, Abuja"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${contact.address_line}, ${contact.city}, Nigeria`)}&z=15&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full"
            />
          </div>
        </aside>

        <section aria-labelledby="form-heading" className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-10">
          <h2 id="form-heading" className="display text-[2rem] text-navy-900">
            Send us a message
          </h2>
          <p className="mt-2 text-slate">Fields marked * are required. Give us a phone number or email so we can reply.</p>
          <div className="mt-8">
            <EnquiryForm defaultCategory={category} propertyReference={ref} showSubject defaultMessage={defaultMessage} sourcePath="/contact" />
          </div>
        </section>
      </div>
    </>
  );
}
