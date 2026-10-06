import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Dedicated Vitest config for `pnpm eval` — runs the RAG eval harness
 * (scripts/eval/) in Node, separate from the jsdom unit-test suite.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["scripts/eval/**/*.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
