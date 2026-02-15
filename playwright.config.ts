import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";

export default defineConfig({
  expect: { timeout: 10_000 },

  globalSetup: require.resolve("./tests/helpers/load-env"),
  webServer: {
    command: "pnpm start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
  },
});
