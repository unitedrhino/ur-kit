import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearForcePasswordSetupPending,
  getPasswordSetupPath,
  isForcePasswordSetupPending,
  isPasswordUnset,
  markForcePasswordSetupPending,
  shouldForceSetPassword,
  shouldRemindSetPassword,
} from '../password';

describe('password utils', () => {
  beforeEach(() => {
    clearForcePasswordSetupPending();
  });

  it('detects unset password from user info', () => {
    expect(isPasswordUnset({ password: '' } as any)).toBe(true);
    expect(isPasswordUnset({ password: 'hashed-password' } as any)).toBe(false);
  });

  it('uses agreed defaults for remind and force flags when config is missing', () => {
    expect(shouldRemindSetPassword(undefined, { password: '' } as any)).toBe(true);
    expect(shouldForceSetPassword(undefined, { password: '' } as any)).toBe(false);
  });

  it('respects explicit sysConfig flags', () => {
    const systemConfig = {
      user: {
        forceSetPassword: 1,
        remindSetPassword: 2,
      },
    } as any;

    expect(shouldRemindSetPassword(systemConfig, { password: '' } as any)).toBe(false);
    expect(shouldForceSetPassword(systemConfig, { password: '' } as any)).toBe(true);
  });

  it('builds password setup route with force flag', () => {
    expect(getPasswordSetupPath({ force: true })).toBe(
      '/user/settings?openChangePassword=1&tab=settings&forceSetPassword=1',
    );
  });

  it('stores force password setup pending flag in sessionStorage', () => {
    expect(isForcePasswordSetupPending()).toBe(false);

    markForcePasswordSetupPending();
    expect(isForcePasswordSetupPending()).toBe(true);

    clearForcePasswordSetupPending();
    expect(isForcePasswordSetupPending()).toBe(false);
  });
});
