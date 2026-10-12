import type { Page, Route } from 'playwright/test';

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

/** mockConsoleMobileApis 拦截移动端控制台 smoke 需要的最小接口。 */
async function mockConsoleMobileApis(page: Page) {
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

  await page.route('**/api/v1/things/area/info/get-list', async (route) => {
    await fulfillJson(route, {
      list: [
        { areaID: 'area-1', areaIDPath: 'area-1', areaName: '一层配电间' },
        { areaID: 'area-2', areaIDPath: 'area-1/area-2', areaName: '二层走廊', parentAreaID: 'area-1' },
      ],
      total: 2,
    });
  });

  await page.route('**/api/v1/things/group/info/get-list', async (route) => {
    await fulfillJson(route, { list: [], total: 0 });
  });

  await page.route('**/api/v1/data/query/info/get-list', async (route) => {
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
          withProperties: {
            CPUUse: { value: '41.1' },
            MemUse: { value: '54' },
            switch: { value: 0 },
          },
        },
        {
          deviceAlias: '电表二号',
          deviceName: 'device-002',
          productID: 'product-001',
          productName: '智能电表',
          status: 2,
          withProperties: {
            CPUUse: { value: '39.8' },
            MemUse: { value: '48' },
            switch: { value: 1 },
          },
        },
      ],
      total: 2,
    });
  });

  await page.route('**/api/v1/things/schema/common/get-list', async (route) => {
    await fulfillJson(route, {
      list: [
        {
          affordance: JSON.stringify({ controlMode: 1, define: { type: 'bool' }, mode: 'rw' }),
          id: 'schema-switch',
          identifier: 'switch',
          name: '总开关',
        },
      ],
      total: 1,
    });
  });

  await page.route('**/api/v1/things/device/interact/property-control-batch-send', async (route) => {
    await fulfillJson(route, [{ code: 200, deviceName: 'device-001', productID: 'product-001' }]);
  });

  await page.route('**/api/v1/things/device/info/batch-update', async (route) => {
    await fulfillJson(route, {});
  });

  await page.route('**/api/v1/data/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/v1/data/query/info/get-list')) {
      await route.fallback();
      return;
    }
    await fulfillJson(route, { list: [], total: 0 });
  });

  await page.route('**/api/v1/things/**', async (route) => {
    const url = route.request().url();
    if (
      url.includes('/api/v1/things/project/info/get-list') ||
      url.includes('/api/v1/things/area/info/get-list') ||
      url.includes('/api/v1/things/group/info/get-list') ||
      url.includes('/api/v1/things/device/info/get-list') ||
      url.includes('/api/v1/things/schema/common/get-list') ||
      url.includes('/api/v1/things/device/interact/property-control-batch-send') ||
      url.includes('/api/v1/things/device/info/batch-update')
    ) {
      await route.fallback();
      return;
    }
    await fulfillJson(route, { list: [], total: 0 });
  });
}

test.describe('设备空间控制台移动端', () => {
  test('390px 视口可完成区域选择、设备勾选和控制弹窗打开', async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await mockConsoleMobileApis(page);

    await page.goto('/demo-org/device-space/console');

    await expect(page.getByTestId('device-console-mobile-area-trigger')).toBeVisible();
    await page.getByTestId('device-console-mobile-area-trigger').click();
    const areaDialog = page.getByRole('dialog', { name: '选择区域' });
    await expect(areaDialog).toBeVisible();
    await expect(areaDialog.getByText('一层配电间')).toBeVisible();
    await page.getByRole('button', { name: '完成' }).click();

    const mobileCardList = page.getByTestId('device-console-mobile-card-list');
    await expect(mobileCardList).toBeVisible();
    await expect(mobileCardList.getByText('电表一号')).toBeVisible();
    await page.getByTestId('device-console-mobile-card-select').first().click();
    await expect(page.getByText('已选 1 台')).toBeVisible();

    await page.getByTestId('device-console-mobile-card-control').first().click();
    const controlDialog = page.getByRole('dialog', { name: /单设备控制|群控设备/ });
    await expect(controlDialog).toBeVisible();
    await expect(controlDialog.getByText('总开关')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe('设备空间控制台桌面端', () => {
  test('表格行勾选和全选后展示批量控制入口', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await mockConsoleMobileApis(page);

    await page.goto('/demo-org/device-space/console');

    const desktopTable = page.getByTestId('device-console-desktop-table');
    await expect(desktopTable).toBeVisible();
    await expect(desktopTable.getByText('电表一号')).toBeVisible();
    await expect(desktopTable.getByText('电表二号')).toBeVisible();

    const tableCheckboxes = desktopTable.getByRole('checkbox');
    await expect(tableCheckboxes).toHaveCount(3);
    await tableCheckboxes.nth(1).click();
    await expect(page.getByText('已选 1 台')).toBeVisible();
    await expect(page.getByRole('button', { name: '控制' })).toBeVisible();

    await tableCheckboxes.nth(0).click();
    await expect(page.getByText('已选 2 台')).toBeVisible();
    await expect(page.getByRole('button', { name: '控制' })).toBeVisible();
  });

  test('控制弹窗右上关闭按钮不遮挡下发控制按钮', async ({ page }) => {
    await page.setViewportSize({ height: 768, width: 1100 });
    await mockConsoleMobileApis(page);

    await page.goto('/demo-org/device-space/console');

    const desktopTable = page.getByTestId('device-console-desktop-table');
    await expect(desktopTable).toBeVisible();
    await desktopTable.getByRole('checkbox').nth(1).click();
    await page.getByRole('button', { name: '控制' }).click();

    const controlDialog = page.getByRole('dialog', { name: /单设备控制|群控设备/ });
    await expect(controlDialog).toBeVisible();

    const applyButtonBox = await controlDialog.getByRole('button', { name: '下发控制' }).boundingBox();
    const closeButtonBox = await controlDialog.getByRole('button', { name: 'Close' }).boundingBox();
    expect(applyButtonBox).not.toBeNull();
    expect(closeButtonBox).not.toBeNull();
    expect(applyButtonBox!.x + applyButtonBox!.width + 8).toBeLessThanOrEqual(closeButtonBox!.x);
  });

  test('群控设备下拉保留勾选状态并支持重选', async ({ page }) => {
    await page.setViewportSize({ height: 768, width: 1100 });
    await mockConsoleMobileApis(page);

    await page.goto('/demo-org/device-space/console');

    const desktopTable = page.getByTestId('device-console-desktop-table');
    await expect(desktopTable).toBeVisible();
    await desktopTable.getByRole('checkbox').nth(0).click();
    await page.getByRole('button', { name: '控制' }).click();

    const controlDialog = page.getByRole('dialog', { name: /单设备控制|群控设备/ });
    await expect(controlDialog).toBeVisible();
    const devicePicker = page.getByRole('combobox');
    await devicePicker.click();

    const firstDevice = page.getByRole('menuitemcheckbox', { name: '电表一号' });
    const secondDevice = page.getByRole('menuitemcheckbox', { name: '电表二号' });
    await expect(firstDevice).toHaveAttribute('aria-checked', 'true');
    await expect(secondDevice).toHaveAttribute('aria-checked', 'true');

    await secondDevice.click();
    await expect(secondDevice).toHaveAttribute('aria-checked', 'false');
    await expect(firstDevice).toHaveAttribute('aria-checked', 'true');

    await secondDevice.click();
    await expect(secondDevice).toHaveAttribute('aria-checked', 'true');
    await expect(firstDevice).toHaveAttribute('aria-checked', 'true');
  });

  test('设备列表属性字段默认隐藏并本地保存显示选择', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await mockConsoleMobileApis(page);

    await page.goto('/demo-org/device-space/console');

    const desktopTable = page.getByTestId('device-console-desktop-table');
    await expect(desktopTable).toBeVisible();
    await expect(desktopTable.getByText('CPUUse')).toBeHidden();
    await expect(desktopTable.getByText('MemUse')).toBeHidden();
    await expect(desktopTable.getByText('41.1')).toBeHidden();

    await page.getByRole('button', { name: '列显示' }).click();
    const productColumn = page.getByRole('menuitemcheckbox', { name: '产品' });
    const cpuColumn = page.getByRole('menuitemcheckbox', { name: 'CPUUse' });
    await expect(productColumn).toHaveAttribute('aria-checked', 'true');
    await expect(cpuColumn).toHaveAttribute('aria-checked', 'false');

    await productColumn.click();
    await expect(desktopTable.getByText('产品')).toBeHidden();

    await cpuColumn.click();
    await expect(desktopTable.getByText('CPUUse')).toBeVisible();
    await expect(desktopTable.getByText('41.1')).toBeVisible();

    await page.reload();
    await expect(desktopTable).toBeVisible();
    await expect(desktopTable.getByText('产品')).toBeHidden();
    await expect(desktopTable.getByText('CPUUse')).toBeVisible();
    await expect(desktopTable.getByText('41.1')).toBeVisible();
  });

  test('设备列表列显示支持拖拽排序并本地保存顺序', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await mockConsoleMobileApis(page);

    await page.goto('/demo-org/device-space/console');

    const desktopTable = page.getByTestId('device-console-desktop-table');
    await expect(desktopTable).toBeVisible();

    await page.getByRole('button', { name: '列显示' }).click();
    const cpuColumn = page.getByRole('menuitemcheckbox', { name: 'CPUUse' });
    await cpuColumn.click();
    await expect(desktopTable.getByText('CPUUse')).toBeVisible();

    await page.getByTestId('device-console-column-option-property:CPUUse').dragTo(page.getByTestId('device-console-column-option-deviceName'));
    await expect(desktopTable.locator('thead th').nth(1)).toContainText('CPUUse');
    await expect(desktopTable.locator('thead th').nth(2)).toContainText('设备ID');

    await page.reload();
    await expect(desktopTable).toBeVisible();
    await expect(desktopTable.locator('thead th').nth(1)).toContainText('CPUUse');
    await expect(desktopTable.locator('thead th').nth(2)).toContainText('设备ID');
  });
});
