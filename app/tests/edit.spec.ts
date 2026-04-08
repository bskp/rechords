import { test, expect } from "@playwright/test";
import { METEOR_URL, login, E2E_TIMEOUT } from "./constants";

test.describe("Song Creation & Editing", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("create new song page loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/new`, { waitUntil: "networkidle" });

    await expect(page.locator("textarea")).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test("edit existing song page loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/edit/emil-luckhard/die-internationale`, {
      waitUntil: "networkidle",
    });

    await expect(page.locator("textarea")).toBeVisible({ timeout: E2E_TIMEOUT });
  });

});