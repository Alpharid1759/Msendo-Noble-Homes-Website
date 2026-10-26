// src/app/admin/(panel)/page.tsx
import Link from "next/link";
import { AdminPageHeader, Card, Notice, Pill, StatCard, statusTone } from "@/components/admin/ui";
import { can, requireStaff } from "@/lib/auth/staff";
import { ENQUIRY_CATEGORY_LABEL, formatDateTime, STATUS_LABEL, TRANSACTION_LABEL } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EnquiryCategory, PropertyStatus, TransactionType } from "@/types/domain";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DashboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const staff = await requireStaff();
  const supabase = await createServerSupabase();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  const canProps = can(staff, "properties.view");
  const canEnq = can(staff, "enquiries.view");
  const canInsp = can(staff, "inspections.view");
  const canAudit = can(staff, "audit.view");
  const canMedia = canProps || can(staff, "blog.view");
  const nowIso = new Date().toISOString();

  const [total, published, drafts, pending, sale, rent, newEnq, upcoming, requested, recentProps, recentEnq, upcomingInsp, recentMedia, activity] = await Promise.all([
    canProps ? count(supabase.from("properties").select("id", { count: "exact", head: true })) : 0,
    canProps ? count(supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "published")) : 0,
    canProps ? count(supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "draft")) : 0,
    canProps ? count(supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "pending_review")) : 0,
    canProps ? count(supabase.from("properties").select("id", { count: "exact", head: true }).eq("transaction_type", "sale").in("status", ["published", "reserved"])) : 0,
    canProps ? count(supabase.from("properties").select("id", { count: "exact", head: true }).in("transaction_type", ["rent", "short_let"]).in("status", ["published", "reserved"])) : 0,
    canEnq ? count(supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new")) : 0,
    canInsp ? count(supabase.from("inspections").select("id", { count: "exact", head: true }).in("status", ["confirmed", "rescheduled"]).gte("scheduled_at", nowIso)) : 0,
    canInsp ? count(supabase.from("inspections").select("id", { count: "exact", head: true }).eq("status", "requested")) : 0,
    canProps
      ? supabase.from("properties").select("id, reference, title, status, transaction_type, updated_at").order("created_at", { ascending: false }).limit(6).then((r) => r.data ?? [])
      : [],
    canEnq
      ? supabase.from("enquiries").select("id, full_name, category, status, property_reference, created_at").order("created_at", { ascending: false }).limit(6).then((r) => r.data ?? [])
      : [],
    canInsp
      ? supabase
          .from("inspections")
          .select("id, full_name, status, scheduled_at, requested_at, properties(reference, title)")
          .in("status", ["requested", "confirmed", "rescheduled"])
          .order("requested_at", { ascending: true })
          .limit(6)
          .then((r) => r.data ?? [])
      : [],
    canMedia
      ? supabase.from("media_assets").select("id, media_type, status, title, caption, created_at").order("created_at", { ascending: false }).limit(6).then((r) => r.data ?? [])
      : [],
    canAudit
      ? supabase.from("audit_logs").select("id, actor_email, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(8).then((r) => r.data ?? [])
      : [],
  ]);

  return (
    <>
      <AdminPageHeader title={`Welcome, ${staff.fullName.split(" ")[0]}`} description="Today's overview of listings, leads and inspections." />
      {sp.denied === "1" && (
        <div className="mb-6">
          <Notice tone="warning">Your role does not include access to that page. Ask a super administrator if you need it.</Notice>
        </div>
      )}
      {!staff.hasMfa && ["super_admin", "admin"].includes(staff.role) && (
        <div className="mb-6">
          <Notice tone="warning">
            Your account has full administrative access but two-step verification is off.{" "}
            <Link href="/admin/account" className="font-semibold underline">
              Turn it on now
            </Link>
            .
          </Notice>
        </div>
      )}

      {canProps && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total properties" value={total} href="/admin/properties" />
          <StatCard label="Published" value={published} href="/admin/properties?status=published" />
          <StatCard label="Drafts" value={drafts} href="/admin/properties?status=draft" />
          <StatCard label="Pending review" value={pending} href="/admin/properties?status=pending_review" />
          <StatCard label="Live for sale" value={sale} href="/admin/properties?tx=sale&status=published" />
          <StatCard label="Live for rent" value={rent} href="/admin/properties?tx=rent&status=published" />
        </div>
      )}

      {(canEnq || canInsp) && (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          {canEnq && <StatCard label="New enquiries" value={newEnq} href="/admin/enquiries?status=new" />}
          {canInsp && <StatCard label="Inspection requests" value={requested} href="/admin/inspections?status=requested" />}
          {canInsp && <StatCard label="Upcoming confirmed inspections" value={upcoming} href="/admin/inspections?view=upcoming" />}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {canProps && (
          <Card title="Recently added properties" actions={<Link href="/admin/properties/new" className="text-sm font-semibold text-navy-700 hover:underline">Add property</Link>}>
            {recentProps.length === 0 ? (
              <p className="text-sm text-slate">No properties yet. Add your first listing.</p>
            ) : (
              <ul className="divide-y divide-line">
                {(recentProps as { id: string; reference: string; title: string; status: PropertyStatus; transaction_type: TransactionType; updated_at: string }[]).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/admin/properties/${p.id}`} className="block truncate font-semibold hover:underline">
                        {p.title}
                      </Link>
                      <p className="text-xs text-slate">
                        {p.reference}, {TRANSACTION_LABEL[p.transaction_type]}
                      </p>
                    </div>
                    <Pill tone={statusTone(p.status)}>{STATUS_LABEL[p.status]}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {canEnq && (
          <Card title="Latest enquiries" actions={<Link href="/admin/enquiries" className="text-sm font-semibold text-navy-700 hover:underline">Open inbox</Link>}>
            {recentEnq.length === 0 ? (
              <p className="text-sm text-slate">No enquiries yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {(recentEnq as { id: string; full_name: string; category: EnquiryCategory; status: string; property_reference: string | null; created_at: string }[]).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/admin/enquiries/${e.id}`} className="block truncate font-semibold hover:underline">
                        {e.full_name}
                      </Link>
                      <p className="text-xs text-slate">
                        {ENQUIRY_CATEGORY_LABEL[e.category]}
                        {e.property_reference ? `, ${e.property_reference}` : ""}, {formatDateTime(e.created_at)}
                      </p>
                    </div>
                    <Pill tone={statusTone(e.status)}>{e.status.replace(/_/g, " ")}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {canInsp && (
          <Card title="Inspections needing attention" actions={<Link href="/admin/inspections" className="text-sm font-semibold text-navy-700 hover:underline">All inspections</Link>}>
            {upcomingInsp.length === 0 ? (
              <p className="text-sm text-slate">Nothing pending.</p>
            ) : (
              <ul className="divide-y divide-line">
                {(upcomingInsp as unknown as { id: string; full_name: string; status: string; scheduled_at: string | null; requested_at: string; properties: { reference: string; title: string } | null }[]).map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/admin/inspections/${i.id}`} className="block truncate font-semibold hover:underline">
                        {i.full_name}: {i.properties?.reference}
                      </Link>
                      <p className="text-xs text-slate">{i.scheduled_at ? `Confirmed for ${formatDateTime(i.scheduled_at)}` : `Requested ${formatDateTime(i.requested_at)}`}</p>
                    </div>
                    <Pill tone={statusTone(i.status)}>{i.status}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {canMedia && (
          <Card title="Recent media uploads">
            {recentMedia.length === 0 ? (
              <p className="text-sm text-slate">No uploads yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {(recentMedia as { id: string; media_type: string; status: string; title: string | null; caption: string | null; created_at: string }[]).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="truncate">
                      {m.media_type === "video" ? "Video" : "Photo"}: {m.title || m.caption || "Untitled"}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-slate">{formatDateTime(m.created_at)}</span>
                      <Pill tone={statusTone(m.status)}>{m.status}</Pill>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {canAudit && (
          <Card title="Recent administrative activity" actions={<Link href="/admin/audit" className="text-sm font-semibold text-navy-700 hover:underline">Full log</Link>} className="xl:col-span-2">
            {activity.length === 0 ? (
              <p className="text-sm text-slate">No activity recorded yet.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {(activity as { id: number; actor_email: string | null; action: string; entity_type: string; entity_id: string | null; created_at: string }[]).map((a) => (
                  <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      <strong>{a.actor_email ?? "System"}</strong> {a.action}d {a.entity_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate">{formatDateTime(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
