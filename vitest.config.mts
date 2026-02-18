import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/unit/**/*.dom.test.ts",
      "tests/unit/**/*.dom.test.tsx",
    ],
    environment: "node",
    setupFiles: ["tests/unit/setup.ts"],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.d.ts",
        "src/components/ui/**",
        "src/app/**/loading.tsx",
        "src/app/icon.svg",
      ],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage/unit",
      thresholds: {
        lines: 5,
        functions: 5,
        branches: 5,
        statements: 5,
      },
    },
  },
});
