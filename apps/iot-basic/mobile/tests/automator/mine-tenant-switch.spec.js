/**
 * 我的页组织切换运行态测试。
 * 验证微信小程序端点击组织切换后使用页面内选择层，而不是依赖系统 actionSheet。
 */

const fs = require('node:fs');
const path = require('node:path');

const screenshotDir = path.resolve(__dirname, '../../.temp/mine-tenant-switch');

function ensureScreenshotDir() {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function prepareLoggedInRuntime() {
  await program.evaluate(() => {
    uni.setStorageSync('token', 'automator-token');
    uni.setStorageSync('iot_user', JSON.stringify({
      data: { userID: 'automator-user', nickName: '自动化用户', phone: '13800000000' },
      expireAt: 0,
    }));
    uni.setStorageSync('current_tenant', JSON.stringify({ code: 'tenant-a', name: '联犀一号' }));
    uni.setStorageSync('current_family_map', JSON.stringify({
      'tenant-a': { projectID: 'project-1', projectName: '默认家庭' },
    }));
  });
  await program.mockUniMethod('request', function mockRequest(options) {
    const url = String(options.url || '');
    const ok = (data) => {
      if (options.success) options.success({ statusCode: 200, data: { code: 200, msg: 'ok', data } });
      if (options.complete) options.complete({ statusCode: 200, data: { code: 200, msg: 'ok', data } });
    };
    if (url.includes('/api/v1/system/user/self/tenant/get-list')) {
      ok({
        list: [
          { id: '1', code: 'tenant-a', name: '联犀一号', avatar: '', status: 1, desc: '', isOwner: true },
          { id: '2', code: 'tenant-b', name: '联犀二号', avatar: '', status: 1, desc: '', isOwner: false },
        ],
      });
      return;
    }
    if (url.includes('/api/v1/things/project/info/get-list')) {
      ok({
        list: [{ projectID: 'project-1', projectName: '默认家庭', status: 1 }],
        total: 1,
      });
      return;
    }
    ok({});
  });
}

describe('我的页组织切换', () => {
  beforeAll(async () => {
    ensureScreenshotDir();
    await prepareLoggedInRuntime();
  });

  test('点击组织切换后弹出页面内组织选择层', async () => {
    const page = await program.reLaunch('/pages/mine/index');
    await page.waitFor('.mine-menu__item--tenant', 10000);

    const tenantSwitch = await page.$('.mine-menu__item--tenant');
    expect(tenantSwitch).not.toBeNull();
    await tenantSwitch.tap();
    await page.waitFor('.mine-picker-sheet', 10000);
    await program.screenshot({ path: path.join(screenshotDir, 'tenant-picker-open.png'), fullPage: true });

    const picker = await page.$('.mine-picker-sheet');
    expect(picker).not.toBeNull();

    const tenantItems = await page.$$('.mine-picker-sheet__item-name');
    const texts = [];
    for (const item of tenantItems) texts.push(await item.text());
    expect(texts).toContain('联犀一号');
    expect(texts).toContain('联犀二号');
  });
});
