// 只对独立生产样例运行回归，不连接业务后端。
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
export default defineConfig({
  testDir: import.meta.dirname,
  testMatch: 'operations.e2e.ts',
  outputDir: resolve(import.meta.dirname, '../../../../.temp/heavy-lazy-results'),
  workers: 1,
  use: { baseURL: process.env.HEAVY_LAZY_FIXTURE_URL || 'http://127.0.0.1:4316', channel: 'chrome', headless: true },
});
