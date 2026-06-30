import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  cacheDir: "/private/tmp/morning-brief-vitest-cache",
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "node",
    globals: false
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  }
});
