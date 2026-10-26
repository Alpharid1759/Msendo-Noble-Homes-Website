// src/app/admin/(panel)/enquiries/[id]/page.tsx
import { Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEnquiry } from "@/app/actions/enquiries";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { EnquiryNoteForm, EnquiryUpdateForm } from "@/components/admin/EnquiryForms";
import { AdminPageHeader, adminBtnDanger, adminBtnSecondary, Card, Pill, statusTone } from "@/components/admin/ui";
import { getStaffAgents } from "@/lib/admin-data";
import { can, requirePermission } from "@/lib/auth/staff";
import { mailtoUrl, telUrl, whatsappUrl } from "@/lib/contact-links";
import { ENQUIRY_CATEGORY_LABEL, ENQUIRY_STATUS_LABEL, formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EnquiryCategory, EnquiryStatus } from "@/types/domain";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Enquiry" };

const DETAIL_LABELS: Record<string, string> = {
  relationship: "Relationship",
  transaction_type: "Wants to",
  property_type: "Property type",
  location: "Location",
  bedrooms: "Bedrooms",
  asking_price: "Asking price",
  title_document: "Title document",
};

export default async function EnquiryDetailPage({ params }: Props) {
  const staff = await requirePermission("enquiries.view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createServerSupabase();
  const [{ data: e }, { data: notes }, agents, { data: notifications }] = await Promise.all([
    supabase.from("enquiries").select("*, properties(id, title, slug, reference)").eq("id", id).maybeSingle(),
    supabase.from("enquiry_notes").select("id, note, created_at, staff_profiles(full_name)").eq("enquiry_id", id).order("created_at", { ascending: false }),
    getStaffAgents(),
    supabase.from("notifications").select("id, template, recipient, status, created_at").eq("related_id", id).order("created_at", { ascending: false }),
  ]);
  if (!e) notFound();
  const canManage = can(staff, "enquiries.manage");
  const details = Object.entries((e.details ?? {}) as Record<string, unknown>).filter(([, v]) => v !== null && v !== "");
  const firstName = String(e.full_name).split(" ")[0];

  return (
    <>
      <AdminPageHeader
        title={e.full_name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {ENQUIRY_CATEGORY_LABEL[e.category as EnquiryCategory]}
            <Pill tone={statusTone(e.status)}>{ENQUIRY_STATUS_LABEL[e.status as EnquiryStatus]}</Pill>
            Received {formatDateTime(e.created_at)}
          </span>
        }
        actions={
          <Link href="/admin/enquiries" className={adminBtnSecondary}>
            Back to inbox
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card title="Message">
            {e.subject && <p className="mb-2 font-semibold">{e.subject}</p>}
            <p className="whitespace-pre-wrap leading-relaxed">{e.message}</p>
            {details.length > 0 && (
              <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
                {details.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-slate">{DETAIL_LABELS[k] ?? k}</dt>
                    <dd className="font-medium">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {e.properties && (
              <p className="mt-5 border-t border-line pt-4 text-sm">
                Property:{" "}
                <Link href={`/admin/properties/${e.properties.id}`} className="font-semibold text-navy-700 hover:underline">
                  {e.properties.reference} ({e.properties.title})
                </Link>
              </p>
            )}
          </Card>

          <Card title="Contact">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate">Phone</dt>
                <dd className="font-semibold">{e.phone ?? "Not given"}</dd>
              </div>
              <div>
                <dt className="text-slate">Email</dt>
                <dd className="break-all font-semibold">{e.email ?? "Not given"}</dd>
              </div>
              <div>
                <dt className="text-slate">Prefers</dt>
                <dd className="font-semibold capitalize">{e.preferred_contact ?? "No preference"}</dd>
              </div>
              <div>
                <dt className="text-slate">Consent</dt>
                <dd>{e.consent_given ? `Given ${formatDateTime(e.consent_at)} (policy ${e.consent_version})` : "Not recorded"}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {e.phone && (
                <>
                  <a href={telUrl(e.phone)} className={adminBtnSecondary}>
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Call
                  </a>
                  <a
                    href={whatsappUrl(e.phone, `Hello ${firstName}, this is Msendo Noble Homes following up on your enquiry${e.property_reference ? ` about ${e.property_reference}` : ""}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={adminBtnSecondary}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                </>
              )}
              {e.email && (
                <a href={mailtoUrl(e.email, `Re: your enquiry${e.property_reference ? ` about ${e.property_reference}` : ""}`)} className={adminBtnSecondary}>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Email
                </a>
              )}
            </div>
          </Card>

          <Card title="Internal notes">
            {canManage && <EnquiryNoteForm id={id} />}
            <ul className="mt-5 space-y-4">
              {((notes ?? []) as unknown as { id: string; note: string; created_at: string; staff_profiles: { full_name: string } | null }[]).map((n) => (
                <li key={n.id} className="border-l-2 border-gold pl-4">
                  <p className="whitespace-pre-wrap text-sm">{n.note}</p>
                  <p className="mt-1 text-xs text-slate">
                    {n.staff_profiles?.full_name ?? "Staff"}, {formatDateTime(n.created_at)}
                  </p>
                </li>
              ))}
              {(notes ?? []).length === 0 && <li className="text-sm text-slate">No notes yet.</li>}
            </ul>
          </Card>
        </div>

        <aside className="space-y-6">
          {canManage && (
            <Card title="Manage">
              <EnquiryUpdateForm id={id} status={e.status} assignedTo={e.assigned_to} followUp={e.follow_up_at} agents={agents} />
            </Card>
          )}
          {(notifications ?? []).length > 0 && (
            <Card title="Notifications">
              <ul className="space-y-2 text-xs">
                {((notifications ?? []) as { id: string; template: string; recipient: string; status: string; created_at: string }[]).map((n) => (
                  <li key={n.id} className="flex justify-between gap-2">
                    <span className="truncate">{n.template.replace(/\./g, " ")}</span>
                    <Pill tone={statusTone(n.status === "sent" ? "completed" : n.status === "skipped" ? "draft" : "failed")}>{n.status}</Pill>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {canManage && (
            <Card title="Delete">
              <p className="text-sm text-slate">Use this when the person asks for their data to be erased, or for obvious spam.</p>
              <form action={deleteEnquiry.bind(null, id)} className="mt-3">
                <ConfirmSubmit className={adminBtnDanger} message="Delete this enquiry and its notes permanently? This cannot be undone.">
                  Delete enquiry permanently
                </ConfirmSubmit>
              </form>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
