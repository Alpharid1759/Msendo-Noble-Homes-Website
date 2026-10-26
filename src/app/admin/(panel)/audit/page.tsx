// src/app/admin/(panel)/audit/page.tsx
import { AdminPageHeader, adminBtnPrimary, EmptyState, Table, Td, Th } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";
import { requirePermission } from "@/lib/auth/staff";
import { formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PAGE = 50;
const ENTITIES = ["properties", "media_assets", "enquiries", "inspections", "blog_posts", "staff_profiles", "site_settings", "role_permissions"];

export const metadata = { title: "Audit log" };

function summarise(changes: Record<string, unknown> | null, action: string) {
  if (!changes) return "";
  if (action !== "update") {
    const c = changes as Record<string, unknown>;
    return String(c.title ?? c.reference ?? c.full_name ?? c.key ?? c.email ?? "");
  }
  return Object.entries(changes)
    .slice(0, 4)
    .map(([k, v]) => {
      const [from, to] = Array.isArray(v) ? v : [null, v];
      const fmt = (x: unknown) => (x === null || x === undefined ? "empty" : typeof x === "object" ? "…" : String(x).slice(0, 40));
      return `${k}: ${fmt(from)} to ${fmt(to)}`;
    })
    .join("; ");
}

export default async function AuditPage({ searchParams }: Props) {
  await requirePermission("audit.view");
  const sp = await searchParams;
  const entity = ENTITIES.includes(one(sp.entity)) ? one(sp.entity) : "";
  const actor = one(sp.actor).replace(/[%,()]/g, "").slice(0, 80);
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const supabase = await createServerSupabase();
  let q = supabase.from("audit_logs").select("id, actor_email, action, entity_type, entity_id, changes, created_at", { count: "exact" }).order("created_at", { ascending: false });
  if (entity) q = q.eq("entity_type", entity);
  if (actor) q = q.ilike("actor_email", `%${actor}%`);
  const { data, count } = await q.range((page - 1) * PAGE, page * PAGE - 1);
  const rows = (data ?? []) as { id: number; actor_email: string | null; action: string; entity_type: string; entity_id: string | null; changes: Record<string, unknown> | null; created_at: string }[];

  return (
    <>
      <AdminPageHeader title="Audit log" description="Every change to listings, media, enquiries, inspections, articles, staff and settings." />
      <form method="get" className="mb-5 flex flex-wrap gap-3 rounded-[var(--radius-card)] border border-line bg-white p-4">
        <label htmlFor="entity" className="sr-only">
          Record type
        </label>
        <select id="entity" name="entity" defaultValue={entity} className="field-input w-56">
          <option value="">All record types</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>
              {e.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <label htmlFor="actor" className="sr-only">
          Staff email
        </label>
        <input id="actor" name="actor" defaultValue={actor} placeholder="Staff email" className="field-input w-64" />
        <button type="submit" className={adminBtnPrimary}>
          Filter
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="No activity recorded" />
      ) : (
        <Table caption="Audit log">
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Who</Th>
              <Th>Action</Th>
              <Th>Record</Th>
              <Th>Details</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap text-slate">{formatDateTime(r.created_at)}</Td>
                <Td>{r.actor_email ?? "System"}</Td>
                <Td className="capitalize">{r.action}</Td>
                <Td>
                  {r.entity_type.replace(/_/g, " ")}
                  <p className="text-xs text-slate">{r.entity_id?.slice(0, 8)}</p>
                </Td>
                <Td className="max-w-md text-xs text-slate">{summarise(r.changes, r.action)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE)} hrefFor={(p) => `/admin/audit?entity=${entity}&actor=${encodeURIComponent(actor)}&page=${p}`} />
    </>
  );
}
