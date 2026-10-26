// src/app/admin/(panel)/properties/new/page.tsx
import Link from "next/link";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { AdminPageHeader, Notice } from "@/components/admin/ui";
import { getAdminTaxonomy } from "@/lib/admin-data";
import { can, requirePermission } from "@/lib/auth/staff";

export const metadata = { title: "Add property" };

export default async function NewPropertyPage() {
  const staff = await requirePermission("properties.create");
  const { categories, locations } = await getAdminTaxonomy();
  return (
    <>
      <AdminPageHeader title="Add property" description="Save the details first. Photos and videos can be added once the listing exists." />
      {(categories.length === 0 || locations.length === 0) && (
        <div className="mb-6">
          <Notice tone="warning">
            Add at least one property type and location first.{" "}
            {can(staff, "taxonomy.manage") && (
              <Link href="/admin/taxonomy" className="font-semibold underline">
                Manage categories and locations
              </Link>
            )}
          </Notice>
        </div>
      )}
      <div className="max-w-5xl">
        <PropertyForm property={null} charges={[]} categories={categories} locations={locations} canPublish={can(staff, "properties.publish")} />
      </div>
    </>
  );
}
