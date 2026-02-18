import baseConfig from "./playwright.config";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

const externalConfig = {
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL,
  },
  webServer: undefined,
};

export default externalConfig;
