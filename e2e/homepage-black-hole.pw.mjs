import { expect, test } from "@playwright/test";

const homeUrl = process.env.HOME_URL ?? "http://127.0.0.1:5176/";

test("homepage presents the black-hole portfolio interface", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(homeUrl);

  await expect(page.locator(".black-hole-fluid-canvas")).toBeVisible();
  await expect(page.locator(".blackhole")).toHaveCount(0);
  await expect(page.locator(".gravity-lanes")).toHaveCount(0);
  await expect(page.locator(".gravity-lane")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /liam krivacic/i })).toBeVisible();
  await expect(page.getByText(/UNSW Electrical Engineering and Computer Science/i)).toBeVisible();

  await page.getByRole("link", { name: /scroll to projects/i }).click();
  await expect(page.getByRole("heading", { name: /case studies pulled/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open rf plasma case study/i })).toBeVisible();
  await expect(page.locator(".project-case-card")).toHaveCount(4);
  expect(pageErrors).toEqual([]);
});
