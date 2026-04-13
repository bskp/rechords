import { test, expect } from "@playwright/test";
import { METEOR_URL } from "./constants";

test.describe("Smoke Tests", () => {
  test("homepage loads without console errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto(METEOR_URL, { waitUntil: "networkidle" });

    await expect(
      page.locator('[data-tooltip-content="Zur Startseite"]'),
    ).toBeVisible();

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Warning:") &&
        !e.includes("deprecated") &&
        !e.includes("meteor-node-stubs") &&
        !e.includes("util._extend"),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("login page loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/login`, { waitUntil: "networkidle" });

    await expect(page.locator("#one")).toBeVisible();

    const inputs = page.locator("#one, #two, #three, #four");
    await expect(inputs).toHaveCount(4);
  });

  test("document title and content is set correctly", async ({ page }) => {
    await page.goto(METEOR_URL, { waitUntil: "networkidle" });

    await expect(
      page.locator('[data-tooltip-content="Zur Startseite"]'),
    ).toBeVisible();

    let title = await page.title();
    expect(title).toBe("Hölibu 3000");

    await page.goto(`${METEOR_URL}/view/emil-luckhard/die-internationale`, {
      waitUntil: "networkidle",
    });
    await expect(
      page.locator('[data-tooltip-content="Zur Startseite"]'),
    ).toBeVisible();
    await expect(page.locator("#chordsheetContent")).toContainText(
      "Emil Luckhard",
    );
    await expect(page.locator("#sd-ref-Refrain")).toContainText("Völker,");

    title = await page.title();
    expect(title).toBe("Hölibu | Emil Luckhard: Die Internationale");
  });
});
