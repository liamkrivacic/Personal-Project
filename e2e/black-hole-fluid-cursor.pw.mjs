import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("cursor releases light streamlets that orbit and then decay", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await mkdir(".verification", { recursive: true });
  await page.goto("http://127.0.0.1:5176/black-hole-fluid/index.html?v=playwright-cursor");
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
