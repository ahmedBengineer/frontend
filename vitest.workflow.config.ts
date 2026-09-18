import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(
        __dirname,
        "node_modules/server-only/empty.js",
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["__tests__/workflow-studio/**/*.test.{ts,tsx}"],
    exclude: ["__tests__/workflow-studio/**/*.browser.test.tsx"],
    setupFiles: ["__tests__/workflow-studio/setup.ts"],
    clearMocks: true,
  },
});
