import { expect, test } from "@playwright/test";

const homeUrl = process.env.HOME_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000/";

test("homepage presents the black-hole portfolio interface", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(homeUrl);

  const blackHoleFrame = page.frameLocator("iframe.journey-bg-frame");
  await expect(blackHoleFrame.locator("#fluid-canvas")).toBeVisible();
  await expect(page.getByRole("heading", { name: /liam krivacic/i })).toBeVisible();
  await expect(page.getByText(/Electrical Engineering \+ Computer Science/i)).toBeVisible();

  await page.mouse.wheel(0, 3600);
  await expect(page.getByRole("heading", { name: /my projects/i })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole("heading", { name: /HFSS Directional Coupler/i })).toBeVisible();
  await expect(page.getByText(/View case study/i).first()).toBeVisible();

  await page.getByRole("button", { name: "Software & Computer Science" }).click();
  await expect(page.getByRole("heading", { name: /Automated Stub-Tuner Optimisation/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /HFSS Directional Coupler/i })).toBeHidden();

  await page.getByRole("button", { name: "All" }).click();
  await expect(page.getByRole("heading", { name: /HFSS Directional Coupler/i })).toBeVisible();

  expect(pageErrors).toEqual([]);
});
