import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      ".build-api/**",
      ".build-tools/**",
      ".generated/**",
      "dist/**",
      "node_modules/**",
      "sites/**",
    ],
  },
});
