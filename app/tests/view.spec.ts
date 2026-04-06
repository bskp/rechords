import { test, expect } from "@playwright/test";
import { METEOR_URL } from "./constants";

test.describe("Song Viewing", () => {
  test("view a song", async ({ page }) => {
    await page.goto(`${METEOR_URL}/view/emil-luckhard/die-internationale`, {
      waitUntil: "networkidle",
    });

    const title = page.locator("#chordsheet h1").first();
    await expect(title).toBeVisible({ timeout: 10000 });

    const content = page.locator("#chordsheetContent");
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("print view loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/print/emil-luckhard/die-internationale`, {
      waitUntil: "networkidle",
    });

    // Check print view content is visible
    const content = page.locator("#chordsheet");
    await expect(content).toBeVisible();
  });
});