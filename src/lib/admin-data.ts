// src/lib/admin-data.ts
import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export async function getAdminTaxonomy() {
  const supabase = await createServerSupabase();
  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase.from("property_categories").select("id, name, is_active").order("sort_order"),
    supabase.from("locations").select("id, name, type, parent_id, is_active, sort_order").order("sort_order"),
  ]);
  const locs = (locations ?? []) as { id: string; name: string; type: string; parent_id: string | null; is_active: boolean; sort_order: number }[];
  const byId = new Map(locs.map((l) => [l.id, l]));
  const typeOrder: Record<string, number> = { district: 0, city: 1, state: 2, country: 3 };
  return {
    categories: ((categories ?? []) as { id: string; name: string; is_active: boolean }[]).filter((c) => c.is_active),
    locations: locs
      .filter((l) => l.is_active)
      .map((l) => ({ id: l.id, name: l.name, type: l.type, parent_name: l.parent_id ? (byId.get(l.parent_id)?.name ?? null) : null }))
      .sort((a, b) => (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9) || a.name.localeCompare(b.name)),
  };
}

export async function getStaffAgents() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("staff_profiles").select("id, full_name, is_agent, is_active").eq("is_active", true).order("full_name");
  return (data ?? []) as { id: string; full_name: string; is_agent: boolean; is_active: boolean }[];
}
