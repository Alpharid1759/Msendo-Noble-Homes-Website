// tests/e2e/admin.spec.ts
import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test("admin area redirects anonymous visitors to sign in", async ({ page }) => {
  await page.goto("/admin/properties");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fproperties/);
});

test("admin API rejects anonymous uploads", async ({ request }) => {
  const res = await request.post("/api/admin/media/finalize", { data: { rawPath: "x", kind: "image" } });
  expect(res.status()).toBe(403);
});

test.describe("signed-in staff", () => {
  test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for a staging staff account");

  test("can sign in, create a draft listing and see it in the list", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email as string);
    await page.getByLabel("Password").fill(password as string);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome");

    await page.goto("/admin/properties/new");
    const title = `E2E draft ${Date.now()}`;
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Property type").selectOption({ index: 1 });
    await page.getByLabel("District or area").selectOption({ index: 1 });
    await page.getByLabel(/Asking price|Rent amount/).fill("1000000");
    await page.getByRole("button", { name: "Create listing" }).click();
    await expect(page.getByText("Listing created")).toBeVisible();

    await page.goto(`/admin/properties?q=${encodeURIComponent(title)}`);
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  });
});
