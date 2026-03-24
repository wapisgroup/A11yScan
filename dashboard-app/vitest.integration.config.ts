import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/__tests__/integration/**/*.test.ts"],
    globalSetup: ["app/__tests__/integration/global-setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    clearMocks: true,
    restoreMocks: true,
    // Run integration tests sequentially — they share a real DB
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "app"),
    },
  },
});
