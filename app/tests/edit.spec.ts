import { test, expect } from "@playwright/test";

const METEOR_PORT = 3000;
const METEOR_URL = `http://localhost:${METEOR_PORT}`;

test.describe("Song Creation & Editing", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${METEOR_URL}/login`, { waitUntil: "networkidle" });
    await page.locator("#one").fill("le");
    await page.locator("#two").fill("coq");
    await page.locator("#three").fill("est");
    await page.locator("#four").fill("mort");
    await page.locator("#four").press("Enter");

    // Wait for login to complete - URL should change or settings icon appear
    await expect(page.locator('[data-tooltip-content="Einstellungen"]')).toBeVisible({ timeout: 10000 });
  });

  test("create new song page loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/new`, { waitUntil: "networkidle" });

    // Check content is visible (not a 404)
    await expect(page.locator(".content")).toBeVisible({ timeout: 10000 });
  });

  test("edit existing song page loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/edit/emil-luckhard/die-internationale`, {
      waitUntil: "networkidle",
    });

    // Check content is visible (not a 404)
    await expect(page.locator(".content")).toBeVisible({ timeout: 10000 });
  });
});