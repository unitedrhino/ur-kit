import type { Locator, Page, Route } from 'playwright/test';

import { expect, test } from 'playwright/test';

/** fulfillJson 用统一格式返回 mock JSON。 */
async function fulfillJson(route: Route, data: unknown) {
  await route.fulfill({
    contentType: 'application/json',
    json: {
      code: 200,
      data,
    },
  });
}

/** mockDeviceLogBootApis 拦截进入组织业务页和设备日志页所需的最小接口。 */
async function mockDeviceLogBootApis(page: Page) {
  await page.context().addCookies([
    {
      name: 'accessToken',
      value: 'mock-token',
      url: 'http://127.0.0.1:3006',
    },
  ]);

  await page.route('**/api/v1/system/common/sys-config/core/get-one', async (route) => {
    await fulfillJson(route, { oem: { title: '联犀' } });
  });

  await page.route('**/api/v1/system/tenant/core/get-one', async (route) => {
    await fulfillJson(route, {
      code: 'real-demo-org',
      id: '1001',
      name: 'Demo Org',
    });
  });

  await page.route('**/api/v1/system/app/core/get-one', async (route) => {
    await fulfillJson(route, {
      id: '600',
      loginTypes: ['pwd'],
      registerTypes: ['phone'],
      tenantCode: 'common',
    });
  });

  await page.route('**/api/v1/system/user/self/get-one', async (route) => {
    await fulfillJson(route, {
      roles: ['admin'],
      tenants: [
        {
          tenant: {
            appIDs: [600],
            code: 'real-demo-org',
            name: 'Demo Org',
          },
          tenantCode: 'real-demo-org',
        },
      ],
      userID: '10001',
      userName: 'demo',
    });
  });

  await page.route('**/api/v1/system/user/self/app/get-list', async (route) => {
    await fulfillJson(route, {
      list: [{ appID: 600, status: 1, tenantCode: 'real-demo-org' }],
    });
  });

  await page.route('**/api/v1/system/user/self/menu/get-list', async (route) => {
    await fulfillJson(route, {
      list: [
        {
          appID: 600,
          children: [
            {
              appID: 600,
              icon: 'mdi:console',
              isHideInMenu: 2,
              menu: {
                component: 'energy/device-space/console/index',
                defaultName: '控制台',
                path: '/device-space/console',
              },
              menuID: 60_011,
              name: '控制台',
              parentMenuID: 60_002,
              sort: 10,
            },
          ],
          icon: 'mdi:devices',
          isHideInMenu: 2,
          menu: {
            defaultName: '设备空间',
            path: '/device-space',
          },
          menuID: 60_002,
          name: '设备空间',
          parentMenuID: 1,
          sort: 20,
        },
      ],
    });
  });

  await page.route('**/api/v1/system/**', async (route) => {
    const url = route.request().url();
    if (
      url.includes('/api/v1/system/common/sys-config/core/get-one') ||
      url.includes('/api/v1/system/tenant/core/get-one') ||
      url.includes('/api/v1/system/app/core/get-one') ||
      url.includes('/api/v1/system/user/self/get-one') ||
      url.includes('/api/v1/system/user/self/app/get-list') ||
      url.includes('/api/v1/system/user/self/menu/get-list')
    ) {
      await route.fallback();
      return;
    }
    await fulfillJson(route, { list: [], total: 0 });
  });

  await page.route('**/api/v1/ai/chat/check-available', async (route) => {
    await fulfillJson(route, { available: false });
  });

  await page.route('**/api/v1/things/project/info/get-list', async (route) => {
    await fulfillJson(route, {
      list: [{ projectID: 'project-1', projectName: '默认项目', status: 1 }],
      total: 1,
    });
  });

  await page.route('**/api/v1/data/**', async (route) => {
    await fulfillJson(route, { list: [[{ status: 2, total: 1 }]], total: 1 });
  });

  await page.route('**/api/v1/things/device/info/get-list', async (route) => {
    await fulfillJson(route, {
      list: [
        {
          deviceAlias: '电表一号',
          deviceName: 'device-001',
          productID: 'product-001',
          productName: '智能电表',
          status: 2,
        },
      ],
      total: 1,
    });
  });

  await page.route('**/api/v1/things/device/info/get-one', async (route) => {
    await fulfillJson(route, {
      deviceAlias: '电表一号',
      deviceName: 'device-001',
      productID: 'product-001',
      productName: '智能电表',
      status: 2,
    });
  });

  await page.route('**/api/v1/things/device/schema/get-list', async (route) => {
    await fulfillJson(route, {
      list: [
        { identifier: 'switch', name: '总开关', tag: 1, type: 1 },
        { identifier: 'temperature', name: '温度', tag: 1, type: 1 },
        { identifier: 'fault', name: '故障事件', tag: 1, type: 2 },
        { identifier: 'restart', name: '重启', tag: 1, type: 3 },
      ],
      total: 4,
    });
  });

  await page.route('**/api/v1/things/device/msg/status-log/get-list', async (route) => {
    const body = route.request().postDataJSON() as { page?: { page?: number } };
    if (body.page?.page === 2) {
      await fulfillJson(route, {
        list: [{ deviceName: 'device-001', productID: 'product-001', status: 2, timestamp: '1779854400000' }],
        total: 21,
      });
      return;
    }

    await fulfillJson(route, {
      list: Array.from({ length: 20 }, (_, index) => ({
        deviceName: 'device-001',
        productID: 'product-001',
        status: index === 0 ? 1 : 2,
        timestamp: String(1779940860000 - index * 60_000),
      })),
      total: 21,
    });
  });

  await page.route('**/api/v1/things/device/msg/send-log/get-list', async (route) => {
    const body = route.request().postDataJSON() as { actions?: string[] };
    const isActionOnly = body.actions?.length === 1 && body.actions[0] === 'actionSend';
    await fulfillJson(route, {
      list: [
        {
          action: isActionOnly ? 'actionSend' : 'propertyControlSend',
          content: '{}',
          dataID: isActionOnly ? 'restart' : 'switch',
          resultCode: 200,
          timestamp: isActionOnly ? '1779940740000' : '1779940800000',
          traceID: 'trace-1',
          user: { nickName: '小王' },
        },
      ],
      total: 1,
    });
  });

  await page.route('**/api/v1/things/device/msg/hub-log/get-list', async (route) => {
    await fulfillJson(route, {
      list: [
        {
          action: 'property',
          content: '{"temperature":26.5}',
          requestID: 'request-1',
          respPayload: '{"code":200}',
          resultCode: '200',
          timestamp: '1779940700000',
          topic: '/thing/property/post',
          traceID: 'trace-hub-1',
        },
      ],
      total: 1,
    });
  });

  await page.route('**/api/v1/things/device/msg/property-log/get-list', async (route) => {
    await fulfillJson(route, {
      list: [{ dataID: 'temperature', dataName: '温度', deviceName: 'device-001', timestamp: '1779940800000', value: '26.5' }],
      total: 1,
    });
  });

  await page.route('**/api/v1/things/device/msg/event-log/get-list', async (route) => {
    await fulfillJson(route, {
      list: [{ dataID: 'fault', params: '{"code":1}', timestamp: '1779940860000', type: 'alert' }],
      total: 1,
    });
  });

  await page.route('**/api/v1/things/**', async (route) => {
    const url = route.request().url();
    if (
      url.includes('/api/v1/things/project/info/get-list') ||
      url.includes('/api/v1/things/device/info/get-list') ||
      url.includes('/api/v1/things/device/info/get-one') ||
      url.includes('/api/v1/things/device/schema/get-list') ||
      url.includes('/api/v1/things/device/msg/status-log/get-list') ||
      url.includes('/api/v1/things/device/msg/send-log/get-list') ||
      url.includes('/api/v1/things/device/msg/hub-log/get-list') ||
      url.includes('/api/v1/things/device/msg/property-log/get-list') ||
      url.includes('/api/v1/things/device/msg/event-log/get-list')
    ) {
      await route.fallback();
      return;
    }
    await fulfillJson(route, { list: [], total: 0 });
  });
}

/** getRequiredBox 读取元素尺寸，用于验证切换日志和时间筛选时工具栏不发生重排。 */
async function getRequiredBox(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

/** expectStableBox 验证区域切换前后尺寸稳定，避免用户可感知的页面抖动。 */
function expectStableBox(before: { height: number; width: number }, after: { height: number; width: number }) {
  expect(Math.abs(before.width - after.width)).toBeLessThan(1);
  expect(Math.abs(before.height - after.height)).toBeLessThan(1);
}

test.describe('设备日志聚合页', () => {
  test('从控制台进入日志页并聚合展示四类日志', async ({ page }) => {
    await mockDeviceLogBootApis(page);

    await page.goto('/demo-org/device-space/console');
    await expect(page.getByText('电表一号')).toBeVisible();

    await page.getByRole('button', { name: '日志' }).click();
    await expect(page).toHaveURL(/\/demo-org\/device-space\/device-logs\/product-001\/device-001$/);
    await expect(page.getByRole('heading', { name: '电表一号' })).toBeVisible();

    await expect(page.getByText('设备上线')).toBeVisible();
    await expect(page.getByRole('button', { name: '展开更多 19 条' })).toBeVisible();
    await page.getByRole('button', { name: '展开更多 19 条' }).click();
    await expect(page.getByText('设备离线').first()).toBeVisible();

    await page.getByRole('button', { name: '加载更多' }).click();
    await expect(page.getByText('2026-05-27')).toBeVisible();

    const tabsBox = await getRequiredBox(page.getByTestId('device-log-tabs'));
    const presetsBox = await getRequiredBox(page.getByTestId('device-log-time-presets'));
    const timelineBox = await getRequiredBox(page.getByTestId('device-log-timeline'));

    await page.getByRole('tab', { name: '控制日志' }).click();
    await expect(page.getByText('属性控制：总开关')).toBeVisible();
    await expect(page.getByTestId('device-log-current-range')).toContainText('当前近30分钟');
    await expect(page.getByTestId('device-log-custom-time-trigger')).toContainText('自定义时间');
    await expect(page.getByTestId('device-log-custom-time-trigger')).not.toContainText('近30分钟');
    expectStableBox(tabsBox, await getRequiredBox(page.getByTestId('device-log-tabs')));
    expectStableBox(timelineBox, await getRequiredBox(page.getByTestId('device-log-timeline')));

    await page.getByTestId('device-log-custom-time-trigger').click();
    await expect(page.getByText('自定义时间范围')).toBeVisible();
    await page.getByTestId('device-log-time-presets').getByText('近30分钟').click();
    await expect(page.getByText('自定义时间范围')).toBeHidden();
    await expect(page.getByText('属性控制：总开关')).toBeVisible();

    await page.getByTestId('device-log-time-presets').getByText('近1小时').click();
    await expect(page.getByText('属性控制：总开关')).toBeVisible();
    expectStableBox(presetsBox, await getRequiredBox(page.getByTestId('device-log-time-presets')));
    expectStableBox(timelineBox, await getRequiredBox(page.getByTestId('device-log-timeline')));

    await page.getByTestId('device-log-custom-time-trigger').click();
    await expect(page.getByText('自定义时间范围')).toBeVisible();

    await page.getByRole('tab', { name: '调试日志' }).click();
    await expect(page.getByText('云端诊断：属性')).toBeVisible();
    await expect(page.getByText('自定义时间范围')).toBeHidden();

    await page.getByTestId('device-log-custom-time-trigger').click();
    await expect(page.getByText('自定义时间范围')).toBeVisible();

    await page.getByTestId('device-log-time-presets').getByText('近7天').click();
    await expect(page.getByText('云端诊断：属性')).toBeVisible();
    await expect(page.getByText('自定义时间范围')).toBeHidden();

    await page.getByTestId('device-log-custom-time-trigger').click();
    await expect(page.getByText('自定义时间范围')).toBeVisible();
    await page.getByRole('tab', { name: '控制日志' }).click();
    await expect(page.getByText('属性控制：总开关')).toBeVisible();
    await page.getByTestId('device-log-time-presets').getByText('近30分钟').click();
    await expect(page.getByText('自定义时间范围')).toBeHidden();

    await page.getByRole('tab', { name: '物模型日志' }).click();
    await expect(page.getByText('事件上报：故障事件')).toBeVisible();
  });
});
