import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPreferences } from '../src/config';
import { PreferenceManager } from '../src/preferences';
import { isDarkTheme } from '../src/update-css-variables';

const SHARED_THEME_STORAGE_KEY = 'vben-shared-preferences-theme';
type MediaListener = (event: { matches: boolean }) => void;

let mediaListeners: Array<{ listener: MediaListener; query: string }> = [];
let prefersDark = false;

/**
 * 安装可控的 matchMedia，用于验证自动主题跟随系统变化。
 */
function installMatchMedia(matches = false) {
  prefersDark = matches;
  mediaListeners = [];

  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn((eventName: string, listener: MediaListener) => {
        if (eventName === 'change') {
          mediaListeners.push({ listener, query });
        }
      }),
      addListener: vi.fn((listener: MediaListener) => {
        mediaListeners.push({ listener, query });
      }),
      dispatchEvent: vi.fn(),
      matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
}

/**
 * 触发系统深浅色变化，模拟浏览器的 prefers-color-scheme 事件。
 */
function emitColorSchemeChange(matches: boolean) {
  prefersDark = matches;
  mediaListeners
    .filter(({ query }) => query === '(prefers-color-scheme: dark)')
    .forEach(({ listener }) => listener({ matches }));
}

/**
 * 读取 StorageManager 写入的 JSON 包装值。
 */
function readStorageValue<T>(key: string): null | T {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return (JSON.parse(raw) as { value: T }).value;
}

/**
 * 写入 StorageManager 兼容格式的缓存值。
 */
function writeStorageValue<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify({ value }));
}

describe('preferences', () => {
  let preferenceManager: PreferenceManager;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    installMatchMedia(false);
    preferenceManager = new PreferenceManager();
  });

  afterEach(async () => {
    // PreferenceManager 的防抖 watch（150ms）会在延迟定时器里写 window.localStorage；
    // 等待防抖在环境存活期内触发完毕，避免 teardown 后 "window is not defined" 的 unhandled error
    await new Promise((resolve) => setTimeout(resolve, 200));
    vi.unstubAllGlobals();
  });

  it('loads default preferences if no saved preferences found', () => {
    const preferences = preferenceManager.getPreferences();
    expect(preferences).toEqual(defaultPreferences);
  });

  it('uses auto as the default theme mode', () => {
    expect(preferenceManager.getPreferences().theme.mode).toBe('auto');
  });

  it('initializes preferences with overrides', async () => {
    const overrides: any = {
      app: {
        locale: 'en-US',
      },
    };
    await preferenceManager.initPreferences({
      namespace: 'testNamespace',
      overrides,
    });

    // 等待防抖动操作完成
    // await new Promise((resolve) => setTimeout(resolve, 300)); // 等待100毫秒

    const expected = {
      ...defaultPreferences,
      app: {
        ...defaultPreferences.app,
        ...overrides.app,
      },
    };

    expect(preferenceManager.getPreferences()).toEqual(expected);
  });

  it('updates theme mode correctly', () => {
    preferenceManager.updatePreferences({
      theme: {
        mode: 'light',
      },
    });

    expect(preferenceManager.getPreferences().theme.mode).toBe('light');
  });

  it('shares explicit theme mode across namespaces', async () => {
    await preferenceManager.initPreferences({
      namespace: 'theme-one',
      overrides: {
        theme: {
          mode: 'auto',
        },
      },
    });

    preferenceManager.updatePreferences({
      theme: {
        mode: 'light',
      },
    });

    expect(readStorageValue(SHARED_THEME_STORAGE_KEY)).toBe('light');

    const otherPreferenceManager = new PreferenceManager();
    await otherPreferenceManager.initPreferences({
      namespace: 'theme-two',
      overrides: {
        theme: {
          mode: 'auto',
        },
      },
    });

    expect(otherPreferenceManager.getPreferences().theme.mode).toBe('light');
  });

  it('migrates legacy light and auto namespace theme caches to the shared theme key', async () => {
    writeStorageValue('legacy-light-preferences-theme', 'light');

    await preferenceManager.initPreferences({
      namespace: 'legacy-light',
      overrides: {
        theme: {
          mode: 'auto',
        },
      },
    });

    expect(preferenceManager.getPreferences().theme.mode).toBe('light');
    expect(readStorageValue(SHARED_THEME_STORAGE_KEY)).toBe('light');
  });

  it('ignores legacy dark namespace theme cache so historical defaults do not override auto', async () => {
    writeStorageValue('legacy-dark-preferences-theme', 'dark');

    await preferenceManager.initPreferences({
      namespace: 'legacy-dark',
      overrides: {
        theme: {
          mode: 'auto',
        },
      },
    });

    expect(preferenceManager.getPreferences().theme.mode).toBe('auto');
    expect(readStorageValue(SHARED_THEME_STORAGE_KEY)).toBe('auto');
  });

  it('keeps auto mode while system theme changes update the html dark class', async () => {
    await preferenceManager.initPreferences({
      namespace: 'system-theme',
      overrides: {
        theme: {
          mode: 'auto',
        },
      },
    });

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    emitColorSchemeChange(true);

    expect(preferenceManager.getPreferences().theme.mode).toBe('auto');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(readStorageValue(SHARED_THEME_STORAGE_KEY)).toBe('auto');
  });

  it('updates color modes correctly', () => {
    preferenceManager.updatePreferences({
      app: { colorGrayMode: true, colorWeakMode: true },
    });

    expect(preferenceManager.getPreferences().app.colorGrayMode).toBe(true);
    expect(preferenceManager.getPreferences().app.colorWeakMode).toBe(true);
  });

  it('resets preferences to default', () => {
    // 先更新一些偏好设置
    preferenceManager.updatePreferences({
      theme: {
        mode: 'light',
      },
    });

    // 然后重置偏好设置
    preferenceManager.resetPreferences();

    expect(preferenceManager.getPreferences()).toEqual(defaultPreferences);
  });

  it('updates isMobile correctly', () => {
    // 模拟移动端状态
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );

    preferenceManager.updatePreferences({
      app: { isMobile: true },
    });

    expect(preferenceManager.getPreferences().app.isMobile).toBe(true);
  });

  it('updates the locale preference correctly', () => {
    preferenceManager.updatePreferences({
      app: { locale: 'en-US' },
    });

    expect(preferenceManager.getPreferences().app.locale).toBe('en-US');
  });

  it('updates the sidebar width correctly', () => {
    preferenceManager.updatePreferences({
      sidebar: { width: 200 },
    });

    expect(preferenceManager.getPreferences().sidebar.width).toBe(200);
  });
  it('updates the sidebar collapse state correctly', () => {
    preferenceManager.updatePreferences({
      sidebar: { collapsed: true },
    });

    expect(preferenceManager.getPreferences().sidebar.collapsed).toBe(true);
  });
  it('updates the navigation style type correctly', () => {
    preferenceManager.updatePreferences({
      navigation: { styleType: 'flat' },
    } as any);

    expect(preferenceManager.getPreferences().navigation.styleType).toBe('flat');
  });

  it('resets preferences to default correctly', () => {
    // 先更新一些偏好设置
    preferenceManager.updatePreferences({
      app: { locale: 'en-US' },
      sidebar: { collapsed: true, width: 200 },
      theme: {
        mode: 'light',
      },
    });

    // 然后重置偏好设置
    preferenceManager.resetPreferences();

    expect(preferenceManager.getPreferences()).toEqual(defaultPreferences);
  });

  it('does not update undefined preferences', () => {
    const originalPreferences = preferenceManager.getPreferences();

    preferenceManager.updatePreferences({
      app: { nonexistentField: 'value' },
    } as any);

    expect(preferenceManager.getPreferences()).toEqual(originalPreferences);
  });

  it('reverts to default when a preference field is deleted', () => {
    preferenceManager.updatePreferences({
      app: { locale: 'en-US' },
    });

    preferenceManager.updatePreferences({
      app: { locale: undefined },
    });

    expect(preferenceManager.getPreferences().app.locale).toBe('en-US');
  });

  it('ignores updates with invalid preference value types', () => {
    const originalPreferences = preferenceManager.getPreferences();

    preferenceManager.updatePreferences({
      app: { isMobile: 'true' as unknown as boolean }, // 错误类型
    });

    expect(preferenceManager.getPreferences()).toEqual(originalPreferences);
  });

  it('merges nested preference objects correctly', () => {
    preferenceManager.updatePreferences({
      app: { name: 'New App Name' },
    });

    const expected = {
      ...defaultPreferences,
      app: {
        ...defaultPreferences.app,
        name: 'New App Name',
      },
    };

    expect(preferenceManager.getPreferences()).toEqual(expected);
  });

  it('applies updates immediately after initialization', async () => {
    const overrides: any = {
      app: {
        locale: 'en-US',
      },
    };

    await preferenceManager.initPreferences(overrides);

    preferenceManager.updatePreferences({
      theme: { mode: 'light' },
    });

    expect(preferenceManager.getPreferences().theme.mode).toBe('light');
  });
});

describe('isDarkTheme', () => {
  it('should return true for dark theme', () => {
    expect(isDarkTheme('dark')).toBe(true);
  });

  it('should return false for light theme', () => {
    expect(isDarkTheme('light')).toBe(false);
  });

  it('should return system preference for auto theme', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(), // Deprecated
      dispatchEvent: vi.fn(),
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(), // Deprecated
    }));

    expect(isDarkTheme('auto')).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});
