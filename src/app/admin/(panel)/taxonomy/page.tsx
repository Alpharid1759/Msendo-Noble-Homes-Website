// src/app/admin/(panel)/taxonomy/page.tsx
import { TaxonomyItemForm } from "@/components/admin/SettingsForms";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { can, requirePermission } from "@/lib/auth/staff";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Categories and locations" };

export default async function TaxonomyPage() {
  const staff = await requirePermission("taxonomy.manage");
  const supabase = await createServerSupabase();
  const [{ data: categories }, { data: locations }, { data: blogCats }] = await Promise.all([
    supabase.from("property_categories").select("*").order("sort_order"),
    supabase.from("locations").select("*").order("type").order("sort_order"),
    supabase.from("blog_categories").select("*").order("sort_order"),
  ]);
  const locs = (locations ?? []) as Record<string, unknown>[];
  const parents = locs.filter((l) => l.type !== "district").map((l) => ({ id: String(l.id), name: String(l.name), type: String(l.type) }));
  const typeOrder: Record<string, number> = { state: 0, city: 1, district: 2 };
  const sorted = [...locs].sort((a, b) => (typeOrder[String(a.type)] ?? 9) - (typeOrder[String(b.type)] ?? 9) || Number(a.sort_order) - Number(b.sort_order));

  return (
    <>
      <AdminPageHeader title="Categories and locations" description="Add property types and areas without code changes. Deactivate instead of deleting items that listings use." />
      <div className="max-w-5xl space-y-6">
        <Card title="Property types">
          <ul className="divide-y divide-line">
            {((categories ?? []) as Record<string, unknown>[]).map((c) => (
              <li key={String(c.id)} className="py-3">
                <TaxonomyItemForm table="categories" item={c} submitLabel="Save" />
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-[var(--radius-control)] bg-ivory p-3">
            <p className="mb-2 text-sm font-semibold">Add a property type</p>
            <TaxonomyItemForm table="categories" submitLabel="Add" />
          </div>
        </Card>

        <Card title="Locations">
          <p className="mb-3 text-sm text-slate">Districts belong to a city, and cities belong to a state. Add new Nigerian cities here as the business expands.</p>
          <ul className="divide-y divide-line">
            {sorted.map((l) => (
              <li key={String(l.id)} className="py-3">
                <TaxonomyItemForm table="locations" item={l} parents={parents} submitLabel="Save" />
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-[var(--radius-control)] bg-ivory p-3">
            <p className="mb-2 text-sm font-semibold">Add a location</p>
            <TaxonomyItemForm table="locations" parents={parents} submitLabel="Add" />
          </div>
        </Card>

        {can(staff, "blog.publish") && (
          <Card title="Blog categories">
            <ul className="divide-y divide-line">
              {((blogCats ?? []) as Record<string, unknown>[]).map((c) => (
                <li key={String(c.id)} className="py-3">
                  <TaxonomyItemForm table="blog_categories" item={c} submitLabel="Save" />
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-[var(--radius-control)] bg-ivory p-3">
              <TaxonomyItemForm table="blog_categories" submitLabel="Add" />
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
