// tests/unit/rules-and-validation.test.ts
import { describe, expect, it } from "vitest";
import { lagosParts, timeOptions, toLagosDate, validateInspectionSlot } from "@/lib/inspection-rules";
import { looksLikeMp4, processImage } from "@/lib/media-processing";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { propertySchema } from "@/lib/validation/admin";
import { enquirySchema, inspectionSchema } from "@/lib/validation/public-forms";
import sharp from "sharp";

const rules = { slot_minutes: 60, earliest_hour: 7, latest_hour: 17, allow_saturdays: true, saturday_earliest_hour: 10, saturday_latest_hour: 16, min_notice_hours: 24, max_days_ahead: 60, allow_sundays: false };
const now = new Date("2026-10-26T12:00:00+01:00");

describe("inspection rules", () => {
  it("accepts a weekday slot within hours and notice", () => {
    expect(validateInspectionSlot(toLagosDate("2026-10-28", "10:00"), rules, now)).toBeNull();
  });
  it("rejects short notice, Sundays, out-of-hours and far-future slots", () => {
    expect(validateInspectionSlot(toLagosDate("2026-10-26", "15:00"), rules, now)).toMatch(/24 hours/);
    expect(validateInspectionSlot(toLagosDate("2026-11-01", "10:00"), rules, now)).toMatch(/Sundays/);
    expect(validateInspectionSlot(toLagosDate("2026-10-28", "16:30"), rules, now)).toMatch(/7:00am to 5:00pm/);
    expect(validateInspectionSlot(toLagosDate("2026-10-28", "06:30"), rules, now)).toMatch(/7:00am/);
    expect(validateInspectionSlot(toLagosDate("2027-03-01", "10:00"), rules, now)).toMatch(/60 days/);
  });
  it("converts to and from Abuja time", () => {
    const d = toLagosDate("2026-10-28", "09:30");
    expect(d.toISOString()).toBe("2026-10-28T08:30:00.000Z");
    expect(lagosParts(d)).toMatchObject({ date: "2026-10-28", time: "09:30", day: 3 });
  });
  it("uses Saturday hours on Saturdays", () => {
    expect(validateInspectionSlot(toLagosDate("2026-10-31", "10:00"), rules, now)).toBeNull();
    expect(validateInspectionSlot(toLagosDate("2026-10-31", "09:00"), rules, now)).toMatch(/10:00am to 4:00pm/);
    expect(validateInspectionSlot(toLagosDate("2026-10-31", "10:00"), { ...rules, allow_saturdays: false }, now)).toMatch(/Saturdays/);
  });
  it("offers half-hour start times that finish by closing for the chosen day", () => {
    const weekday = timeOptions(rules, "2026-10-28");
    expect([weekday[0].value, weekday[weekday.length - 1].value]).toEqual(["07:00", "16:00"]);
    const saturday = timeOptions(rules, "2026-10-31");
    expect([saturday[0].value, saturday[saturday.length - 1].value]).toEqual(["10:00", "15:00"]);
    expect(timeOptions(rules, "2026-11-01")).toEqual([]);
  });
});

describe("public form validation", () => {
  it("requires a contact method and consent", () => {
    const r = enquirySchema.safeParse({ full_name: "Ada", message: "Hello there, I need help", consent: "on" });
    expect(r.success).toBe(false);
    const ok = enquirySchema.safeParse({ full_name: "Ada", phone: "0803 123 4567", message: "Hello there, I need help", consent: "on" });
    expect(ok.success && ok.data.phone).toBe("08031234567");
  });
  it("validates inspection references and dates", () => {
    expect(inspectionSchema.safeParse({ property_reference: "mnh-r-01002", full_name: "Ada", phone: "08031234567", preferred_date: "2026-10-28", preferred_time: "10:00", consent: "on" }).success).toBe(true);
    expect(inspectionSchema.safeParse({ property_reference: "x", full_name: "Ada", phone: "1", preferred_date: "tomorrow", preferred_time: "10", consent: "on" }).success).toBe(false);
  });
});

describe("admin property validation", () => {
  const base = {
    title: "Four bedroom duplex",
    transaction_type: "rent",
    category_id: "0b6c8d58-2f1a-4b8e-9a0f-1f2e3d4c5b6a",
    status: "draft",
    billing_frequency: "per_year",
    location_id: "1c7d9e69-3a2b-4c9f-8b1a-2a3b4c5d6e7f",
    area_unit: "sqm",
    price: "4,500,000",
  };
  it("parses comma-formatted prices", () => {
    const r = propertySchema.safeParse(base);
    expect(r.success && r.data.price).toBe(4500000);
  });
  it("requires a rent period and a price", () => {
    expect(propertySchema.safeParse({ ...base, billing_frequency: "one_off" }).success).toBe(false);
    expect(propertySchema.safeParse({ ...base, price: "" }).success).toBe(false);
    expect(propertySchema.safeParse({ ...base, price: "", price_on_request: "on" }).success).toBe(true);
  });
  it("refuses to show an address or pin that was not entered", () => {
    expect(propertySchema.safeParse({ ...base, show_exact_address: "on" }).success).toBe(false);
    expect(propertySchema.safeParse({ ...base, show_map_pin: "on" }).success).toBe(false);
  });
});

describe("HTML sanitising", () => {
  it("removes scripts, event handlers and javascript links", () => {
    const out = sanitizeArticleHtml('<h1>T</h1><p onclick="x()">a<script>alert(1)</script></p><a href="javascript:alert(1)">b</a><img src="http://x/y.png" onerror="z()">');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/);
    expect(out).toContain("<h2>T</h2>");
  });
});

describe("media processing", () => {
  it("detects MP4 headers", () => {
    const mp4 = Buffer.alloc(16);
    mp4.write("ftypisom", 4, "ascii");
    expect(looksLikeMp4(mp4)).toBe(true);
    expect(looksLikeMp4(Buffer.from("<!doctype html><html>"))).toBe(false);
  });

  it("creates WebP variants and strips metadata", async () => {
    const jpeg = await sharp({ create: { width: 2000, height: 1200, channels: 3, background: "#123456" } })
      .jpeg()
      .withExif({ IFD0: { Copyright: "test" } })
      .toBuffer();
    const out = await processImage(jpeg);
    expect(out.variants.map((v) => v.width)).toEqual([400, 800, 1600]);
    const meta = await sharp(out.variants[2].buffer).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
  });

  it("rejects files that are not images", async () => {
    await expect(processImage(Buffer.from("not an image"))).rejects.toThrow();
  });
});
