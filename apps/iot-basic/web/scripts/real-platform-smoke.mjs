// 本文件在已部署的 IoT 基础应用上验证真实登录、应用授权、项目上下文与页面刷新。
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// required 读取必填环境变量；参数名用于指出缺失项，返回测试值。
function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少 ${name}`);
  return value;
}

// baseURL 核对目标地址为不含凭据、查询参数和锚点的 HTTP(S) 根地址。
function baseURL(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('UR_KIT_SMOKE_BASE_URL 必须是 HTTP(S) 根地址');
  }
  return url.origin;
}

// responseJSON 等待指定接口的响应并核对 HTTP 与业务成功码，返回响应数据。
async function responseJSON(responsePromise, label) {
  const response = await responsePromise;
  assert.equal(response.status(), 200, `${label} HTTP 状态异常`);
  const payload = await response.json();
  assert.equal(payload.code, 200, `${label} 业务状态异常`);
  return payload.data;
}

// main 在无请求模拟的浏览器会话中完成登录、项目列表及刷新复验。
async function main() {
  const target = baseURL(required('UR_KIT_SMOKE_BASE_URL'));
  const orgID = required('UR_KIT_SMOKE_ORG_ID');
  const tenantCode = required('UR_KIT_SMOKE_TENANT_CODE');
  const appID = process.env.UR_KIT_SMOKE_APP_ID?.trim() || '600';
  const user = required('UR_KIT_SMOKE_USER');
  const password = required('UR_KIT_SMOKE_PASSWORD');
  const projectID = required('UR_KIT_SMOKE_PROJECT_ID');
  const mode = process.env.UR_KIT_SMOKE_ROUTER_MODE?.trim() || 'hash';
  if (!['hash', 'html5'].includes(mode)) throw new Error('UR_KIT_SMOKE_ROUTER_MODE 只支持 hash 或 html5');
  const path = `/${encodeURIComponent(orgID)}`;
  const route = (suffix) => mode === 'hash' ? `/#${path}${suffix}` : `${path}${suffix}`;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  });

  try {
    const page = await browser.newPage();
    const errors = [];
    const projectHeaders = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (!request.url().includes('/api/v1/things/project/info/get-list')) return;
      projectHeaders.push({
        tenant: request.headers()['tenant-code'] === tenantCode,
        app: request.headers()['app-id'] === appID,
      });
    });

    await page.goto(`${target}${route('/auth/login')}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.locator('input').first().waitFor({ timeout: 30_000 });
    await page.locator('input').nth(0).fill(user);
    await page.locator('input').nth(1).fill(password);
    const login = page.waitForResponse((response) => response.url().includes('/api/v1/system/user/self/login'), { timeout: 30_000 });
    const apps = page.waitForResponse((response) => response.url().includes('/api/v1/system/user/self/app/get-list'), { timeout: 30_000 });
    const projects = page.waitForResponse((response) => response.url().includes('/api/v1/things/project/info/get-list'), { timeout: 30_000 });
    await page.locator('button').filter({ hasText: /^(Login|登录)$/ }).click();
    const [, appData, projectData] = await Promise.all([
      responseJSON(login, '登录'),
      responseJSON(apps, '我的应用'),
      responseJSON(projects, '项目列表'),
    ]);
    assert.ok(appData?.list?.some((entry) => String(entry.appID) === appID && entry.tenantCode === tenantCode), '目标应用未授权给当前企业');
    assert.ok(projectData?.list?.some((entry) => String(entry.projectID) === projectID), '项目列表缺少预期项目');
    await page.waitForURL((url) => mode === 'hash' ? url.hash === `#${path}/dashboard` : url.pathname === `${path}/dashboard`, { timeout: 30_000 });

    const reloadProjects = page.waitForResponse((response) => response.url().includes('/api/v1/things/project/info/get-list'), { timeout: 30_000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    const reloadData = await responseJSON(reloadProjects, '刷新后的项目列表');
    assert.ok(reloadData?.list?.some((entry) => String(entry.projectID) === projectID), '刷新后项目上下文丢失');
    assert.equal(page.url(), `${target}${route('/dashboard')}`, '刷新后页面路由变化');
    assert.ok(projectHeaders.length >= 2 && projectHeaders.every((entry) => entry.tenant && entry.app), '项目请求缺少正确的企业或应用头');
    assert.deepEqual(errors, [], '页面出现脚本异常');
    console.log(JSON.stringify({ login: 200, appVisible: true, projectCount: projectData.list.length, reloadProjectCount: reloadData.list.length, pageErrors: 0, mocks: 0 }));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
