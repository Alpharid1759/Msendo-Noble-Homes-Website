// src/app/admin/(panel)/properties/[id]/preview/page.tsx
import { MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminBtnSecondary, Notice } from "@/components/admin/ui";
import { StatusBadge, TransactionBadge } from "@/components/property/Badges";
import { PhotoGallery } from "@/components/property/PhotoGallery";
import { Price } from "@/components/property/Price";
import { PropertySpecs } from "@/components/property/PropertyCard";
import { VideoPlayer } from "@/components/property/VideoPlayer";
import { requirePermission } from "@/lib/auth/staff";
import { BILLING_SUFFIX, CHARGE_LABEL, formatMoney } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { BillingFrequency, ChargeType, ImageVariants } from "@/types/domain";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Preview property" };

export default async function PreviewPropertyPage({ params }: Props) {
  await requirePermission("properties.view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createServerSupabase();
  const [{ data: p }, { data: mediaRows }, { data: charges }] = await Promise.all([
    supabase.from("properties").select("*, property_categories(name), locations(name)").eq("id", id).maybeSingle(),
    supabase
      .from("property_media")
      .select("sort_order, is_featured, media_assets(id, media_type, storage_path, variants, poster_path, title, caption, alt_text, duration_seconds, is_published, status)")
      .eq("property_id", id)
      .order("is_featured", { ascending: false })
      .order("sort_order"),
    supabase.from("property_charges").select("*").eq("property_id", id).order("sort_order"),
  ]);
  if (!p) notFound();

  type M = { id: string; media_type: string; storage_path: string; variants: ImageVariants; poster_path: string | null; title: string | null; caption: string | null; alt_text: string | null; duration_seconds: number | null; is_published: boolean; status: string };
  const media = ((mediaRows ?? []) as unknown as { media_assets: M }[]).map((r) => r.media_assets).filter((m) => m && m.status === "ready" && m.is_published);
  const images = media.filter((m) => m.media_type === "image").map((m) => ({ id: m.id, variants: m.variants, alt: m.alt_text || p.title, caption: m.caption }));
  const videos = media.filter((m) => m.media_type === "video");
  const isSale = p.transaction_type === "sale";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Notice tone="warning">Preview only. This is how the listing will look; visitors cannot see it until it is published.</Notice>
        <Link href={`/admin/properties/${id}`} className={adminBtnSecondary}>
          Back to editing
        </Link>
      </div>
      <div className="rounded-[var(--radius-card)] border border-line bg-ivory p-6 md:p-8">
        <div className="flex flex-wrap gap-1.5">
          <TransactionBadge type={p.transaction_type} />
          <StatusBadge status={p.status} />
        </div>
        <h1 className="display mt-3 text-[2.25rem] text-navy-900">{p.title}</h1>
        <p className="mt-2 inline-flex items-center gap-1.5 text-slate">
          <MapPin className="h-4 w-4 text-gold-ink" aria-hidden="true" />
          {p.show_exact_address && p.address_line ? `${p.address_line}, ` : ""}
          {[p.district_name, p.city_name].filter(Boolean).join(", ")}
        </p>
        <Price className="mt-3" size="lg" price={p.price} price_on_request={p.price_on_request} currency={p.currency} billing_frequency={p.billing_frequency} />
        <div className="mt-6">
          <PhotoGallery images={images} title={p.title} />
        </div>
        <PropertySpecs p={p} className="mt-6 text-base" />
        <div className="mt-6 space-y-4 leading-relaxed">
          {String(p.description ?? "")
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((para: string, i: number) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
        </div>
        {videos.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {videos.map((v) => (
              <VideoPlayer key={v.id} src={v.storage_path} poster={v.poster_path} title={v.title || p.title} duration={v.duration_seconds} />
            ))}
          </div>
        )}
        <table className="mt-8 w-full text-left text-sm">
          <tbody>
            <tr className="border-t border-line">
              <th className="py-2">{isSale ? "Asking price" : "Rent"}</th>
              <td className="py-2 text-right">
                {p.price_on_request ? "On request" : `${formatMoney(p.price, p.currency)} ${BILLING_SUFFIX[p.billing_frequency as BillingFrequency]}`}
              </td>
            </tr>
            {((charges ?? []) as { id: string; label: string; charge_type: ChargeType; amount: number | null; is_percentage: boolean; billing_frequency: BillingFrequency }[]).map((c) => (
              <tr key={c.id} className="border-t border-line">
                <th className="py-2 font-normal">{c.label || CHARGE_LABEL[c.charge_type]}</th>
                <td className="py-2 text-right">{c.amount === null ? "To be confirmed" : c.is_percentage ? `${c.amount}%` : `${formatMoney(c.amount, p.currency)} ${BILLING_SUFFIX[c.billing_frequency]}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {p.amenities?.length > 0 && <p className="mt-6 text-sm text-slate">Amenities: {p.amenities.join(", ")}</p>}
        <p className="mt-6 text-sm text-slate">
          Title: {p.title_document ?? "Not specified"} {p.title_verified ? "(verified)" : "(not verified)"}
        </p>
      </div>
    </div>
  );
}
