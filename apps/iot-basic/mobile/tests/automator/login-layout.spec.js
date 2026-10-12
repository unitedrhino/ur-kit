const fs = require('node:fs');
const path = require('node:path');

const screenshotDir = path.resolve(__dirname, '../../.temp/login-layout');

function ensureScreenshotDir() {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

describe('登录页布局', () => {
  beforeAll(() => {
    ensureScreenshotDir();
  });

  test('logo 居中，底部按标语、协议、一键快捷登录、账号密码登录排列', async () => {
    const page = await program.reLaunch('/packageUser/pages/login/index');
    await page.waitFor('.login-page', 10000);
    await program.screenshot({ path: path.join(screenshotDir, 'login-wx-layout.png'), fullPage: true });

    const logo = await page.$('.login-brand .login-logo');
    const slogan = await page.$('.login-bottom .login-slogan');
    const legal = await page.$('.login-bottom .legal-row');
    const autoLoginAction = await page.$('.login-bottom .wx-auto-login-status');
    const switchLink = await page.$('.login-bottom .login-switch__text');

    expect(logo).not.toBeNull();
    expect(slogan).not.toBeNull();
    expect(legal).not.toBeNull();
    expect(autoLoginAction).not.toBeNull();
    expect(switchLink).not.toBeNull();
    await expect(slogan.text()).resolves.toContain('一个 App 管理你的智能设备');
    await expect(autoLoginAction.text()).resolves.toContain('一键快捷登录');
    await expect(switchLink.text()).resolves.toContain('使用账号密码登录');
  });
});
