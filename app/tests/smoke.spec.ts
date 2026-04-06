import { test, expect } from "@playwright/test";

const METEOR_PORT = 3000;
const METEOR_URL = `http://localhost:${METEOR_PORT}`;

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

    await expect(page.locator('[data-tooltip-content="Zur Startseite"]')).toBeVisible();

    // Filter out known non-critical warnings
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Warning:") &&
        !e.includes("deprecated") &&
        !e.includes("meteor-node-stubs") &&
        !e.includes("util._extend")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("login page loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/login`, { waitUntil: "networkidle" });

    // Check that the login form is visible
    const inputs = page.locator("input");
    await expect(inputs).toHaveCount(4);
  });

  test("login with test credentials", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto(`${METEOR_URL}/login`, { waitUntil: "networkidle" });

    // Fill in the login form (test credentials from server/main.ts)
    const inputs = page.locator("input");
    await inputs.nth(0).fill("le");
    await inputs.nth(1).fill("coq");
    await inputs.nth(2).fill("est");
    await inputs.nth(3).fill("mort");

    // Submit
    await inputs.nth(3).press("Enter");

    await expect(page.locator('[data-tooltip-content="Einstellungen"]')).toBeVisible();

    // Should redirect to home and show the song list
    await expect(page).toHaveURL(/\/$|\/home/);

    // Check for critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Warning:") &&
        !e.includes("deprecated") &&
        !e.includes("meteor-node-stubs") &&
        !e.includes("util._extend")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("document title is set correctly", async ({ page }) => {
    await page.goto(METEOR_URL, { waitUntil: "networkidle" });

    await expect(page.locator('[data-tooltip-content="Zur Startseite"]')).toBeVisible();

    let title = await page.title();
    expect(title).toBe("Hölibu 3000");

    await page.goto(`${METEOR_URL}/view/emil-luckhard/die-internationale`, { waitUntil: "networkidle" });
    await expect(page.locator('[data-tooltip-content="Zur Startseite"]')).toBeVisible();

    title = await page.title();
    expect(title).toBe("Hölibu | Emil Luckhard: Die Internationale");

  });
});
<<<<<<< HEAD
||||||| parent of ed906fa (improving e2e test)

  test("document title is set correctly", async ({ page }) => {
    await page.goto(METEOR_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const title = await page.title();
    expect(title).toBe("rechords");
  });
=======

  test("document title is set correctly", async ({ page }) => {
    await page.goto(METEOR_URL, { waitUntil: "networkidle" });

    await expect(page.locator('[data-tooltip-content="Zur Startseite"]')).toBeVisible();

    let title = await page.title();
    expect(title).toBe("Hölibu 3000");

    await page.goto(`${METEOR_URL}/view/emil-luckhard/die-internationale`, { waitUntil: "networkidle" });
    await expect(page.locator('[data-tooltip-content="Zur Startseite"]')).toBeVisible();

    title = await page.title();
    expect(title).toBe("Hölibu | Emil Luckhard: Die Internationale");

  });
>>>>>>> ed906fa (improving e2e test)
});
