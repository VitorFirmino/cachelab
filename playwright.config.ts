import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3001";

export default defineConfig({
  expect: { timeout: 10_000 },
  testIgnore: ["tests/unit/**"],

  globalSetup: require.resolve("./tests/helpers/load-env"),
  webServer: {
    command: "pnpm exec next start -p 3001",
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
