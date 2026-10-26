// tests/e2e/public.spec.ts
import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("home page has search, key CTAs and no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find a property that fits your ambition");
    await expect(page.getByRole("search", { name: "Property search" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore Properties" }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("main navigation links resolve", async ({ page, request }) => {
    for (const path of ["/about", "/properties", "/properties/for-sale", "/properties/for-rent", "/gallery/photos/for-sale", "/gallery/photos/for-rent", "/gallery/videos/for-sale", "/gallery/videos/for-rent", "/services", "/blog", "/contact", "/faq", "/search", "/list-your-property", "/schedule-inspection", "/legal/privacy", "/legal/terms", "/legal/cookies", "/legal/listing-disclaimer", "/legal/accessibility"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
    const missing = await request.get("/this-page-does-not-exist");
    expect(missing.status()).toBe(404);
    await page.goto("/");
  });

  test("hero search sends filters to the listings page as a shareable URL", async ({ page }) => {
    await page.goto("/");
    const form = page.getByRole("search", { name: "Property search" });
    await form.getByText("Rent", { exact: true }).click();
    await form.getByLabel("Bedrooms").selectOption("2");
    await form.getByRole("button", { name: "Search properties" }).click();
    await expect(page).toHaveURL(/\/properties\?.*tx=rent.*beds=2/);
  });

  test("sale page never shows rental listings and vice versa", async ({ page }) => {
    await page.goto("/properties/for-sale");
    await expect(page.locator("article").getByText("For rent", { exact: true })).toHaveCount(0);
    await page.goto("/properties/for-rent");
    await expect(page.locator("article").getByText("For sale", { exact: true })).toHaveCount(0);
  });

  test("contact form shows validation errors without saving", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Full name").fill("A");
    await page.getByLabel("Message").fill("short");
    await page.getByRole("checkbox", { name: /privacy policy/ }).check();
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText("Give us an email address or phone number")).toBeVisible();
  });

  test("mobile menu opens and closes with Escape", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toContain("max-age");
  });

  test("sitemap and robots are generated", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
  });
});
