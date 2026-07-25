import { test, expect } from "@playwright/test";
import { METEOR_URL, login, E2E_TIMEOUT } from "./constants";

test.describe("Song Creation & Editing", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("create new song page loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/new`, { waitUntil: "networkidle" });

    await expect(page.locator("textarea")).toBeVisible({
      timeout: E2E_TIMEOUT,
    });
  });

  test("edit existing song page loads", async ({ page }) => {
    await page.goto(`${METEOR_URL}/edit/emil-luckhard/die-internationale`, {
      waitUntil: "networkidle",
    });
    const textarea = page.locator("textarea").first();

    await expect(textarea).toBeVisible({
      timeout: E2E_TIMEOUT,
    });

    const content = await textarea.inputValue();

    expect(content).toContain("Die Internationale");
    expect(content).toContain("Emil Luckhard");
    expect(content).toContain("Wacht [G]auf, Verdammte");
  });

  test("save new song via right-click", async ({ page }) => {
    await page.goto(`${METEOR_URL}/new`, { waitUntil: "networkidle" });

    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });

    await textarea.fill(
      "Ich Ess Blumen\nDie Doktoren\n========\n\n1:\nPferdi text",
    );

    await page.locator("#editor").click({ button: "right" });

    await page.waitForURL(/\/view\//, { timeout: E2E_TIMEOUT });

    await expect(page.getByText("Pferdi text")).toBeVisible();
  });

  test("unsaved edits survive back-navigation and are dropped on save", async ({
    page,
  }) => {
    const url = `${METEOR_URL}/edit/emil-luckhard/die-internationale`;
    const uniqueText = `draft-uuid-${Date.now()}`;

    await page.goto(url, { waitUntil: "networkidle" });
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });

    const original = await textarea.inputValue();
    await textarea.fill(`${original}\n\n\n${uniqueText}`);

    // The dirty marker appearing means the mirroring effect has run.
    await expect(page.locator("#dirty")).toBeAttached({ timeout: E2E_TIMEOUT });

    // Leave without saving. beforeunload cannot cover this, the draft must.
    await page.goBack();
    await page.goto(url, { waitUntil: "networkidle" });

    await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(textarea).toHaveValue(new RegExp(uniqueText), {
      timeout: E2E_TIMEOUT,
    });
    await expect(page.locator("#dirty")).toBeAttached();

    // Saving persists the text and drops the draft.
    await page.locator("#editor").click({ button: "right" });
    await page.waitForURL(/\/view\//, { timeout: E2E_TIMEOUT });

    expect(
      await page.evaluate(() =>
        Object.keys(window.localStorage).filter((k) =>
          k.startsWith("rechords.draft."),
        ),
      ),
    ).toEqual([]);

    await page.goto(url, { waitUntil: "networkidle" });
    await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });
    expect(await textarea.inputValue()).toContain(uniqueText);
  });

  test("insert lyrics line with unique text appears after save", async ({
    page,
  }) => {
    await page.goto(`${METEOR_URL}/view/emil-luckhard/die-internationale/`, {
      timeout: E2E_TIMEOUT,
    });

    // using timestamp ensures multiple runs of e2e playwright are ok and still ensure being tested correctly
    const uniqueText = `test-uuid-${Date.now()}`;
    await expect(page.locator("#chordsheetContent").first()).not.toContainText(
      uniqueText,
    );

    await page.locator("#chordsheetContent").click({ button: "right" });

    await page.waitForURL(/\/edit\/emil-luckhard\/die-internationale/, {
      timeout: E2E_TIMEOUT,
    });

    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: E2E_TIMEOUT });

    const currentContent = await textarea.inputValue();
    await textarea.fill(currentContent + `\n\n\n${uniqueText}`);

    await page.locator("#editor").click({ button: "right" });

    await page.waitForURL(/\/view\/emil-luckhard\/die-internationale/, {
      timeout: E2E_TIMEOUT,
    });

    await expect(page.locator("#chordsheetContent")).toContainText(uniqueText);
  });
});
