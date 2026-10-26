// src/app/(site)/layout.tsx
import { Analytics } from "@/components/consent/Analytics";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="site-dark min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-sm focus:bg-navy-800 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <Footer />
      <WhatsAppFloat link={settings.contact.whatsapp_link} />
      <Analytics
        measurementId={settings.analytics.ga_measurement_id}
        requireConsent={settings.analytics.require_consent}
        consentVersion={settings.privacy.consent_version}
      />
    </div>
  );
}
