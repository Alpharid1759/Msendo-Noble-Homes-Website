// src/components/site/Header.tsx
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { getSettings } from "@/lib/settings";
import { Logo } from "./Logo";
import { DesktopNav, MobileNav } from "./Nav";

export async function Header() {
  const settings = await getSettings();
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 no-print sm:px-5">
      <div className="glass mx-auto flex h-[4.5rem] max-w-[86rem] items-center justify-between gap-4 rounded-[14px] px-4 shadow-[var(--shadow-lift)] sm:px-6">
        <Link href="/" className="shrink-0 rounded-sm" aria-label={`${settings.company.brand_name} home`}>
          <Logo tone="light" logoUrl={settings.brand.logo_white_url} />
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-2">
          <ButtonLink href="/list-your-property" variant="gold" size="sm" className="max-sm:hidden">
            List Your Property
          </ButtonLink>
          <MobileNav phone={settings.contact.phone} phoneDisplay={settings.contact.phone_display} />
        </div>
      </div>
    </header>
  );
}
