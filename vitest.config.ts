import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/components/**/*.test.{ts,tsx}", "src/lib/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup-tests.ts"],
    css: true,
    globals: true,
    coverage: { provider: "v8", reporter: ["text", "lcov"] }
  }
});
