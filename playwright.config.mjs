import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.pw.mjs",
  timeout: 60_000,
  workers: 1,
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 5176",
    url: "http://127.0.0.1:5176/",
    reuseExistingServer: true,
    timeout: 90_000,
  },
  use: {
    ...devices["Desktop Chrome"],
    channel: "chrome",
    viewport: { width: 1600, height: 1000 },
  },
});
