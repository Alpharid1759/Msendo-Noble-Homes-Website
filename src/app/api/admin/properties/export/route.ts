// src/app/api/admin/properties/export/route.ts
import { NextResponse } from "next/server";
import { assertPermission } from "@/lib/auth/staff";
import { toCsv } from "@/lib/csv";
import { createServerSupabase } from "@/lib/supabase/server";

const COLUMNS = [
  "reference",
  "title",
  "status",
  "transaction_type",
  "category",
  "price",
  "currency",
  "billing_frequency",
  "price_on_request",
  "district_name",
  "city_name",
  "bedrooms",
  "bathrooms",
  "floor_area",
  "land_area",
  "area_unit",
  "title_document",
  "title_verified",
  "is_featured",
  "published_at",
  "updated_at",
  "slug",
];

export async function GET() {
  try {
    await assertPermission("properties.export");
  } catch {
    return NextResponse.json({ message: "Not allowed" }, { status: 403 });
  }
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("properties")
    .select("reference, title, status, transaction_type, price, currency, billing_frequency, price_on_request, district_name, city_name, bedrooms, bathrooms, floor_area, land_area, area_unit, title_document, title_verified, is_featured, published_at, updated_at, slug, property_categories(name)")
    .order("reference")
    .limit(10000);
  const rows = ((data ?? []) as unknown as (Record<string, unknown> & { property_categories: { name: string } | null })[]).map((r) => ({
    ...r,
    category: r.property_categories?.name ?? "",
  }));
  return new NextResponse(toCsv(rows, COLUMNS), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="msendo-properties-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
