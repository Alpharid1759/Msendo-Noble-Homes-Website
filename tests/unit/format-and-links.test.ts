// tests/unit/format-and-links.test.ts
import { describe, expect, it } from "vitest";
import { mailtoUrl, normalizeWhatsAppNumber, propertyWhatsAppMessage, telUrl, whatsappUrl } from "@/lib/contact-links";
import { csvCell, toCsv } from "@/lib/csv";
import { formatArea, formatCompactMoney, formatPrice, readingMinutes, slugify } from "@/lib/format";

describe("price formatting", () => {
  it("formats naira without decimals and adds the billing period", () => {
    const p = formatPrice({ price: 9500000, price_on_request: false, currency: "NGN", billing_frequency: "per_year" });
    expect(p.amount.replace(/\s/g, "")).toMatch(/₦9,500,000|NGN9,500,000/);
    expect(p.suffix).toBe("per year");
  });

  it("never shows a number when the price is on request", () => {
    expect(formatPrice({ price: 1, price_on_request: true, currency: "NGN", billing_frequency: "one_off" }).amount).toBe("Price on request");
  });

  it("compacts large amounts", () => {
    expect(formatCompactMoney(250_000_000)).toBe("₦250m");
    expect(formatCompactMoney(1_500_000_000)).toBe("₦1.5bn");
    expect(formatCompactMoney(500_000)).toBe("₦500k");
  });

  it("formats areas with units", () => {
    expect(formatArea(1000, "sqm")).toBe("1,000 m²");
    expect(formatArea(null, "sqm")).toBeNull();
  });
});

describe("slugify and reading time", () => {
  it("produces clean slugs", () => {
    expect(slugify("4-Bedroom Duplex & BQ, Jabi!")).toBe("4-bedroom-duplex-and-bq-jabi");
  });
  it("estimates reading time from HTML", () => {
    expect(readingMinutes(`<p>${"word ".repeat(660)}</p>`)).toBe(3);
  });
});

describe("contact links", () => {
  it("converts Nigerian local numbers to international format for WhatsApp", () => {
    expect(normalizeWhatsAppNumber("09028748800")).toBe("2349028748800");
    expect(normalizeWhatsAppNumber("+234 902 874 8800")).toBe("2349028748800");
  });

  it("prefills the WhatsApp message with reference and price", () => {
    const msg = propertyWhatsAppMessage("Msendo Noble Homes", {
      reference: "MNH-S-01003",
      title: "4-bedroom duplex",
      price: 185000000,
      price_on_request: false,
      currency: "NGN",
      billing_frequency: "one_off",
    });
    expect(msg).toContain("Property MNH-S-01003");
    expect(msg).toContain("185,000,000");
    expect(whatsappUrl("2349028748800", msg)).toMatch(/^https:\/\/wa\.me\/2349028748800\?text=Hello%20Msendo/);
  });

  it("builds tel and mailto links", () => {
    expect(telUrl("+234 902 874 8800")).toBe("tel:+2349028748800");
    expect(mailtoUrl("a@b.com", "Ref MNH-1", "Hi there")).toBe("mailto:a@b.com?subject=Ref%20MNH-1&body=Hi%20there");
  });
});

describe("CSV export", () => {
  it("quotes and neutralises spreadsheet formulas", () => {
    expect(csvCell('He said "hi", ok')).toBe('"He said ""hi"", ok"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(toCsv([{ a: 1, b: null }], ["a", "b"])).toBe("﻿a,b\r\n1,\r\n");
  });
});
