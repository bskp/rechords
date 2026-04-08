import { test, expect } from "@playwright/test";
import { METEOR_URL, E2E_TIMEOUT } from "./constants";

test.describe("Song Viewing", () => {
  test("view a song", async ({ page }) => {
    await page.goto(`${METEOR_URL}/view/emil-luckhard/die-internationale`, {
      waitUntil: "networkidle",
    });

    const title = page.locator("#chordsheet h1").first();
    await expect(title).toBeVisible({ timeout: E2E_TIMEOUT });

    const content = page.locator("#chordsheetContent");
    await expect(content).toBeVisible({ timeout: E2E_TIMEOUT });
  });

  test("print view loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/print/emil-luckhard/die-internationale`, {
      waitUntil: "networkidle",
    });

    const content = page.locator("#chordsheet");
    await expect(content).toBeVisible();
  });
});