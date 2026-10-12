import { describe, expect, it, vi } from 'vitest';

import { savePendingInviteCode } from './invite-link';
import { acceptPendingInviteAfterAuth } from './accept-invite';

describe('acceptPendingInviteAfterAuth', () => {
  it('joins with pending invite code and switches to invited tenant', async () => {
    const storage = new Map<string, string>();
    const store = {
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    };
    savePendingInviteCode('tenant-a-c1234567890', store);

    const join = vi.fn().mockResolvedValue(undefined);
    const refreshSelfAppList = vi.fn().mockResolvedValue(undefined);
    const refreshUserInfo = vi.fn().mockResolvedValue({ id: '1' });
    const setTenant = vi.fn();

    const result = await acceptPendingInviteAfterAuth({
      join,
      refreshSelfAppList,
      refreshUserInfo,
      setTenant,
      storage: store,
    });

    expect(result).toEqual({ accepted: true, tenantCode: 'tenant-a-' });
    expect(join).toHaveBeenCalledWith({
      code: 'tenant-a-c1234567890',
      method: 'code',
    });
    expect(setTenant).toHaveBeenCalledWith('tenant-a-');
    expect(refreshUserInfo).toHaveBeenCalledTimes(1);
    expect(refreshSelfAppList).toHaveBeenCalledTimes(1);
    expect(storage.size).toBe(0);
  });

  it('keeps pending code when join fails so the invite page can retry', async () => {
    const storage = new Map<string, string>();
    const store = {
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    };
    savePendingInviteCode('tenant-a-c1234567890', store);

    await expect(
      acceptPendingInviteAfterAuth({
        join: vi.fn().mockRejectedValue(new Error('expired')),
        refreshSelfAppList: vi.fn(),
        refreshUserInfo: vi.fn(),
        setTenant: vi.fn(),
        storage: store,
      }),
    ).rejects.toThrow('expired');

    expect(store.getItem('saas:pending-invite-code')).toBe('tenant-a-c1234567890');
  });
});
