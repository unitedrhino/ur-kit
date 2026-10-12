import { describe, expect, it, vi } from 'vitest';

vi.mock('../../store/session', () => ({
  useSessionStore: vi.fn(),
}));

describe('syncSessionToken', () => {
  it('writes refreshed tokens through the session store', async () => {
    const setToken = vi.fn();
    const { useSessionStore } = await import('../../store/session');
    vi.mocked(useSessionStore).mockReturnValue({
      setToken,
    } as any);

    const { syncSessionToken } = await import('../token-sync');
    syncSessionToken('new-token');

    expect(setToken).toHaveBeenCalledWith('new-token');
  });
});
