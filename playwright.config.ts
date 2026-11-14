import { defineConfig, devices } from '@playwright/test';

const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:3000';

/**
 * E2E chạy trên toàn bộ stack Docker Compose (web + api + db) với MOCK_PAYMENT_MODE=success.
 * Kịch bản E2E-T02 tự tạo lại container `api` ở chế độ `failure` rồi khôi phục `success`.
 * Cần có `.env` (copy từ `.env.example`) hoặc export JWT_SECRET/POSTGRES_PASSWORD trước khi chạy.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Giao diện mobile-first nên kiểm thử với viewport điện thoại.
    ...devices['Pixel 7'],
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'docker compose up --build',
    url: WEB_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 30_000 },
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...(process.env as Record<string, string>),
      MOCK_PAYMENT_MODE: 'success',
    },
  },
});
