// src/app/admin/(panel)/properties/page.tsx
import Link from "next/link";
import { AdminPageHeader, adminBtnPrimary, adminBtnSecondary, EmptyState, Pill, statusTone, Table, Td, Th } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";
import { can, requirePermission } from "@/lib/auth/staff";
import { formatDate, formatPrice, STATUS_LABEL, TRANSACTION_LABEL } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { BillingFrequency, PropertyStatus, TransactionType } from "@/types/domain";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PAGE = 25;
const STATUSES: PropertyStatus[] = ["draft", "pending_review", "published", "reserved", "sold", "rented", "unavailable", "archived"];

export default async function AdminPropertiesPage({ searchParams }: Props) {
  const staff = await requirePermission("properties.view");
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 80);
  const status = STATUSES.includes(one(sp.status) as PropertyStatus) ? (one(sp.status) as PropertyStatus) : "";
  const tx = ["sale", "rent", "short_let"].includes(one(sp.tx)) ? one(sp.tx) : "";
  const sort = ["updated", "created", "price_asc", "price_desc", "reference"].includes(one(sp.sort)) ? one(sp.sort) : "updated";
  const featured = one(sp.featured) === "1";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const supabase = await createServerSupabase();
  let query = supabase
    .from("properties")
    .select("id, reference, title, slug, transaction_type, status, price, price_on_request, currency, billing_frequency, is_featured, is_demo, district_name, updated_at, property_categories(name)", { count: "exact" });
  if (q) query = /^mnh-/i.test(q) ? query.ilike("reference", `${q}%`) : query.or(`title.ilike.%${q.replace(/[%,()]/g, "")}%,reference.ilike.%${q.replace(/[%,()]/g, "")}%`);
  if (status) query = query.eq("status", status);
  if (tx === "rent") query = query.in("transaction_type", ["rent", "short_let"]);
  else if (tx) query = query.eq("transaction_type", tx);
  if (featured) query = query.eq("is_featured", true);
  query =
    sort === "created"
      ? query.order("created_at", { ascending: false })
      : sort === "price_asc"
        ? query.order("price", { ascending: true, nullsFirst: false })
        : sort === "price_desc"
          ? query.order("price", { ascending: false, nullsFirst: false })
          : sort === "reference"
            ? query.order("reference", { ascending: true })
            : query.order("updated_at", { ascending: false });
  const { data, count } = await query.range((page - 1) * PAGE, page * PAGE - 1);
  const rows = (data ?? []) as unknown as {
    id: string;
    reference: string;
    title: string;
    slug: string;
    transaction_type: TransactionType;
    status: PropertyStatus;
    price: number | null;
    price_on_request: boolean;
    currency: string;
    billing_frequency: BillingFrequency;
    is_featured: boolean;
    is_demo: boolean;
    district_name: string | null;
    updated_at: string;
    property_categories: { name: string } | null;
  }[];

  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (tx) params.set("tx", tx);
    if (sort !== "updated") params.set("sort", sort);
    if (featured) params.set("featured", "1");
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/admin/properties?${s}` : "/admin/properties";
  };

  return (
    <>
      <AdminPageHeader
        title="Properties"
        description={`${count ?? 0} listing${count === 1 ? "" : "s"}`}
        actions={
          <>
            {can(staff, "properties.export") && (
              <a href="/api/admin/properties/export" className={adminBtnSecondary}>
                Export CSV
              </a>
            )}
            {can(staff, "properties.create") && (
              <Link href="/admin/properties/new" className={adminBtnPrimary}>
                Add property
              </Link>
            )}
          </>
        }
      />

      <form method="get" className="mb-5 grid gap-3 rounded-[var(--radius-card)] border border-line bg-white p-4 md:grid-cols-[1fr_11rem_10rem_11rem_auto]">
        <div>
          <label htmlFor="q" className="sr-only">
            Search
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Search title or reference" className="field-input" />
        </div>
        <div>
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="field-input">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tx" className="sr-only">
            Transaction
          </label>
          <select id="tx" name="tx" defaultValue={tx} className="field-input">
            <option value="">Sale and rent</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent and short-let</option>
            <option value="short_let">Short-let only</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="sr-only">
            Sort
          </label>
          <select id="sort" name="sort" defaultValue={sort} className="field-input">
            <option value="updated">Recently updated</option>
            <option value="created">Recently added</option>
            <option value="price_desc">Price: high to low</option>
            <option value="price_asc">Price: low to high</option>
            <option value="reference">Reference</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" value="1" defaultChecked={featured} className="h-4 w-4 accent-navy-800" />
            Featured
          </label>
          <button type="submit" className={adminBtnPrimary}>
            Filter
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title={q || status || tx ? "No listings match these filters" : "No listings yet"}>
          {can(staff, "properties.create") && (
            <Link href="/admin/properties/new" className="font-semibold text-navy-700 underline">
              Add your first property
            </Link>
          )}
        </EmptyState>
      ) : (
        <Table caption="Property listings">
          <thead>
            <tr>
              <Th>Property</Th>
              <Th>Type</Th>
              <Th>Price</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const price = formatPrice(p);
              return (
                <tr key={p.id} className="hover:bg-ivory">
                  <Td>
                    <Link href={`/admin/properties/${p.id}`} className="font-semibold text-navy-900 hover:underline">
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate">
                      {p.reference}
                      {p.district_name ? `, ${p.district_name}` : ""}
                      {p.is_featured ? ", featured" : ""}
                      {p.is_demo ? ", demo" : ""}
                    </p>
                  </Td>
                  <Td>
                    {TRANSACTION_LABEL[p.transaction_type]}
                    <p className="text-xs text-slate">{p.property_categories?.name}</p>
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums">
                    {price.amount}
                    {price.suffix && <span className="text-xs text-slate"> {price.suffix}</span>}
                  </Td>
                  <Td>
                    <Pill tone={statusTone(p.status)}>{STATUS_LABEL[p.status]}</Pill>
                  </Td>
                  <Td className="whitespace-nowrap text-slate">{formatDate(p.updated_at)}</Td>
                  <Td className="whitespace-nowrap text-right">
                    <Link href={`/admin/properties/${p.id}`} className="font-semibold text-navy-700 hover:underline">
                      Edit
                    </Link>
                    <span className="mx-2 text-line">|</span>
                    {["published", "reserved"].includes(p.status) ? (
                      <a href={`/properties/${p.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-700 hover:underline">
                        View
                      </a>
                    ) : (
                      <Link href={`/admin/properties/${p.id}/preview`} className="font-semibold text-navy-700 hover:underline">
                        Preview
                      </Link>
                    )}
                  </Td>
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
