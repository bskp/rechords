import { test, expect } from "@playwright/test";
import { METEOR_URL, login } from "./constants";

test.describe("Song Creation & Editing", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
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