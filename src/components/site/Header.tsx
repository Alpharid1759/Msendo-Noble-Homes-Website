// src/components/site/Header.tsx
import Link from "next/link";
import { Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { telUrl } from "@/lib/contact-links";
import { getSettings } from "@/lib/settings";
import { Logo } from "./Logo";
import { DesktopNav, MobileNav } from "./Nav";

export async function Header() {
  const settings = await getSettings();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85 no-print">
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="shrink-0 rounded-sm" aria-label={`${settings.company.brand_name} home`}>
          <Logo logoUrl={settings.brand.logo_url} />
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-2">
          <a
            href={telUrl(settings.contact.phone)}
            className="hidden items-center gap-2 rounded-sm px-2 py-1 text-sm font-semibold text-navy-800 hover:text-navy-600 md:inline-flex xl:hidden 2xl:inline-flex"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {settings.contact.phone_display}
          </a>
          <ButtonLink href="/list-your-property" variant="primary" size="sm" className="hidden sm:inline-flex">
            List Your Property
          </ButtonLink>
          <MobileNav phone={settings.contact.phone} phoneDisplay={settings.contact.phone_display} />
        </div>
      </div>
    </header>
  );
}
