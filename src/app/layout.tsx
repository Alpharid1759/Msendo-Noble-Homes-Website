// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { publicEnv } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const manrope = localFont({
  src: "../fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

const newsreader = localFont({
  src: [
    { path: "../fonts/newsreader-latin-opsz-normal.woff2", style: "normal" },
    { path: "../fonts/newsreader-latin-opsz-italic.woff2", style: "italic" },
  ],
  variable: "--font-newsreader",
  weight: "200 800",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: settings.seo.default_title,
      template: `%s | ${settings.company.brand_name}`,
    },
    description: settings.seo.default_description,
    applicationName: settings.company.brand_name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_NG",
      siteName: settings.company.brand_name,
      title: settings.seo.default_title,
      description: settings.seo.default_description,
      images: settings.seo.og_image_url ? [settings.seo.og_image_url] : ["/opengraph-image"],
    },
    twitter: { card: "summary_large_image" },
    verification: settings.seo.google_site_verification
      ? { google: settings.seo.google_site_verification }
      : undefined,
    formatDetection: { telephone: true, email: true, address: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#0e1210",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${manrope.variable} ${newsreader.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
