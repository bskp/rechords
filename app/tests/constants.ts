import { Page, expect } from "@playwright/test";

export const E2E_TIMEOUT = parseInt(process.env.E2E_TIMEOUT || "2000", 10);
export const METEOR_PORT = 3000;
export const METEOR_URL = `http://localhost:${METEOR_PORT}`;

export async function login(page: Page) {
  await page.goto(`${METEOR_URL}/login`, { waitUntil: "networkidle" });
  await page.locator("#one").fill("le");
  await page.locator("#two").fill("coq");
  await page.locator("#three").fill("est");
  await page.locator("#four").fill("mort");
  await page.locator("#four").press("Enter");
  await expect(page.locator('[data-tooltip-content="Einstellungen"]')).toBeVisible({ timeout: E2E_TIMEOUT });
}