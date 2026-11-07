import { defineConfig, devices } from '@playwright/test'

// e2e tests run against the production build (vite preview), like the deployed Pages site.
// Explicit IPv4 host: on Windows 'localhost' may bind to ::1 only, which stalls parallel page loads.
export default defineConfig({
  testDir: '.',
  testMatch: ['labs/*/tests/e2e/**/*.spec.ts', 'tests/e2e/**/*.spec.ts'],
  timeout: 60_000,
  // One worker: on some Windows setups several concurrent browser processes stall on page loads.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npx vite preview --port 4175 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
