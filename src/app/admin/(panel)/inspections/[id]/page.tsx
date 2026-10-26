// src/app/admin/(panel)/inspections/[id]/page.tsx
import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InspectionManageForm } from "@/components/admin/InspectionManageForm";
import { AdminPageHeader, adminBtnSecondary, Card, Pill, statusTone } from "@/components/admin/ui";
import { getStaffAgents } from "@/lib/admin-data";
import { can, requirePermission } from "@/lib/auth/staff";
import { telUrl, whatsappUrl } from "@/lib/contact-links";
import { formatDateTime, INSPECTION_STATUS_LABEL } from "@/lib/format";
import { lagosParts } from "@/lib/inspection-rules";
import { createServerSupabase } from "@/lib/supabase/server";
import type { InspectionStatus } from "@/types/domain";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Inspection" };

export default async function InspectionDetailPage({ params }: Props) {
  const staff = await requirePermission("inspections.view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createServerSupabase();
  const [{ data: i }, { data: events }, agents] = await Promise.all([
    supabase.from("inspections").select("*, properties(id, reference, title, slug, district_name)").eq("id", id).maybeSingle(),
    supabase.from("inspection_events").select("id, from_status, to_status, scheduled_at, created_at").eq("inspection_id", id).order("created_at", { ascending: false }),
    getStaffAgents(),
  ]);
  if (!i) notFound();
  const base = new Date(i.scheduled_at ?? i.requested_at);
  const parts = lagosParts(base);
  const prop = i.properties as { id: string; reference: string; title: string; slug: string; district_name: string | null } | null;
  const firstName = String(i.full_name).split(" ")[0];

  return (
    <>
      <AdminPageHeader
        title={`Inspection: ${prop?.reference ?? ""}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {i.full_name}
            <Pill tone={statusTone(i.status)}>{INSPECTION_STATUS_LABEL[i.status as InspectionStatus]}</Pill>
          </span>
        }
        actions={
          <Link href="/admin/inspections" className={adminBtnSecondary}>
            All inspections
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card title="Request">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate">Property</dt>
                <dd>
                  {prop ? (
                    <Link href={`/admin/properties/${prop.id}`} className="font-semibold text-navy-700 hover:underline">
                      {prop.reference}: {prop.title}
                    </Link>
                  ) : (
                    "Removed"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate">Preferred time</dt>
                <dd className="font-semibold">{formatDateTime(i.requested_at)}</dd>
              </div>
              <div>
                <dt className="text-slate">Alternative time</dt>
                <dd>{i.alternative_at ? formatDateTime(i.alternative_at) : "None"}</dd>
              </div>
              <div>
                <dt className="text-slate">Confirmed time</dt>
                <dd className="font-semibold">{i.scheduled_at ? formatDateTime(i.scheduled_at) : "Not yet confirmed"}</dd>
              </div>
              <div>
                <dt className="text-slate">People attending</dt>
                <dd>{i.attendees}</dd>
              </div>
              <div>
                <dt className="text-slate">Received</dt>
                <dd>{formatDateTime(i.created_at)}</dd>
              </div>
            </dl>
            {i.customer_notes && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm text-slate">Customer notes</p>
                <p className="mt-1 whitespace-pre-wrap">{i.customer_notes}</p>
              </div>
            )}
          </Card>

          <Card title="Customer">
            <p className="font-semibold">{i.full_name}</p>
            <p className="text-sm">{i.phone}</p>
            {i.email && <p className="text-sm">{i.email}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={telUrl(i.phone)} className={adminBtnSecondary}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call
              </a>
              <a
                href={whatsappUrl(i.phone, `Hello ${firstName}, this is Msendo Noble Homes about your inspection request for ${prop?.reference ?? "the property"}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={adminBtnSecondary}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </Card>

          <Card title="History">
            <ol className="space-y-3 text-sm">
              {((events ?? []) as { id: number; from_status: string | null; to_status: InspectionStatus; scheduled_at: string | null; created_at: string }[]).map((e) => (
                <li key={e.id} className="flex flex-wrap justify-between gap-2 border-l-2 border-gold pl-3">
                  <span>
                    {e.from_status ? `${INSPECTION_STATUS_LABEL[e.from_status as InspectionStatus]} to ` : ""}
                    <strong>{INSPECTION_STATUS_LABEL[e.to_status]}</strong>
                    {e.scheduled_at ? ` for ${formatDateTime(e.scheduled_at)}` : ""}
                  </span>
                  <span className="text-xs text-slate">{formatDateTime(e.created_at)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside>
          <Card title="Manage">
            {can(staff, "inspections.manage") ? (
              <InspectionManageForm
                id={id}
                status={i.status}
                defaultDate={parts.date}
                defaultTime={parts.time}
                durationMinutes={i.duration_minutes}
                agentId={i.assigned_agent_id}
                agents={agents}
                internalNotes={i.internal_notes}
              />
            ) : (
              <p className="text-sm text-slate">Your role can view but not manage inspections.</p>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
