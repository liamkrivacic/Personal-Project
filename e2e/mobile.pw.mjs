import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Pixel 7"] });

const homeUrl = process.env.HOME_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000/";

test("mobile (Pixel 7): hero visible, scroll to projects, tap first card", async ({ page }) => {
  await page.goto(homeUrl);

  await expect(page.getByRole("heading", { name: /liam krivacic/i })).toBeVisible();

  await page.mouse.wheel(0, 3600);
  await expect(page.getByRole("heading", { name: /my projects/i })).toBeVisible({
    timeout: 10000,
  });

  const firstCard = page.locator(".prj-row-wrap a").first();
  await expect(firstCard).toBeVisible({ timeout: 5000 });
  await firstCard.click();

  await expect(page).toHaveURL(/\/projects\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
