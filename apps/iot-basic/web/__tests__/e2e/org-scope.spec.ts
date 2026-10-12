import type { Page } from 'playwright/test';

import { expect, test } from 'playwright/test';

/** mockPublicBootApis 只拦截组织前缀路由首屏需要的公开接口。 */
async function mockPublicBootApis(page: Page) {
  await page.route('**/api/v1/system/common/sys-config/core/get-one', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: {
          oem: {
            title: '联犀',
          },
        },
      },
    });
  });

  await page.route('**/api/v1/system/tenant/core/get-one', async (route) => {
    const body = route.request().postDataJSON() as { code?: string; id?: string };
    const tenant =
      body.code === 'demo-org' || body.id === '1001'
        ? {
            code: 'real-demo-org',
            id: '1001',
            name: 'Demo Org',
          }
        : null;

    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: tenant,
      },
    });
  });

  await page.route('**/api/v1/system/app/core/get-one', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: {
          id: '600',
          loginTypes: ['pwd', 'phone', 'email'],
          registerTypes: ['phone', 'email'],
          tenantCode: 'common',
        },
      },
    });
  });

  await page.route('**/api/v1/system/user/self/captcha', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: {
          codeID: 'captcha-id',
          url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        },
      },
    });
  });
}

/** mockAuthenticatedBootApis 拦截已登录冷启动业务页需要的最小接口。 */
async function mockAuthenticatedBootApis(page: Page) {
  await mockPublicBootApis(page);
  await page.context().addCookies([
    {
      name: 'accessToken',
      value: 'mock-token',
      url: 'http://127.0.0.1:3006',
    },
  ]);

  await page.route('**/api/v1/system/user/self/get-one', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: {
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
        },
      },
    });
  });

  await page.route('**/api/v1/system/user/self/app/get-list', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: {
          list: [
            {
              appID: 600,
              status: 1,
              tenantCode: 'real-demo-org',
            },
          ],
        },
      },
    });
  });

  await page.route('**/api/v1/system/user/self/menu/get-list', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: {
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
        },
      },
    });
  });

  await page.route('**/api/v1/things/project/info/get-list', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: {
          list: [
            {
              projectID: 'project-1',
              projectName: '默认项目',
              status: 1,
            },
          ],
          total: 1,
        },
      },
    });
  });

  await page.route('**/api/v1/data/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: {
          list: [],
          total: 0,
        },
      },
    });
  });

  await page.route('**/api/v1/things/**', async (route) => {
    if (route.request().url().includes('/api/v1/things/project/info/get-list')) {
      await route.fulfill({
        contentType: 'application/json',
        json: {
          code: 200,
          data: {
            list: [
              {
                projectID: 'project-1',
                projectName: '默认项目',
                status: 1,
              },
            ],
            total: 1,
          },
        },
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 200,
        data: {
          list: [],
          total: 0,
        },
      },
    });
  });
}

test.describe('组织前缀路由 smoke', () => {
  test('根路径跳到应用未找到', async ({ page }) => {
    await mockPublicBootApis(page);
    await page.goto('/');

    await expect(page).toHaveURL(/\/app_not_found$/);
    await expect(page.getByRole('heading', { name: '找不到应用' })).toBeVisible();
  });

  test('合法 org 可以进入组织作用域登录页', async ({ page }) => {
    await mockPublicBootApis(page);
    await page.goto('/demo-org/auth/login');

    await expect(page).toHaveURL(/\/demo-org\/auth\/login$/);
    await expect(page.locator('input[placeholder="请输入用户名"]')).toBeVisible();
  });

  test('非法 org 跳到应用未找到', async ({ page }) => {
    await mockPublicBootApis(page);
    await page.goto('/bad-org/auth/login');

    await expect(page).toHaveURL(/\/app_not_found$/);
    await expect(page.getByRole('heading', { name: '找不到应用' })).toBeVisible();
  });

  test('已登录冷启动直达组织业务页不会被动态菜单裁成 404', async ({ page }) => {
    await mockAuthenticatedBootApis(page);
    await page.goto('/demo-org/device-space/console');

    await expect(page).toHaveURL(/\/demo-org\/device-space\/console$/);
    await expect(page.getByText('哎呀！未找到页面')).toHaveCount(0);
    await expect(page.getByText('设备列表')).toBeVisible();
  });
});
