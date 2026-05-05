import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000/";
const fluidUrl = process.env.FLUID_URL ?? new URL("/black-hole-fluid/index.html?v=playwright-cursor", baseUrl).toString();

test("cursor releases light streamlets that orbit and then decay", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await mkdir(".verification", { recursive: true });
  await page.goto(fluidUrl);
  await expect(page.locator("#fluid-canvas")).toBeVisible();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: ".verification/fluid-playwright-idle.png" });

  await page.mouse.move(250, 570);
  await page.mouse.move(430, 520, { steps: 18 });
  await page.mouse.move(625, 485, { steps: 22 });
  await page.mouse.move(760, 525, { steps: 20 });
  await page.mouse.move(865, 600, { steps: 18 });
  await page.mouse.move(930, 690, { steps: 14 });
  await page.waitForTimeout(120);
  await page.screenshot({ path: ".verification/fluid-playwright-orbiting.png" });

  await page.waitForTimeout(3400);
  await page.screenshot({ path: ".verification/fluid-playwright-decayed.png" });

  expect(pageErrors).toEqual([]);
});
