// src/app/admin/(panel)/properties/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { duplicateProperty } from "@/app/actions/properties";
import { MediaManager, type AdminMedia } from "@/components/admin/MediaManager";
import { PropertyForm, type EditableCharge, type EditableProperty } from "@/components/admin/PropertyForm";
import { PropertyStatusActions } from "@/components/admin/PropertyStatusActions";
import { AdminPageHeader, adminBtnSecondary, Card, Notice, Pill, statusTone } from "@/components/admin/ui";
import { getAdminTaxonomy } from "@/lib/admin-data";
import { can, requirePermission } from "@/lib/auth/staff";
import { formatDateTime, STATUS_LABEL } from "@/lib/format";
import { getPrivateSetting } from "@/lib/private-settings";
import { createServerSupabase } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Edit property" };

export default async function EditPropertyPage({ params, searchParams }: Props) {
  const staff = await requirePermission("properties.view");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createServerSupabase();

  const [{ data: property }, { data: charges }, { data: mediaRows }, taxonomy, limits, { data: videos }, { count: enquiryCount }, { count: inspectionCount }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).maybeSingle(),
    supabase.from("property_charges").select("charge_type, label, amount, is_percentage, billing_frequency, notes").eq("property_id", id).order("sort_order"),
    supabase
      .from("property_media")
      .select("sort_order, is_featured, media_assets(id, media_type, status, storage_path, variants, poster_path, title, caption, alt_text, description, duration_seconds, is_published)")
      .eq("property_id", id)
      .order("sort_order"),
    getAdminTaxonomy(),
    getPrivateSetting("uploads"),
    supabase.from("media_assets").select("id, title, caption").eq("media_type", "video").eq("status", "ready").order("created_at", { ascending: false }).limit(50),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("property_id", id),
    supabase.from("inspections").select("id", { count: "exact", head: true }).eq("property_id", id),
  ]);
  if (!property) notFound();

  const media: AdminMedia[] = ((mediaRows ?? []) as unknown as { sort_order: number; is_featured: boolean; media_assets: Omit<AdminMedia, "sort_order" | "is_featured"> }[])
    .filter((r) => r.media_assets)
    .map((r) => ({ ...r.media_assets, sort_order: r.sort_order, is_featured: r.is_featured }));
  const linkedIds = new Set(media.map((m) => m.id));
  const linkable = ((videos ?? []) as { id: string; title: string | null; caption: string | null }[]).filter((v) => !linkedIds.has(v.id));
  const canEdit = can(staff, "properties.edit");
  const live = ["published", "reserved"].includes(property.status);

  return (
    <>
      <AdminPageHeader
        title={property.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {property.reference}
            <Pill tone={statusTone(property.status)}>{STATUS_LABEL[property.status as keyof typeof STATUS_LABEL]}</Pill>
            <span>Updated {formatDateTime(property.updated_at)}</span>
          </span>
        }
        actions={
          <>
            {live ? (
              <a href={`/properties/${property.slug}`} target="_blank" rel="noopener noreferrer" className={adminBtnSecondary}>
                View on website
              </a>
            ) : (
              <Link href={`/admin/properties/${id}/preview`} className={adminBtnSecondary}>
                Preview
              </Link>
            )}
            {can(staff, "properties.create") && (
              <form action={duplicateProperty.bind(null, id)}>
                <button type="submit" className={adminBtnSecondary}>
                  Duplicate as draft
                </button>
              </form>
            )}
          </>
        }
      />

      <div className="mb-6 space-y-3">
        {sp.created === "1" && <Notice tone="success">Listing created. Add photos and videos below, then publish when ready.</Notice>}
        {sp.duplicated === "1" && <Notice tone="success">Copy created as a draft. Update the details and add media before publishing.</Notice>}
        {sp.error === "duplicate" && <Notice tone="danger">The listing could not be duplicated.</Notice>}
        {property.status === "pending_review" && can(staff, "properties.publish") && <Notice tone="warning">This listing is waiting for review. Check the details and publish it when it is ready.</Notice>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {canEdit ? (
            <PropertyForm
              property={property as unknown as EditableProperty}
              charges={(charges ?? []) as EditableCharge[]}
              categories={taxonomy.categories}
              locations={taxonomy.locations}
              canPublish={can(staff, "properties.publish")}
            />
          ) : (
            <Notice>Your role can view this listing but not edit it.</Notice>
          )}

          <Card title="Photos and videos">
            {can(staff, "media.upload") && canEdit ? (
              <MediaManager
                propertyId={id}
                propertyTitle={property.title}
                isLive={live}
                media={media}
                limits={limits}
                canDelete={can(staff, "media.delete")}
                linkableVideos={linkable}
              />
            ) : (
              <p className="text-sm text-slate">Your role cannot upload media.</p>
            )}
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card title="Status">
            <PropertyStatusActions
              id={id}
              status={property.status}
              isSale={property.transaction_type === "sale"}
              canPublish={can(staff, "properties.publish")}
              canEdit={canEdit}
              canDelete={can(staff, "properties.delete")}
            />
          </Card>
          <Card title="Activity">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate">Enquiries</dt>
                <dd>
                  {can(staff, "enquiries.view") ? (
                    <Link href={`/admin/enquiries?ref=${property.reference}`} className="font-semibold text-navy-700 hover:underline">
                      {enquiryCount ?? 0}
                    </Link>
                  ) : (
                    enquiryCount ?? 0
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Inspections</dt>
                <dd>
                  {can(staff, "inspections.view") ? (
                    <Link href={`/admin/inspections?ref=${property.reference}`} className="font-semibold text-navy-700 hover:underline">
                      {inspectionCount ?? 0}
                    </Link>
                  ) : (
                    inspectionCount ?? 0
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Published</dt>
                <dd>{property.published_at ? formatDateTime(property.published_at) : "Never"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Created</dt>
                <dd>{formatDateTime(property.created_at)}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}
