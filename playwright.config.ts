import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    env: {
      VITE_API_BASE_URL: "http://localhost:8080/api/v1",
    },
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
