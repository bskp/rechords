import { test, expect } from "@playwright/test";
import { METEOR_URL, E2E_TIMEOUT, login } from "./constants";

test.describe("Progress", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${METEOR_URL}/progress`, {
      waitUntil: "networkidle",
    });
  });

  test("progress page loads", async ({ page }) => {
    const heading = page.locator("h1", { hasText: "Fortschritt" });
    await expect(heading).toBeVisible({ timeout: E2E_TIMEOUT });

    const table = page.locator("table");
    await expect(table).toBeVisible({ timeout: E2E_TIMEOUT });

    const rows = table.locator("tbody tr");
    expect(await rows.count()).toBeGreaterThanOrEqual(5);
  });
});
