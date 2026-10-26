// src/app/admin/(panel)/inspections/page.tsx
import clsx from "clsx";
import Link from "next/link";
import { AdminPageHeader, EmptyState, Pill, statusTone, Table, Td, Th } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";
import { requirePermission } from "@/lib/auth/staff";
import { formatDateTime, INSPECTION_STATUS_LABEL } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { InspectionStatus } from "@/types/domain";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PAGE = 30;

export const metadata = { title: "Inspections" };

const VIEWS = [
  { key: "attention", label: "Needs action" },
  { key: "upcoming", label: "Upcoming" },
  { key: "mine", label: "Assigned to me" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

export default async function InspectionsPage({ searchParams }: Props) {
  const staff = await requirePermission("inspections.view");
  const sp = await searchParams;
  const view = VIEWS.some((v) => v.key === one(sp.view)) ? one(sp.view) : one(sp.status) === "requested" ? "attention" : "attention";
  const ref = one(sp.ref).toUpperCase().match(/^[A-Z0-9-]{3,20}$/)?.[0] ?? "";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const now = new Date().toISOString();

  const supabase = await createServerSupabase();
  let query = supabase
    .from("inspections")
    .select("id, full_name, phone, status, requested_at, scheduled_at, attendees, properties!inner(reference, title), staff_profiles!inspections_assigned_agent_id_fkey(full_name)", { count: "exact" });
  if (view === "attention") query = query.eq("status", "requested").order("requested_at", { ascending: true });
  else if (view === "upcoming") query = query.in("status", ["confirmed", "rescheduled"]).gte("scheduled_at", now).order("scheduled_at", { ascending: true });
  else if (view === "mine") query = query.eq("assigned_agent_id", staff.userId).in("status", ["confirmed", "rescheduled"]).order("scheduled_at", { ascending: true });
  else if (view === "past") query = query.in("status", ["completed", "no_show", "cancelled"]).order("updated_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  if (ref) query = query.eq("properties.reference", ref);
  const { data, count } = await query.range((page - 1) * PAGE, page * PAGE - 1);
  const rows = (data ?? []) as unknown as {
    id: string;
    full_name: string;
    phone: string;
    status: InspectionStatus;
    requested_at: string;
    scheduled_at: string | null;
    attendees: number;
    properties: { reference: string; title: string };
    staff_profiles: { full_name: string } | null;
  }[];

  return (
    <>
      <AdminPageHeader title="Inspections" description="Requests are not confirmed until a member of staff confirms them here." />
      <nav aria-label="Inspection views" className="mb-5 flex flex-wrap gap-1">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/admin/inspections?view=${v.key}${ref ? `&ref=${ref}` : ""}`}
            aria-current={view === v.key ? "page" : undefined}
            className={clsx("inline-flex min-h-10 items-center rounded-[var(--radius-control)] px-4 text-sm font-semibold", view === v.key ? "bg-navy-800 text-white" : "text-navy-800 hover:bg-sand")}
          >
            {v.label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState title="Nothing here">{view === "attention" ? "All inspection requests have been handled." : "No inspections in this view."}</EmptyState>
      ) : (
        <Table caption="Inspections">
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Property</Th>
              <Th>When</Th>
              <Th>Agent</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.status === "requested" ? "bg-gold/5" : "hover:bg-ivory"}>
                <Td>
                  <Link href={`/admin/inspections/${r.id}`} className="font-semibold text-navy-900 hover:underline">
                    {r.full_name}
                  </Link>
                  <p className="text-xs text-slate">
                    {r.phone}, {r.attendees} attending
                  </p>
                </Td>
                <Td>
                  <p className="font-medium">{r.properties.reference}</p>
                  <p className="line-clamp-1 text-xs text-slate">{r.properties.title}</p>
                </Td>
                <Td className="whitespace-nowrap">{r.scheduled_at ? formatDateTime(r.scheduled_at) : <span className="text-slate">Requested {formatDateTime(r.requested_at)}</span>}</Td>
                <Td className="text-slate">{r.staff_profiles?.full_name ?? "Unassigned"}</Td>
                <Td>
                  <Pill tone={statusTone(r.status)}>{INSPECTION_STATUS_LABEL[r.status]}</Pill>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE)} hrefFor={(p) => `/admin/inspections?view=${view}${ref ? `&ref=${ref}` : ""}${p > 1 ? `&page=${p}` : ""}`} />
    </>
  );
}
