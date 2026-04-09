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

  test("save new song via right-click", async ({ page }) => {
    await page.goto(`${METEOR_URL}/new`, { waitUntil: "networkidle" });

    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });

    await textarea.fill("Ich Ess Blumen\nDie Doktoren\n========\n\n1:\nPferdi text");

    await page.locator("#editor").click({button: 'right'})

    await page.waitForURL(/\/view\//, { timeout: E2E_TIMEOUT });

    await expect(page.locator("h1").first()).toContainText("Ich Ess Blumen");
  });

  test("insert lyrics line with unique text appears after save", async ({ page }) => {
    await page.goto(`${METEOR_URL}/view/emil-luckhard/die-internationale/`, {
      timeout: E2E_TIMEOUT,
    });

    // using timestamp ensures multiple runs of e2e playwright are ok and still ensure being tested correctly
    const uniqueText = `test-uuid-${Date.now()}`;
    await expect(page.locator("#chordsheetContent").first()).not.toContainText(uniqueText);

    await page.locator("#chordsheetContent").click({button:'right'})

    await page.waitForURL(/\/edit\/emil-luckhard\/die-internationale/, {
      timeout: E2E_TIMEOUT
    })

    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });


    const currentContent = await textarea.inputValue();
    await textarea.fill(currentContent + `\n\n\n${uniqueText}`);


    await page.locator("#editor").click({button: 'right'})

    await page.waitForURL(/\/view\/emil-luckhard\/die-internationale/, {
      timeout: E2E_TIMEOUT,
    });

    await expect(page.locator("#chordsheetContent")).toContainText(uniqueText);


  });
});