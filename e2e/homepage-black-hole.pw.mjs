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

test("the RF coupler row links to its case study and back", async ({ page }) => {
  await page.goto(homeUrl);

  await page.mouse.wheel(0, 3600);
  const couplerHeading = page.getByRole("heading", { name: /HFSS Directional Coupler/i });
  await expect(couplerHeading).toBeVisible({ timeout: 10000 });
  await couplerHeading.click();

  await expect(page).toHaveURL(/\/projects\/rf-coupler-coax$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /HFSS Directional Coupler/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /All projects/i }).click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.getByRole("heading", { name: /my projects/i })).toBeVisible({
    timeout: 10000,
  });
  // toBeVisible() ignores opacity — assert the reveal actually completed so the
  // user lands on the projects, not the mid-dive black-hole wash.
  await expect(page.locator(".prj-col")).toHaveCSS("opacity", "1");
  // The first project card must actually render (its reveal is JS-driven and
  // separate from the heading) — guards the row-reveal scheduler regression.
  await expect(page.locator(".prj-row-wrap").first()).toHaveCSS("opacity", "1");
  expect(await page.evaluate(() => window.scrollY > window.innerHeight * 3)).toBe(true);
});
