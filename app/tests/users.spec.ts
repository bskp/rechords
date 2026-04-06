import { test, expect, Page } from "@playwright/test";

const METEOR_PORT = 3000;
const METEOR_URL = `http://localhost:${METEOR_PORT}`;

async function login(page: Page) {
  await page.goto(`${METEOR_URL}/login`, { waitUntil: "networkidle" });
  await page.locator("#one").fill("le");
  await page.locator("#two").fill("coq");
  await page.locator("#three").fill("est");
  await page.locator("#four").fill("mort");
  await page.locator("#four").press("Enter");
  await expect(page.locator('[data-tooltip-content="Einstellungen"]')).toBeVisible({ timeout: 15000 });
}

test.describe("User Management (admin)", () => {
  test("login with test credentials", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await login(page);

    await expect(page).toHaveURL(/\/$|\/home/, { timeout: 10000 });

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Warning:") &&
        !e.includes("deprecated") &&
        !e.includes("meteor-node-stubs") &&
        !e.includes("util._extend")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("list users page loads", async ({ page }) => {
    await login(page);

    await page.goto(`${METEOR_URL}/users`, { waitUntil: "networkidle" });

    await expect(page.locator(".content")).toBeVisible({ timeout: 10000 });
  });
});