import { afterEach, describe, expect, it, vi } from 'vitest';

import { APPS_DEV_HOST_MAP } from '../../../constants';
import {
  buildInviteLink,
  consumePendingInviteCode,
  extractInviteCodeFromRedirect,
  getPendingInviteCode,
  normalizeInviteRedirectPath,
  parseInviteTenantCode,
  savePendingInviteCode,
} from './invite-link';

describe('invite link helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds an invite link with encoded code on the auth invite route', () => {
    expect(buildInviteLink('company-cABC+123', 'https://console.example.com/')).toBe('https://console.example.com/auth/invite?code=company-cABC%2B123');
  });

  it('builds invite links on the console app by default', () => {
    const consoleHost = APPS_DEV_HOST_MAP.find((item) => item.appUrlKey === '/app/console/')?.appDevHost;

    expect(buildInviteLink('tenant:c:abc+123')).toBe(`${consoleHost}/auth/invite?code=tenant%3Ac%3Aabc%2B123`);
  });

  it('builds hash-route console invite links when the app uses hash history', () => {
    vi.stubEnv('VITE_ROUTER_HISTORY', 'hash');
    const consoleHost = APPS_DEV_HOST_MAP.find((item) => item.appUrlKey === '/app/console/')?.appDevHost;

    expect(buildInviteLink('tenant:c:abc+123')).toBe(`${consoleHost}/#/auth/invite?code=tenant%3Ac%3Aabc%2B123`);
  });

  it('stores and consumes pending invite code once', () => {
    const storage = new Map<string, string>();
    const store = {
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    };

    savePendingInviteCode('tenantA-c1234567890', store);

    expect(getPendingInviteCode(store)).toBe('tenantA-c1234567890');
    expect(consumePendingInviteCode(store)).toBe('tenantA-c1234567890');
    expect(consumePendingInviteCode(store)).toBe('');
  });

  it('parses tenant code from existing invite code format', () => {
    expect(parseInviteTenantCode('tenantA-c1234567890')).toBe('tenantA-');
    expect(parseInviteTenantCode('short-code')).toBe('');
  });

  it('normalizes encoded invite redirects and extracts the invite code', () => {
    const redirect = encodeURIComponent('/auth/invite?code=platform%3Ac%3A2195726501');

    expect(normalizeInviteRedirectPath(redirect)).toBe('/auth/invite?code=platform:c:2195726501');
    expect(extractInviteCodeFromRedirect(redirect)).toBe('platform:c:2195726501');
  });

  it('ignores non-invite redirects when extracting invite codes', () => {
    expect(normalizeInviteRedirectPath('/index')).toBe('');
    expect(extractInviteCodeFromRedirect('/auth/login?redirect=%2F')).toBe('');
  });
});
