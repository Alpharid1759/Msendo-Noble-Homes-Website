// src/app/admin/(panel)/staff/page.tsx
import { InviteStaffForm, StaffRowForm } from "@/components/admin/StaffForms";
import { AdminPageHeader, Card, Pill, Table, Td, Th } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Staff and roles" };

export default async function StaffPage() {
  const me = await requirePermission("users.manage");
  const supabase = await createServerSupabase();
  const [{ data: staff }, { data: roles }, { data: perms }, { data: rolePerms }] = await Promise.all([
    supabase.from("staff_profiles").select("id, email, full_name, role_key, job_title, is_active, is_agent, created_at").order("full_name"),
    supabase.from("roles").select("key, name, description, rank").order("rank"),
    supabase.from("permissions").select("key, description").order("key"),
    supabase.from("role_permissions").select("role_key, permission_key"),
  ]);
  const matrix = new Set(((rolePerms ?? []) as { role_key: string; permission_key: string }[]).map((r) => `${r.role_key}:${r.permission_key}`));
  const canGrantSuper = me.role === "super_admin";
  const roleList = (roles ?? []) as { key: string; name: string; description: string | null }[];

  return (
    <>
      <AdminPageHeader title="Staff and roles" description="Invite colleagues and choose what each person can do. Use the least access someone needs." />
      <div className="space-y-6">
        <Card title="Invite a staff member">
          <InviteStaffForm canGrantSuper={canGrantSuper} />
        </Card>

        <Card title={`Staff (${(staff ?? []).length})`}>
          <ul className="divide-y divide-line">
            {((staff ?? []) as { id: string; email: string; full_name: string; role_key: string; job_title: string | null; is_active: boolean; is_agent: boolean }[]).map((s) => (
              <li key={s.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold">
                    {s.full_name} {s.id === me.userId && <span className="text-sm font-normal text-slate">(you)</span>}
                  </p>
                  <p className="text-sm text-slate">{s.email}</p>
                  {!s.is_active && <Pill tone="danger">Deactivated</Pill>}
                </div>
                <StaffRowForm id={s.id} role={s.role_key} isActive={s.is_active} isAgent={s.is_agent} jobTitle={s.job_title} isSelf={s.id === me.userId} canGrantSuper={canGrantSuper} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="What each role can do">
          <Table caption="Role permissions">
            <thead>
              <tr>
                <Th>Permission</Th>
                {roleList.map((r) => (
                  <Th key={r.key} className="text-center">
                    {r.name}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {((perms ?? []) as { key: string; description: string }[]).map((p) => (
                <tr key={p.key}>
                  <Td>{p.description}</Td>
                  {roleList.map((r) => (
                    <Td key={r.key} className="text-center">
                      {matrix.has(`${r.key}:${p.key}`) ? <span aria-label="Allowed">✓</span> : <span className="text-line" aria-label="Not allowed">–</span>}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}
