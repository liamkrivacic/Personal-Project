import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}/`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.pw.mjs",
  timeout: 60_000,
  workers: 1,
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 90_000,
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    channel: "chrome",
    viewport: { width: 1600, height: 1000 },
  },
});
