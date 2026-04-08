import { test, expect } from "@playwright/test";
import { METEOR_URL, login, E2E_TIMEOUT } from "./constants";

test.describe("User Management (admin)", () => {
  test("login with test credentials", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await login(page);

    await expect(page).toHaveURL(/\/$|\/home/, { timeout: E2E_TIMEOUT });

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

    await expect(page.locator(".content")).toBeVisible({ timeout: E2E_TIMEOUT });
  });
});