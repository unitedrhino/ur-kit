import { defineConfig, devices } from 'playwright/test';
import path from 'node:path';

/**
 * org-iot-client Playwright Smoke 测试配置。
 *
 * 覆盖组织前缀路由的最小浏览器契约：根路径、有效 org、无效 org。
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3006';
const REPORT_DIR = path.join(import.meta.dirname, 'node_modules/.e2e/report');
const RESULT_DIR = path.join(import.meta.dirname, 'node_modules/.e2e/results');

export default defineConfig({
  testDir: './__tests__/e2e',
  timeout: 120_000,
  expect: { timeout: 25_000 },
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: REPORT_DIR, open: 'never' }],
  ],
  outputDir: RESULT_DIR,

  use: {
    baseURL: BASE_URL,
    locale: 'zh-CN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'pnpm vite --mode development --host 127.0.0.1 --port 3006',
    reuseExistingServer: true,
    timeout: 60_000,
    url: BASE_URL,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
          ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } }
          : {}),
      },
    },
  ],
});
