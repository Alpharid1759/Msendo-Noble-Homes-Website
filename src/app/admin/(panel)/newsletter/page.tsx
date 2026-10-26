// src/app/admin/(panel)/newsletter/page.tsx
import { AdminPageHeader, adminBtnSecondary, EmptyState, Pill, statusTone, Table, Td, Th } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/staff";
import { formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  await requirePermission("newsletter.view");
  const supabase = await createServerSupabase();
  const [{ data }, { count: active }] = await Promise.all([
    supabase.from("newsletter_subscribers").select("id, email, status, source, consent_at, unsubscribed_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
  ]);
  const rows = (data ?? []) as { id: string; email: string; status: string; source: string | null; consent_at: string; unsubscribed_at: string | null }[];
  return (
    <>
      <AdminPageHeader
        title="Newsletter subscribers"
        description={`${active ?? 0} active subscribers. Only email people who are subscribed, and include the unsubscribe link in every newsletter.`}
        actions={
          <a href="/api/admin/newsletter/export" className={adminBtnSecondary}>
            Export active subscribers (CSV)
          </a>
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="No subscribers yet" />
      ) : (
        <Table caption="Subscribers">
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Consent given</Th>
              <Th>Unsubscribed</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{r.email}</Td>
                <Td>
                  <Pill tone={statusTone(r.status)}>{r.status}</Pill>
                </Td>
                <Td className="text-slate">{formatDateTime(r.consent_at)}</Td>
                <Td className="text-slate">{r.unsubscribed_at ? formatDateTime(r.unsubscribed_at) : ""}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
