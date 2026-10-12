import { describe, expect, it, vi } from 'vitest';

import { authenticateResponseInterceptor } from './preset-interceptors';

describe('authenticateResponseInterceptor', () => {
  it('does not re-authenticate when the request opts out', async () => {
    const doReAuthenticate = vi.fn();
    const doRefreshToken = vi.fn();
    const interceptor = authenticateResponseInterceptor({
      client: {
        isRefreshing: false,
        refreshTokenQueue: [],
        request: vi.fn(),
      } as any,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: false,
      formatToken: (token) => token,
    });
    const error = {
      config: {
        skipReAuthenticate: true,
      },
      response: {
        status: 401,
      },
    };

    await expect(interceptor.rejected?.(error)).rejects.toBe(error);
    expect(doReAuthenticate).not.toHaveBeenCalled();
    expect(doRefreshToken).not.toHaveBeenCalled();
  });

  it('re-authenticates for permission code 100012', async () => {
    const doReAuthenticate = vi.fn().mockResolvedValue(undefined);
    const interceptor = authenticateResponseInterceptor({
      client: {
        isRefreshing: false,
        refreshTokenQueue: [],
        request: vi.fn(),
      } as any,
      doReAuthenticate,
      doRefreshToken: vi.fn(),
      enableRefreshToken: false,
      formatToken: (token) => token,
    });
    const error = {
      config: {},
      response: {
        data: { code: 100_012, msg: '权限不足' },
        status: 401,
      },
    };

    await expect(interceptor.rejected?.(error)).rejects.toBe(error);
    expect(doReAuthenticate).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent authentication failures into one re-authentication', async () => {
    let finishReAuthentication: (() => void) | undefined;
    const doReAuthenticate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishReAuthentication = resolve;
        }),
    );
    const interceptor = authenticateResponseInterceptor({
      client: {
        isRefreshing: false,
        refreshTokenQueue: [],
        request: vi.fn(),
      } as any,
      doReAuthenticate,
      doRefreshToken: vi.fn(),
      enableRefreshToken: false,
      formatToken: (token) => token,
    });
    const firstError = { config: {}, response: { status: 401 } };
    const secondError = { config: {}, response: { status: 401 } };

    const first = interceptor.rejected?.(firstError);
    const second = interceptor.rejected?.(secondError);
    await vi.waitFor(() => expect(doReAuthenticate).toHaveBeenCalledTimes(1));
    finishReAuthentication?.();

    await expect(first).rejects.toBe(firstError);
    await expect(second).rejects.toBe(secondError);
  });
});
