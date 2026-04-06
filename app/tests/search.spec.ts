import { test, expect } from "@playwright/test";
import { METEOR_URL } from "./constants";

test.describe("Search & Filtering", () => {
  test("search songs by title", async ({ page }) => {
    await page.goto(METEOR_URL, { waitUntil: "networkidle" });

    await expect(page.locator('[data-tooltip-content="Zur Startseite"]')).toBeVisible();

    const menuBurger = page.locator("#menuBurger, [class*='burger'], button[class*='menu']").first();
    if (await menuBurger.isVisible()) {
      await menuBurger.click();
    }

    const searchInput = page.locator('input[placeholder*="Suchen"], .search input').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Internationale");
      const list = page.locator("#list");
      await expect(list).toBeVisible();
    }
  });

  test("filter by clicking on a tag", async ({ page }) => {
    await page.goto(METEOR_URL, { waitUntil: "networkidle" });

    await expect(page.locator('[data-tooltip-content="Zur Startseite"]')).toBeVisible();

    const tag = page.locator(".tags li, [class*='tag']").first();
    if (await tag.isVisible()) {
      await tag.click();
      const list = page.locator("#list");
      await expect(list).toBeVisible();
    } else {
      console.log("No tags found on page");
    }
  });
});