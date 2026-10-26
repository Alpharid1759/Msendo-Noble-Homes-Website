// src/app/admin/(panel)/account/page.tsx
import { removeMfaFactor } from "@/app/actions/auth";
import { ResetPasswordForm } from "@/components/admin/AuthForms";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { MfaSetup } from "@/components/admin/MfaSetup";
import { AdminPageHeader, adminBtnDanger, Card, Notice } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/staff";
import { formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: Props) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verified = (factors?.totp ?? []).filter((f) => f.status === "verified");

  return (
    <>
      <AdminPageHeader title="My account" description={`${staff.email}, ${staff.role.replace(/_/g, " ")}`} />
      <div className="max-w-2xl space-y-6">
        {sp.mfa === "removed" && <Notice tone="success">Authenticator removed.</Notice>}
        <Card title="Two-step verification">
          {verified.length > 0 ? (
            <ul className="space-y-3">
              {verified.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm">
                    <strong>{f.friendly_name ?? "Authenticator app"}</strong>, added {formatDateTime(f.created_at)}
                  </span>
                  <form action={removeMfaFactor}>
                    <input type="hidden" name="factorId" value={f.id} />
                    <ConfirmSubmit className={adminBtnDanger} message="Remove this authenticator? Your account will be protected by password only.">
                      Remove
                    </ConfirmSubmit>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <MfaSetup />
          )}
        </Card>
        <Card title="Change password">
          <ResetPasswordForm />
        </Card>
      </div>
    </>
  );
}
