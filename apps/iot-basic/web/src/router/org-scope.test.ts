import type { RouteRecordRaw } from 'vue-router';

import { describe, expect, it } from 'vitest';

import {
  buildOrgAuthPath,
  buildOrgPath,
  extractOrgIdFromPath,
  materializeOrgRoutes,
  materializeTenantMenuMap,
  resolveTenantCoreByOrgId,
  stripOrgPathPrefix,
} from './org-scope';
import { coreRoutes } from './routes/core';
import appRoutes from './routes/modules/app';

/** 按路由名递归查找路由记录；显式标注返回类型以避免递归函数隐式 any（TS7023）。 */
function findRoute(routes: RouteRecordRaw[], name: string): RouteRecordRaw | undefined {
  for (const route of routes) {
    if (route.name === name) return route;
    if (route.children?.length) {
      const child = findRoute(route.children as RouteRecordRaw[], name);
      if (child) return child;
    }
  }
  return undefined;
}

describe('org-iot-client org scope routes', () => {
  it('keeps root outside org scope and nests authentication under org id', () => {
    const root = findRoute(coreRoutes, 'Root');
    const authentication = findRoute(coreRoutes, 'Authentication');

    expect(root?.path).toBe('/');
    expect(root?.redirect).toBe('/app_not_found');
    expect(authentication?.path).toBe('/:orgId/auth');
    expect(typeof authentication?.redirect).toBe('function');
    expect((authentication?.redirect as any)?.({ params: { orgId: 'demo-org' } })).toBe('/demo-org/auth/login');
    expect(authentication?.children?.map((route) => route.name)).toEqual(
      expect.arrayContaining(['Login', 'Register', 'RegisterStep2', 'RegisterStep3', 'InviteAccept', 'ThirdLoginCallback', 'ThirdLoginComplete']),
    );
  });

  it('parses, strips, and builds org scoped paths', () => {
    expect(extractOrgIdFromPath('/demo-org/auth/login')).toBe('demo-org');
    expect(extractOrgIdFromPath('/app_not_found')).toBe('');
    expect(stripOrgPathPrefix('/demo-org/device-space/console')).toBe('/device-space/console');
    expect(stripOrgPathPrefix('/demo-org/auth/login')).toBe('/auth/login');
    expect(buildOrgPath('demo-org', '/device-space/console')).toBe('/demo-org/device-space/console');
    expect(buildOrgPath('demo-org', '/')).toBe('/demo-org/dashboard');
    expect(buildOrgAuthPath('demo-org', 'register')).toBe('/demo-org/auth/register');
    expect(buildOrgAuthPath('demo-org', '/auth/forget-password')).toBe('/demo-org/auth/forget-password');
  });

  it('materializes app routes and active paths with the current org id', () => {
    const routes = materializeOrgRoutes(appRoutes, 'demo-org');
    const indexRoute = findRoute(routes, 'OrgSystemManageIndex');
    const deviceSpace = findRoute(routes, 'OrgEnergyDeviceSpace');
    const consoleRoute = deviceSpace?.children?.find((route) => route.name === 'OrgEnergyDeviceSpaceConsole');
    const logsRoute = deviceSpace?.children?.find((route) => route.name === 'OrgEnergyDeviceSpaceDeviceLogs');
    const infoRoute = deviceSpace?.children?.find((route) => route.name === 'OrgEnergyDeviceSpaceDeviceInfo');
    const autoScene = findRoute(routes, 'OrgEnergySceneLinkageAutoScene');
    const oneScene = findRoute(routes, 'OrgEnergySceneLinkageOneScene');
    const sceneEditor = findRoute(routes, 'OrgEnergySceneLinkageCreateV2');

    expect(indexRoute?.redirect).toBe('/demo-org/dashboard');
    expect(deviceSpace?.path).toBe('/demo-org/device-space');
    expect(consoleRoute?.path).toBe('/demo-org/device-space/console');
    expect(logsRoute?.path).toBe('/demo-org/device-space/device-logs/:productID/:deviceName');
    expect(logsRoute?.meta?.hideInMenu).toBe(true);
    expect(logsRoute?.meta?.activePath).toBe('/demo-org/device-space/console');
    expect(infoRoute?.path).toBe('/demo-org/device-space/device-info/:productID/:deviceName');
    expect(infoRoute?.meta?.hideInMenu).toBe(true);
    expect(infoRoute?.meta?.activePath).toBe('/demo-org/device-space/console');
    expect(autoScene?.path).toBe('/demo-org/scene-linkage/auto-scene');
    expect(oneScene?.path).toBe('/demo-org/scene-linkage/one-scene');
    expect(sceneEditor?.path).toBe('/demo-org/scene-linkage/create-v2');
    expect(sceneEditor?.meta?.activePath).toBe('/demo-org/scene-linkage/auto-scene');
  });

  it('materializes backend menu keys before applying menu overrides', () => {
    const source = new Map<string, any>([
      ['/device-space', { menu: { path: '/device-space' }, name: '设备空间' }],
      ['/device-space/console', { menu: { path: '/device-space/console' }, name: '控制台' }],
    ]);
    const result = materializeTenantMenuMap(source, 'demo-org');

    expect([...result.keys()]).toEqual(['/demo-org/device-space', '/demo-org/device-space/console']);
    expect(result.get('/demo-org/device-space')?.menu?.path).toBe('/demo-org/device-space');
  });

  it('tries tenant code first and falls back to id only for numeric org ids', async () => {
    const calls: Array<Record<string, string>> = [];
    const tenant = await resolveTenantCoreByOrgId('12345', async (payload) => {
      calls.push(payload);
      if (payload.code) {
        throw new Error('not found by code');
      }
      return { code: 'real-org', id: '12345' };
    });

    expect(calls).toEqual([{ code: '12345' }, { id: '12345' }]);
    expect(tenant?.code).toBe('real-org');
  });
});
