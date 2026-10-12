/** 真实登录页的模式切换及网络请求回归；本地模拟业务响应，不连接真实账户或设备。 */
import { createHash } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

/** appName 与配置保持一致，企业客户端使用带企业前缀的真实路由。 */
const appName = process.env.PASSWORD_LOGIN_APP || 'iot';
/** authRoot 保留企业客户端的路由约束。 */
const authRoot = ['org-iot-client', 'edge-self'].includes(appName) ? '/qa-org/auth' : '/auth';
/** rawPassword 同时覆盖 Unicode、特殊字符和空格，所有测试凭证仅用于本地模拟。 */
const rawPassword = ' 中文密码!+&%🌏 ';

/** installMocks 拦截业务接口，记录浏览器真正发出的请求，并允许控制验证码、请求延迟与应用登录类型配置。 */
async function installMocks(page: Page, baseURL: string, copyright = true, options: { loginTypes?: string[] } = {}) {
  expect(new URL(baseURL).hostname).toBe('127.0.0.1');
  const state = { requests: [] as Record<string, unknown>[], challenge: false, release: undefined as (() => void) | undefined, hold: false };
  /** loginTypes 模拟后端 sys_app_info.login_types；空数组与未配置在后端语义下等价于支持全部登录方式。 */
  const loginTypes = options.loginTypes ?? ['pwd', 'phone', 'email', 'wxOpen'];
  await page.routeWebSocket(/.*/, () => {});
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/')) return url.origin === baseURL ? route.continue() : route.abort();
    let data: unknown = {};
    let code = 200;
    let msg = '成功';
    if (url.pathname.endsWith('/system/common/sys-config/core/get-one')) {
      data = { oem: { title: '密码兼容验证', footer: { isEnable: copyright ? 1 : 2, companyName: '萤科物联', date: '2026' } } };
    } else if (url.pathname.endsWith('/system/tenant/core/get-one')) {
      data = { id: '123', code: 'qa-org', name: '测试企业' };
    } else if (url.pathname.endsWith('/system/app/core/get-one')) {
      data = { id: request.postDataJSON()?.id, name: '大厂', useBy: 'admin', loginTypes };
    } else if (url.pathname.endsWith('/system/user/self/captcha')) {
      data = {
        codeID: 'captcha-local',
        url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="32"%3E%3Ctext x="0" y="24"%3E1234%3C/text%3E%3C/svg%3E',
      };
    } else if (url.pathname.endsWith('/system/user/self/login')) {
      state.requests.push(request.postDataJSON());
      if (state.hold)
        await new Promise<void>((resolve) => {
          state.release = resolve;
        });
      code = state.challenge ? 1000034 : 1000002;
      msg = state.challenge ? '请输入验证码' : '测试密码错误';
    } else if (url.pathname.endsWith('/get-list')) data = { list: [], total: 0 };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code, msg, data }) });
  });
  return state;
}

/** openLogin 打开真实 hash 路由，并等待账号输入框完成挂载。 */
async function openLogin(page: Page, query = '') {
  await page.goto(`/#${authRoot}/login${query}`);
  await expect(page.getByPlaceholder('请输入用户名')).toBeVisible({ timeout: 60_000 });
}

test('页脚双向切换保留输入和 URL，实际请求使用所选摘要且不自动重试', async ({ page, baseURL }, testInfo) => {
  const state = await installMocks(page, baseURL!);
  await openLogin(page, '?redirect=%2Fdashboard');
  await page.getByPlaceholder('请输入用户名').fill('compat-local');
  await page.getByPlaceholder('密码', { exact: true }).fill(rawPassword);
  const originalUrl = page.url();
  const initialInput = await page.getByPlaceholder('密码', { exact: true }).elementHandle();
  await page.getByRole('button', { name: '旧版登录', exact: true }).click();
  expect(page.url()).toBe(originalUrl);
  expect(await initialInput!.evaluate((element) => element.isConnected)).toBe(true);
  await expect(page.getByPlaceholder('密码', { exact: true })).toHaveValue(rawPassword);
  await page.screenshot({ path: testInfo.outputPath('footer-desktop.png'), fullPage: true });
  state.challenge = true;
  state.hold = true;
  await page.locator('button[aria-label="login"]').click();
  await expect.poll(() => state.requests.length).toBe(1);
  await expect(page.getByRole('button', { name: '切换标准登录' })).toBeDisabled();
  expect(state.requests[0]).toMatchObject({
    account: 'compat-local',
    password: createHash('md5').update(rawPassword).digest('hex'),
    pwdType: 2,
    loginType: 'pwd',
    codeID: 'captcha-local',
  });
  state.release!();
  state.hold = false;
  await expect(page.getByRole('button', { name: '切换标准登录' })).toBeEnabled();
  const captcha = page.getByPlaceholder('请输入', { exact: true });
  await expect(captcha).toBeVisible();
  await captcha.fill('1234');
  await page.getByRole('button', { name: '切换标准登录' }).click();
  await expect(captcha).toHaveValue('1234');
  await expect(page.getByPlaceholder('密码', { exact: true })).toHaveValue(rawPassword);
  expect(page.url()).toBe(originalUrl);
  state.challenge = false;
  await page.locator('button[aria-label="login"]').click();
  await expect.poll(() => state.requests.length).toBe(2);
  expect(state.requests[1]).toMatchObject({ password: createHash('sha256').update(rawPassword).digest('hex'), pwdType: 1, code: '1234' });
  await expect(page.getByRole('button', { name: '旧版登录', exact: true })).toBeEnabled();
  expect(state.requests).toHaveLength(2);
});

test('URL、刷新及重新打开的模式优先级一致，验证码登录不显示切换', async ({ page, baseURL }) => {
  await installMocks(page, baseURL!);
  await openLogin(page, '?passwordMode=md5');
  await expect(page.getByRole('button', { name: '切换标准登录' })).toBeVisible();
  await page.getByRole('button', { name: '切换标准登录' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '切换标准登录' })).toBeVisible();
  await openLogin(page);
  await expect(page.getByRole('button', { name: '切换标准登录' })).toBeVisible();
  await openLogin(page, '?passwordMode=sha256');
  await expect(page.getByRole('button', { name: '旧版登录', exact: true })).toBeVisible();
  await page.goto(`/#${authRoot}/code-login`);
  await expect(page.getByRole('button', { name: '旧版登录', exact: true })).toHaveCount(0);
});

test('窄屏和深浅主题下版权关闭仍可操作页脚', async ({ page, baseURL }, testInfo) => {
  await installMocks(page, baseURL!, false);
  await page.setViewportSize({ width: 390, height: 844 });
  await openLogin(page);
  for (const dark of [false, true]) {
    await page.evaluate((value) => document.documentElement.classList.toggle('dark', value), dark);
    const entry = page.getByRole('button', { name: '旧版登录', exact: true });
    await expect(entry).toBeVisible();
    await entry.click();
    await expect(page.getByText('旧版模式 ·', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`footer-${dark ? 'dark' : 'light'}.png`), fullPage: true });
    await page.getByRole('button', { name: '切换标准登录' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('应用 loginTypes 为空数组时仍显示手机号与邮箱登录入口', async ({ page, baseURL }) => {
  await installMocks(page, baseURL!, true, { loginTypes: [] });
  await openLogin(page);
  await expect(page.getByRole('button', { name: '手机号登录' })).toBeVisible();
  await expect(page.getByRole('button', { name: '邮箱登录' })).toBeVisible();
  await expect(page.getByText('忘记密码?')).toBeVisible();
});

test('应用 loginTypes 仅配置 pwd 时隐藏手机号与邮箱登录入口', async ({ page, baseURL }) => {
  await installMocks(page, baseURL!, true, { loginTypes: ['pwd'] });
  await openLogin(page);
  await expect(page.getByRole('button', { name: '手机号登录' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '邮箱登录' })).toHaveCount(0);
  await expect(page.getByText('忘记密码?')).toHaveCount(0);
});
