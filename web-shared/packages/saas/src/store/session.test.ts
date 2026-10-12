import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ORG_ID_KEY } from '../constants';

const postApiV1SystemUserSelfAppGetList = vi.fn();

vi.mock('@vben/api', () => ({
  CoreApi: {
    postApiV1SystemUserSelfAppGetList,
  },
}));

describe('useSessionStore', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GLOB_APPNAME', 'test-app');
    vi.stubEnv('VITE_APP_VERSION', 'test-version');
    vi.stubEnv('VITE_APP_NAMESPACE', 'test-namespace');
    setActivePinia(createPinia());
    document.cookie = `${ORG_ID_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    localStorage.clear();
    sessionStorage.clear();
    postApiV1SystemUserSelfAppGetList.mockReset();
  });

  it('clears persisted route tabs when switching to another tenant', async () => {
    const { useTabbarStore } = await import('@vben/stores');
    const { useSessionStore } = await import('./session');

    const sessionStore = useSessionStore();
    const tabbarStore = useTabbarStore();

    sessionStore.setTenant('tenant-a');
    tabbarStore.addTab({
      fullPath: '/device/list',
      meta: { keepAlive: true },
      name: 'DeviceList',
      path: '/device/list',
    } as any);

    expect(tabbarStore.tabs).toHaveLength(1);
    expect(tabbarStore.getCachedTabs).toEqual(['DeviceList']);

    sessionStore.setTenant('tenant-b');

    expect(tabbarStore.tabs).toEqual([]);
    expect(tabbarStore.getCachedTabs).toEqual([]);
  });

  it('keeps route tabs when setting the current tenant again', async () => {
    const { useTabbarStore } = await import('@vben/stores');
    const { useSessionStore } = await import('./session');

    const sessionStore = useSessionStore();
    const tabbarStore = useTabbarStore();

    sessionStore.setTenant('tenant-a');
    tabbarStore.addTab({
      fullPath: '/device/list',
      meta: {},
      name: 'DeviceList',
      path: '/device/list',
    } as any);

    sessionStore.setTenant('tenant-a');

    expect(tabbarStore.tabs).toHaveLength(1);
  });

  it('verifies tenant app access from the target tenant instead of stale login cache', async () => {
    const { useSessionStore } = await import('./session');
    const sessionStore = useSessionStore();

    sessionStore.setSelfAppList([{ appID: '77', tenantCode: 'tenant-a' }]);
    postApiV1SystemUserSelfAppGetList.mockResolvedValueOnce({
      list: [{ appID: '77', tenantCode: 'tenant-b' }],
    });

    await expect(sessionStore.verifySelfAppAccess('tenant-b', '77')).resolves.toBe(true);
    expect(postApiV1SystemUserSelfAppGetList).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        headers: { 'tenant-code': 'tenant-b' },
        skipReAuthenticate: true,
      }),
    );
  });

  it('returns false when the target tenant app list does not contain the current app', async () => {
    const { useSessionStore } = await import('./session');
    const sessionStore = useSessionStore();

    postApiV1SystemUserSelfAppGetList.mockResolvedValueOnce({
      list: [{ appID: '300', tenantCode: 'tenant-b' }],
    });

    await expect(sessionStore.verifySelfAppAccess('tenant-b', '77')).resolves.toBe(false);
  });
});
