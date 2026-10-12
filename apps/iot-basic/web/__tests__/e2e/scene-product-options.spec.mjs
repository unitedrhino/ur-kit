/**
 * 新版场景编辑器产品选择回归：直接进入页面时也能加载产品列表。
 */
import { expect, test } from 'playwright/test';

/** 返回与请求客户端一致的成功响应。 */
const reply = (data) => ({ code: 200, data });

test('新建场景的设备控制动作可选择产品', async ({ page }) => {
  await page.context().addCookies([{ name: 'accessToken', value: 'mock-token', url: 'http://127.0.0.1:3006' }]);

  // 先兜住无关接口，再为页面启动、项目和产品提供最小数据。
  await page.route('**/api/v1/**', (route) => route.fulfill({ json: reply({ list: [], total: 0 }) }));
  await page.route('**/api/v1/system/common/sys-config/core/get-one', (route) => route.fulfill({ json: reply({ oem: { title: '联犀' } }) }));
  await page.route('**/api/v1/system/tenant/core/get-one', (route) => route.fulfill({ json: reply({ code: 'demo-org', id: '1001', name: 'Demo Org' }) }));
  await page.route('**/api/v1/system/app/core/get-one', (route) => route.fulfill({ json: reply({ id: '600', loginTypes: ['pwd'], registerTypes: ['phone'], tenantCode: 'common' }) }));
  await page.route('**/api/v1/system/user/self/get-one', (route) => route.fulfill({ json: reply({
    roles: ['admin'],
    tenants: [{ tenant: { appIDs: [600], code: 'demo-org', name: 'Demo Org' }, tenantCode: 'demo-org' }],
    userID: '10001',
    userName: 'demo',
  }) }));
  await page.route('**/api/v1/system/user/self/app/get-list', (route) => route.fulfill({ json: reply({ list: [{ appID: 600, status: 1, tenantCode: 'demo-org' }] }) }));
  await page.route('**/api/v1/system/user/self/menu/get-list', (route) => route.fulfill({ json: reply({ list: [] }) }));
  await page.route('**/api/v1/things/project/info/get-list', (route) => route.fulfill({ json: reply({ list: [{ projectID: 'project-1', projectName: '默认项目', status: 1 }], total: 1 }) }));
  await page.route('**/api/v1/things/product/info/get-list', (route) => route.fulfill({ json: reply({ list: [{ productID: 'product-001', productName: '智能电表' }], total: 1 }) }));

  await page.goto('/demo-org/scene-linkage/create-v2', { waitUntil: 'domcontentloaded' });
  await page.locator('#sec-action header button').click();
  await page.getByRole('button', { name: /Device control|设备控制/i }).click();

  await page.locator('#sec-action').getByRole('combobox').first().click();
  await expect(page.getByRole('option', { name: '智能电表' })).toBeVisible();
  await page.getByRole('option', { name: '智能电表' }).click();
  await expect(page.locator('#sec-action').getByRole('combobox').first()).toContainText('智能电表');
});
