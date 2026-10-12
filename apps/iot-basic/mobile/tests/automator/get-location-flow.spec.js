const fs = require('node:fs');
const path = require('node:path');

const screenshotDir = path.resolve(__dirname, '../../.temp/get-location-application');

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
  await program.start('jest');
  await program.mockUniMethod('request', function mockRequest(options) {
    const url = String(options.url || '');
    const ok = (data) => {
      if (options.success) options.success({ statusCode: 200, data: { code: 200, msg: 'ok', data } });
      if (options.complete) options.complete({ statusCode: 200, data: { code: 200, msg: 'ok', data } });
    };
    if (url.includes('/api/v1/system/user/self/tenant/get-list')) {
      ok({
        list: [{ id: '1', code: 'tenant-a', name: '联犀一号', avatar: '', status: 1, desc: '', isOwner: true }],
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
    if (url.includes('/api/v1/things/device/info/get-one')) {
      ok({
        productID: 'AC',
        deviceName: 'AI_TEST',
        deviceAlias: '客厅空调',
        productName: '空调',
        projectID: 'project-1',
        status: 2,
        position: { latitude: 31.230416, longitude: 121.473701 },
      });
      return;
    }
    if (url.includes('/api/v1/things/device/info/update')) {
      ok({});
      return;
    }
    ok({});
  });
}

describe('wx.getLocation 申请场景', () => {
  beforeAll(async () => {
    ensureScreenshotDir();
    await prepareLoggedInRuntime();
  });

  afterEach(async () => {
    await program.restoreUniMethod('getLocation');
  });

  test('一键配网 WiFi 页只填写 WiFi，不提前要求设备位置', async () => {
    const page = await program.navigateTo('/packageBluetooth/pages/wifi/index?fromScan=1&deviceId=mock-device&deviceName=mock-device');
    await page.waitFor('.field__input', 10000);
    await program.screenshot({ path: path.join(screenshotDir, 'wifi-only.png'), fullPage: true });

    const locationPrompt = await page.$('.location-section');
    expect(locationPrompt).toBeNull();
  });

  test('新建家庭页默认勾选家庭位置并可获取当前位置', async () => {
    await program.mockUniMethod('getLocation', function mockGetLocation(options) {
      const data = { latitude: 31.230416, longitude: 121.473701, errMsg: 'getLocation:ok' };
      if (options.success) options.success(data);
      if (options.complete) options.complete(data);
    });

    const page = await program.navigateTo('/packageUser/pages/family-edit/index?suggestedName=%E9%BB%98%E8%AE%A4%E5%AE%B6%E5%BA%AD');
    await page.waitFor('.fe-location', 10000);
    await program.screenshot({ path: path.join(screenshotDir, 'family-location-default.png'), fullPage: true });

    const title = await page.$('.fe-location__title');
    await expect(title.text()).resolves.toContain('位置');

    const desc = await page.$('.fe-location__desc');
    await expect(desc.text()).resolves.toContain('默认使用当前位置');

    const actions = await page.$$('.fe-location__btn');
    await actions[0].tap();
    await page.waitFor(500);

    const value = await page.$('.fe-location__value');
    await expect(value.text()).resolves.toContain('31.230416');
    await program.screenshot({ path: path.join(screenshotDir, 'family-location-success.png'), fullPage: true });
  });

  test('新建家庭定位拒权时保留手动跳过入口', async () => {
    await program.mockUniMethod('getLocation', function mockGetLocation(options) {
      const error = { errMsg: 'getLocation:fail auth deny', errCode: 2 };
      if (options.fail) options.fail(error);
      if (options.complete) options.complete(error);
    });

    const page = await program.navigateTo('/packageUser/pages/family-edit/index?suggestedName=%E9%BB%98%E8%AE%A4%E5%AE%B6%E5%BA%AD');
    await page.waitFor('.fe-location', 10000);
    const actions = await page.$$('.fe-location__btn');
    await actions[0].tap();
    await page.waitFor(500);

    const errorText = await page.$('.fe-location__error');
    expect(errorText).not.toBeNull();
    await expect(errorText.text()).resolves.toContain('定位权限未开启');
    await expect(actions[1].text()).resolves.toContain('手动跳过');
  });

  test('设备设置页展示设备位置入口', async () => {
    const page = await program.navigateTo('/packageDevice/pages/settings/index?productID=AC&deviceName=AI_TEST');
    await page.waitFor('.ds-row', 10000);
    await program.screenshot({ path: path.join(screenshotDir, 'device-settings-location.png'), fullPage: true });

    const rows = await page.$$('.ds-row__label');
    const labels = [];
    for (const row of rows) labels.push(await row.text());
    expect(labels).toContain('设备位置');
  });
});
