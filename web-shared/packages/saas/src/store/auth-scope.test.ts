import { describe, expect, it } from 'vitest';

import { resolveOrgScopedAuthPath, resolveOrgScopedLoginSuccessPath, resolveOrgScopedUnauthorizedPath, shouldUseOrgScopedTenantContext } from './auth-scope';

describe('org scoped auth helpers', () => {
  it('uses existing org scoped tenant context instead of tenant choose', () => {
    expect(
      shouldUseOrgScopedTenantContext({
        appName: 'org-iot-client',
        currentPath: '/demo-org/auth/login',
        tenantCode: 'demo-org',
      }),
    ).toBe(true);
    expect(
      shouldUseOrgScopedTenantContext({
        appName: 'console',
        currentPath: '/auth/login',
        tenantCode: 'demo-org',
      }),
    ).toBe(false);
    // org-structure-monitor 已在 MR #208 迁移为独立会话租户模式，不再走 URL org 前缀作用域；
    // 此处锁定负例，防止误把该应用加回 ORG_SCOPED_APP_DEFAULT_HOME_PATH
    expect(
      shouldUseOrgScopedTenantContext({
        appName: 'org-structure-monitor',
        currentPath: '/demo-org/auth/login',
        tenantCode: 'demo-org',
      }),
    ).toBe(false);
  });

  it('builds org scoped login success and auth redirects', () => {
    expect(resolveOrgScopedLoginSuccessPath('/demo-org/auth/login', '/', 'org-iot-client')).toBe('/demo-org/dashboard');
    // 非 org 作用域应用不接管路径，登录成功路径原样返回
    expect(resolveOrgScopedLoginSuccessPath('/demo-org/auth/login', '/', 'org-structure-monitor')).toBe('/');
    expect(resolveOrgScopedLoginSuccessPath('/demo-org/auth/login', '/device-map', 'org-iot-client')).toBe('/demo-org/device-map');
    expect(resolveOrgScopedLoginSuccessPath('/demo-org/auth/login', '/demo-org/device-map', 'org-iot-client')).toBe('/demo-org/device-map');
    expect(resolveOrgScopedLoginSuccessPath('/demo-org/auth/login', '/demo-org/auth/login', 'org-iot-client')).toBe('/demo-org/dashboard');
    expect(resolveOrgScopedAuthPath('/demo-org/device-space/console', '/auth/login', 'org-iot-client')).toBe('/demo-org/auth/login');
    expect(resolveOrgScopedUnauthorizedPath('/demo-org/device-space/console', '/auth/app-unauthorized', 'org-iot-client')).toBe('/app_not_found');
  });
});
