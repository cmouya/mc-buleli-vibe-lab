import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/db/**/*.{test,spec}.{js,ts}"],
    restoreMocks: true,
    testTimeout: 20000,
    fileParallelism: false,
  },
})
