import { describe, expect, it } from 'vitest';

import { resolveCurrentAppDisplayName } from './current-app';

describe('resolveCurrentAppDisplayName', () => {
  it('prefers backend app name over env values', () => {
    expect(
      resolveCurrentAppDisplayName(
        { name: '平台管理' },
        {
          appId: '100',
          appName: 'platform-manage',
          appTitle: '后台标题',
        },
      ),
    ).toBe('平台管理');
  });

  it('falls back to VITE_APP_TITLE before app slug', () => {
    expect(
      resolveCurrentAppDisplayName(null, {
        appId: '300',
        appName: 'org-manage',
        appTitle: '组织管理',
      }),
    ).toBe('组织管理');
  });

  it('falls back to VITE_GLOB_APPNAME before app id', () => {
    expect(
      resolveCurrentAppDisplayName(undefined, {
        appId: '600',
        appName: 'org-iot-client',
        appTitle: '',
      }),
    ).toBe('org-iot-client');
  });

  it('falls back to app id when no display name exists', () => {
    expect(
      resolveCurrentAppDisplayName(undefined, {
        appId: '1000',
        appName: '',
        appTitle: '',
      }),
    ).toBe('应用 1000');
  });
});
