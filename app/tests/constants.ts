import { Page, expect } from "@playwright/test";

export const E2E_TIMEOUT = parseInt(process.env.E2E_TIMEOUT || "2000", 10);
export const METEOR_PORT = process.env["MY_SERVER_PORT"];
export const METEOR_URL = `http://localhost:${METEOR_PORT}`;

console.log(METEOR_URL);

export async function login(page: Page) {
  await page.goto(`${METEOR_URL}/login`, { waitUntil: "networkidle" });
  await page.locator("#one").fill("le");
  await page.locator("#two").fill("coq");
  await page.locator("#three").fill("est");
  await page.locator("#four").fill("mort");
  await page.locator("#four").press("Enter");
  await expect(
    page.locator('[data-tooltip-content="Einstellungen"]'),
  ).toBeVisible({ timeout: E2E_TIMEOUT });
}

export async function gotoApp(page: Page, path = METEOR_URL) {
  await page.goto(path, { waitUntil: "networkidle" });
  await expect(
    page.locator('[data-tooltip-content="Zur Startseite"]'),
  ).toBeVisible();
}
