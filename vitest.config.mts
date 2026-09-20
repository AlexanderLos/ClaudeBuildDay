import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": fromRoot("./src"),
      // Next resolves "server-only" internally; outside Next it needs a stand-in.
      "server-only": fromRoot("./src/test/server-only-stub.ts"),
    },
  },
  test: {
    // Component tests use jsdom. API route tests opt out per file with
    // `// @vitest-environment node` on the first line.
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
