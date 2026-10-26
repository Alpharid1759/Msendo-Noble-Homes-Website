// src/components/admin/PropertyStatusActions.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProperty, setPropertyStatus } from "@/app/actions/properties";
import type { PropertyStatus } from "@/types/domain";
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary } from "./ui";

export function PropertyStatusActions({
  id,
  status,
  isSale,
  canPublish,
  canEdit,
  canDelete,
}: {
  id: string;
  status: PropertyStatus;
  isSale: boolean;
  canPublish: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const go = (next: PropertyStatus, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    start(async () => {
      const r = await setPropertyStatus(id, next);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  };

  const live = status === "published" || status === "reserved";

  return (
    <div className="space-y-3">
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {canPublish && !live && (
          <button type="button" className={adminBtnPrimary} disabled={pending} onClick={() => go("published", "Publish this listing on the website?")}>
            Publish
          </button>
        )}
        {canEdit && !canPublish && status === "draft" && (
          <button type="button" className={adminBtnPrimary} disabled={pending} onClick={() => go("pending_review")}>
            Submit for review
          </button>
        )}
        {canPublish && live && (
          <>
            {status === "published" ? (
              <button type="button" className={adminBtnSecondary} disabled={pending} onClick={() => go("reserved")}>
                Mark reserved
              </button>
            ) : (
              <button type="button" className={adminBtnSecondary} disabled={pending} onClick={() => go("published")}>
                Mark available
              </button>
            )}
            <button type="button" className={adminBtnSecondary} disabled={pending} onClick={() => go(isSale ? "sold" : "rented", `Mark this property as ${isSale ? "sold" : "let"}? It will be removed from search results.`)}>
              Mark {isSale ? "sold" : "let"}
            </button>
            <button type="button" className={adminBtnSecondary} disabled={pending} onClick={() => go("unavailable", "Mark as unavailable? It will be removed from search results.")}>
              Mark unavailable
            </button>
            <button type="button" className={adminBtnSecondary} disabled={pending} onClick={() => go("draft", "Unpublish and return to draft?")}>
              Unpublish
            </button>
          </>
        )}
        {canPublish && status !== "archived" && (
          <button type="button" className={adminBtnSecondary} disabled={pending} onClick={() => go("archived", "Archive this listing? Its page will no longer be public.")}>
            Archive
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className={adminBtnDanger}
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Delete this listing permanently? This cannot be undone. Archive it instead if you may need it later.")) return;
              if (live && !window.confirm("This listing is live on the website. Delete it anyway?")) return;
              start(async () => {
                const r = await deleteProperty(id);
                if (r.ok) router.push("/admin/properties");
                else setMsg({ ok: false, text: r.message });
              });
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
