import { beforeAll, describe, expect, it } from 'vitest';

let buildAppNamespace: typeof import('./setup').buildAppNamespace;
let buildSharedAppNamespace: typeof import('./setup').buildSharedAppNamespace;
let buildStorePersistKey: typeof import('./setup').buildStorePersistKey;
let resetAllStores: typeof import('./setup').resetAllStores;
let createPinia: typeof import('pinia').createPinia;
let defineStore: typeof import('pinia').defineStore;
let setActivePinia: typeof import('pinia').setActivePinia;

beforeAll(async () => {
  if (typeof globalThis.localStorage?.getItem !== 'function') {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        clear: () => {},
        getItem: () => null,
        removeItem: () => {},
        setItem: () => {},
      },
    });
  }

  ({ createPinia, defineStore, setActivePinia } = await import('pinia'));
  ({ buildAppNamespace, buildSharedAppNamespace, buildStorePersistKey, resetAllStores } = await import('./setup'));
});

describe('buildAppNamespace', () => {
  it('falls back to app name when vite app namespace is empty', () => {
    expect(
      buildAppNamespace({
        appName: 'org-manage',
        appVersion: '5.5.9',
        env: 'prod',
        namespace: '',
      }),
    ).toBe('org-manage-5.5.9-prod');
  });

  it('prefers the explicit vite app namespace when provided', () => {
    expect(
      buildAppNamespace({
        appName: 'org-manage',
        appVersion: '5.5.9',
        env: 'dev',
        namespace: 'custom-org-manage',
      }),
    ).toBe('custom-org-manage-5.5.9-dev');
  });
});

describe('buildSharedAppNamespace', () => {
  it('keeps the legacy shared namespace when vite app namespace is empty', () => {
    expect(
      buildSharedAppNamespace({
        appName: 'org-manage',
        appVersion: '5.5.9',
        env: 'prod',
        namespace: '',
      }),
    ).toBe('-5.5.9-prod');
  });
});

describe('buildStorePersistKey', () => {
  it('builds an isolated persist key for app specific stores', () => {
    expect(
      buildStorePersistKey('core-tabbar', {
        appName: 'iot',
        appVersion: '5.5.9',
        env: 'prod',
        namespace: '',
      }),
    ).toBe('iot-5.5.9-prod-core-tabbar');
  });
});

describe('resetAllStores', () => {
  it('falls back to the active pinia when initStores has not been called', () => {
    setActivePinia(createPinia());
    const useDemoStore = defineStore('demo-reset-all-stores', {
      state: () => ({
        count: 1,
      }),
    });

    const store = useDemoStore();
    store.count = 9;

    resetAllStores();

    expect(store.count).toBe(1);
  });
});
