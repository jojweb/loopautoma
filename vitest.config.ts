import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  // Pick up Vitest tests named *.vitest.* (no .test/.spec suffix) so Bun won't discover them
  include: ["tests/**/*.vitest.{ts,tsx,js,jsx}"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov", "json"],
      reportsDirectory: "coverage",
      include: ["src/components/**"],
      exclude: [
        "src-tauri/**",
        "node_modules/**",
        "tests/**/*.bun.*",
        "vite.config.ts",
        "src/main.tsx",
        "src/App.tsx",
        "src/store.ts",
        "src/tauriBridge.ts",
        "src/types.ts",
      ],
    },
  },
});
