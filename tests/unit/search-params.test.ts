// tests/unit/search-params.test.ts
import { describe, expect, it } from "vitest";
import { activeFilterCount, filtersToQuery, parseListingFilters } from "@/lib/search-params";

describe("parseListingFilters", () => {
  it("keeps valid filters and drops invalid ones", () => {
    const f = parseListingFilters({
      tx: "sale",
      category: "land-plots",
      location: "abuja-jabi",
      minPrice: "5000000",
      maxPrice: "abc",
      beds: "3",
      baths: "99",
      sort: "price_desc",
      page: "2",
      view: "list",
      evil: "<script>",
    });
    expect(f).toEqual({
      tx: "sale",
      category: "land-plots",
      location: "abuja-jabi",
      minPrice: 5000000,
      beds: 3,
      sort: "price_desc",
      page: 2,
      view: "list",
    });
  });

  it("rejects slugs with SQL or path characters", () => {
    expect(parseListingFilters({ location: "jabi'; drop table--" }).location).toBeUndefined();
    expect(parseListingFilters({ category: "../etc" }).category).toBeUndefined();
  });

  it("swaps inverted price and area ranges", () => {
    const f = parseListingFilters({ minPrice: "900", maxPrice: "100", minArea: "50", maxArea: "10" });
    expect([f.minPrice, f.maxPrice, f.minArea, f.maxArea]).toEqual([100, 900, 10, 50]);
  });

  it("treats a reference typed in the keyword box as a reference search", () => {
    const f = parseListingFilters({ q: "mnh-sl-01001" });
    expect(f.ref).toBe("MNH-SL-01001");
    expect(f.q).toBeUndefined();
  });

  it("ignores empty and array values gracefully", () => {
    expect(parseListingFilters({ tx: "", beds: ["2", "5"] })).toEqual({ beds: 2 });
  });
});

describe("filtersToQuery and activeFilterCount", () => {
  it("builds shareable URLs and overrides page", () => {
    const qs = filtersToQuery({ tx: "rent", beds: 2, page: 3 }, { page: null });
    expect(qs).toBe("tx=rent&beds=2");
  });

  it("does not count sort, page or view as filters", () => {
    expect(activeFilterCount({ sort: "newest", page: 2, view: "grid", tx: "sale" })).toBe(1);
  });
});
