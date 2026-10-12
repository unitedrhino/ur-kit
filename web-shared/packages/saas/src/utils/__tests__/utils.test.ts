import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APPS_DEV_HOST_MAP } from '../../constants';
import { getAvatarUrl, isOrgIotClientAppUrl, openAppInCurrentTab, openAppInNewTab } from '../utils';

function devHost(appUrlKey: string) {
  return APPS_DEV_HOST_MAP.find((item) => item.appUrlKey === appUrlKey)?.appDevHost;
}

describe('getAvatarUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an absolute url unchanged', () => {
    expect(getAvatarUrl('https://img.example.com/avatar.png')).toBe('https://img.example.com/avatar.png');
  });

  it('returns a relative value unchanged', () => {
    expect(getAvatarUrl('/legacy/avatar.png')).toBe('/legacy/avatar.png');
  });

  it('uses the bundled default logo when backend returns a protected default-logo file url', () => {
    const protectedDefaultLogo =
      'http://api.example.com/api/v1/system/common/download-file?filePath=public%2Fsys.rpc%2Fplatform%2Fcore%2FsystemConfig%2Favatar%2Fdefault-logo.png';

    expect(getAvatarUrl(protectedDefaultLogo)).toBe('/default-logo.png');
    expect(getAvatarUrl('public/sys.rpc/platform/core/systemConfig/avatar/default-logo.png')).toBe('/default-logo.png');
  });

  it('opens app url in current tab', () => {
    window.open = vi.fn();

    const opened = openAppInCurrentTab('/app/console/');

    expect(opened).toBe(true);
    expect(window.open).toHaveBeenCalledWith(`${devHost('/app/console/')}/`, '_self');
  });

  it('appends query params when opening app in current tab', () => {
    window.open = vi.fn();

    const opened = openAppInCurrentTab('/app/org-manage/', { tenantCode: 'acme' });

    expect(opened).toBe(true);
    expect(window.open).toHaveBeenCalledWith(`${devHost('/app/org-manage/')}/?tenantCode=acme`, '_self');
  });

  it('materializes org-iot-client url with the org id hash route', () => {
    window.open = vi.fn();

    const opened = openAppInCurrentTab('/app/org-iot-client/', { tenantCode: 'org-001' });

    expect(opened).toBe(true);
    expect(window.open).toHaveBeenCalledWith(`${devHost('/app/org-iot-client/')}/#/org-001/dashboard`, '_self');
  });

  it('opens org-iot-client hash route in a new tab when requested', () => {
    window.open = vi.fn();

    const opened = openAppInNewTab('/app/org-iot-client/', { tenantCode: 'org-001' });

    expect(opened).toBe(true);
    expect(window.open).toHaveBeenCalledWith(`${devHost('/app/org-iot-client/')}/#/org-001/dashboard`, '_blank', 'noopener=yes,noreferrer=yes');
  });

  it('detects org-iot-client app url keys', () => {
    expect(isOrgIotClientAppUrl('/app/org-iot-client/')).toBe(true);
    expect(isOrgIotClientAppUrl('app/org-iot-client')).toBe(true);
    expect(isOrgIotClientAppUrl('/app/org-manage/')).toBe(false);
  });
});
