// src/app/admin/(panel)/enquiries/page.tsx
import Link from "next/link";
import { AdminPageHeader, adminBtnPrimary, EmptyState, Notice, Pill, statusTone, Table, Td, Th } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";
import { requirePermission } from "@/lib/auth/staff";
import { ENQUIRY_CATEGORY_LABEL, ENQUIRY_STATUS_LABEL, formatDate, formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EnquiryCategory, EnquiryStatus } from "@/types/domain";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PAGE = 30;

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage({ searchParams }: Props) {
  const staff = await requirePermission("enquiries.view");
  const sp = await searchParams;
  const status = one(sp.status) in ENQUIRY_STATUS_LABEL ? (one(sp.status) as EnquiryStatus) : "";
  const category = one(sp.category) in ENQUIRY_CATEGORY_LABEL ? (one(sp.category) as EnquiryCategory) : "";
  const assigned = one(sp.assigned);
  const ref = one(sp.ref).toUpperCase().match(/^[A-Z0-9-]{3,20}$/)?.[0] ?? "";
  const q = one(sp.q).replace(/[%,()]/g, "").slice(0, 80);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const supabase = await createServerSupabase();
  let query = supabase
    .from("enquiries")
    .select("id, full_name, email, phone, category, status, property_reference, subject, message, follow_up_at, created_at, staff_profiles(full_name)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  else query = query.neq("status", "spam");
  if (category) query = query.eq("category", category);
  if (assigned === "me") query = query.eq("assigned_to", staff.userId);
  else if (assigned === "none") query = query.is("assigned_to", null);
  if (ref) query = query.eq("property_reference", ref);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,message.ilike.%${q}%`);
  const { data, count } = await query.range((page - 1) * PAGE, page * PAGE - 1);

  const rows = (data ?? []) as unknown as {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    category: EnquiryCategory;
    status: EnquiryStatus;
    property_reference: string | null;
    subject: string | null;
    message: string;
    follow_up_at: string | null;
    created_at: string;
    staff_profiles: { full_name: string } | null;
  }[];

  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (assigned) params.set("assigned", assigned);
    if (ref) params.set("ref", ref);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/admin/enquiries?${s}` : "/admin/enquiries";
  };

  return (
    <>
      <AdminPageHeader title="Enquiries" description={`${count ?? 0} enquir${count === 1 ? "y" : "ies"}${status ? "" : " (spam hidden)"}`} />
      {sp.deleted === "1" && (
        <div className="mb-4">
          <Notice tone="success">Enquiry deleted.</Notice>
        </div>
      )}
      <form method="get" className="mb-5 grid gap-3 rounded-[var(--radius-card)] border border-line bg-white p-4 md:grid-cols-[1fr_11rem_12rem_10rem_auto]">
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Search name, email, phone or message" className="field-input" />
        <label htmlFor="status" className="sr-only">
          Status
        </label>
        <select id="status" name="status" defaultValue={status} className="field-input">
          <option value="">All except spam</option>
          {Object.entries(ENQUIRY_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label htmlFor="category" className="sr-only">
          Category
        </label>
        <select id="category" name="category" defaultValue={category} className="field-input">
          <option value="">All categories</option>
          {Object.entries(ENQUIRY_CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label htmlFor="assigned" className="sr-only">
          Assigned
        </label>
        <select id="assigned" name="assigned" defaultValue={assigned} className="field-input">
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="none">Unassigned</option>
        </select>
        <button type="submit" className={adminBtnPrimary}>
          Filter
        </button>
        {ref && <input type="hidden" name="ref" value={ref} />}
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No enquiries match">New website enquiries appear here as soon as they are submitted.</EmptyState>
      ) : (
        <Table caption="Enquiries">
          <thead>
            <tr>
              <Th>From</Th>
              <Th>About</Th>
              <Th>Status</Th>
              <Th>Assigned</Th>
              <Th>Received</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const overdue = e.follow_up_at && new Date(e.follow_up_at) < new Date() && !["converted", "closed", "spam"].includes(e.status);
              return (
                <tr key={e.id} className={e.status === "new" ? "bg-[#fffaf0]" : "hover:bg-ivory"}>
                  <Td>
                    <Link href={`/admin/enquiries/${e.id}`} className="font-semibold text-navy-900 hover:underline">
                      {e.full_name}
                    </Link>
                    <p className="text-xs text-slate">{e.phone ?? e.email}</p>
                  </Td>
                  <Td className="max-w-md">
                    <p className="font-medium">
                      {ENQUIRY_CATEGORY_LABEL[e.category]}
                      {e.property_reference ? `: ${e.property_reference}` : ""}
                    </p>
                    <p className="line-clamp-1 text-xs text-slate">{e.subject || e.message}</p>
                  </Td>
                  <Td>
                    <Pill tone={statusTone(e.status)}>{ENQUIRY_STATUS_LABEL[e.status]}</Pill>
                    {e.follow_up_at && <p className={`mt-1 text-xs ${overdue ? "font-semibold text-danger" : "text-slate"}`}>Follow up {formatDate(e.follow_up_at)}</p>}
                  </Td>
                  <Td className="text-slate">{e.staff_profiles?.full_name ?? "Unassigned"}</Td>
                  <Td className="whitespace-nowrap text-slate">{formatDateTime(e.created_at)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE)} hrefFor={qs} />
    </>
  );
}
