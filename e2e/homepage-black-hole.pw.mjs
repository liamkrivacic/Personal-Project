import { expect, test } from "@playwright/test";

const homeUrl = process.env.HOME_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000/";

test("homepage presents the black-hole portfolio interface", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(homeUrl);

  const blackHoleFrame = page.frameLocator("iframe.hero-background-frame");
  await expect(blackHoleFrame.locator("#fluid-canvas")).toBeVisible();
  await expect(page.locator(".blackhole")).toHaveCount(0);
  await expect(page.locator(".gravity-lanes")).toHaveCount(0);
  await expect(page.locator(".gravity-lane")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /liam krivacic/i })).toBeVisible();
  await expect(page.getByText(/UNSW Electrical Engineering and Computer Science/i)).toBeVisible();

  await page.mouse.move(760, 420);
  for (let index = 0; index < 14; index += 1) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(120);

    if ((await page.locator(".project-sticky-header-visible").count()) > 0) {
      break;
    }
  }

  await page.locator("#rf-plasma").evaluate((element) => {
    element.scrollIntoView({ block: "start", behavior: "instant" });
  });

  await expect(page.getByRole("heading", { name: /rf plasma/i })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.locator(".project-sticky-header")).toBeVisible();
  await expect(page.locator(".project-header-nav button[aria-current='step']")).toHaveCount(1);
  await expect(page.locator(".project-panel-shell")).toHaveCount(4);
  await expect(page.locator(".project-plate")).toHaveCount(4);
  await expect(page.locator(".project-media-frame")).toHaveCount(4);
  await expect(page.locator(".project-plate-overview p")).not.toHaveCount(0);
  await expect(page.locator(".project-chapter-card")).toHaveCount(0);
  await expect(page.locator(".project-word")).toHaveCount(0);
  await expect(page.locator(".project-copy-word")).toHaveCount(0);
  await expect(page.locator(".project-morph-layer")).toHaveCount(0);

  await page.locator("#sumobot").evaluate((element) => {
    element.scrollIntoView({ block: "start", behavior: "instant" });
  });

  await expect(page.locator("#sumobot")).toBeInViewport({ ratio: 0.8 });
  await page.waitForTimeout(250);
  await expect(page.getByRole("heading", { name: /sumobot/i })).toBeVisible({ timeout: 5000 });
  await expect(page.locator(".project-header-nav button[aria-current='step']")).toContainText(/sumobot/i);
  expect(pageErrors).toEqual([]);
});
