/** 在指定 Web 应用的真实登录页上执行本地回归，所有业务请求由测试拦截。 */
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

/** appName 选择真实宿主，不为测试复制登录 UI。 */
const appName = process.env.PASSWORD_LOGIN_APP || 'iot';
/** apps 限定本次触及的五种表单宿主。 */
const apps = ['iot', 'org-iot-client', 'edge-manage', 'edge-self', 'org-structure-monitor'];
if (!apps.includes(appName)) throw new Error(`不支持的登录测试应用：${appName}`);
/** webRoot 用于解析工作区依赖和应用目录。 */
const webRoot = resolve(import.meta.dirname, '../../../..');
/** port 为各宿主分配独立端口，避免与日常开发服务冲突。 */
const port = 43131 + apps.indexOf(appName);
/** baseURL 只允许本地开发服务器。 */
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: import.meta.dirname,
  testMatch: 'password-login.spec.ts',
  outputDir: resolve(webRoot, '../../.temp/md5-login', appName),
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: { baseURL, channel: 'chrome', headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure', serviceWorkers: 'block' },
  webServer: {
    cwd: resolve(webRoot, 'apps', appName),
    command: `pnpm exec vite --mode development --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      VITE_GLOB_API_URL: baseURL,
      VITE_ROUTER_HISTORY: 'hash',
      VITE_GLOB_LOGIN_PASSWORD_MODE: 'sha256',
      VITE_DEVTOOLS: 'false',
      BACKEND_URL: 'http://127.0.0.1:9',
    },
  },
});
