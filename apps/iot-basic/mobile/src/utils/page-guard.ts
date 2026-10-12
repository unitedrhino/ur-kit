import { appContextProvider } from '../providers/app-context.provider';

export function buildPageUrl(path: string, options: Record<string, string | undefined> = {}): string {
  const normalizedEntries = Object.entries(options).reduce<Array<[string, string]>>((acc, [key, value]) => {
    if (typeof value === 'string' && value !== '') {
      acc.push([key, value]);
    }
    return acc;
  }, []);
  const search = normalizedEntries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return search ? `${path}?${search}` : path;
}

export async function ensurePageReady(path: string, options?: Record<string, string | undefined>): Promise<boolean> {
  return appContextProvider.ensureReady(buildPageUrl(path, options));
}

/**
 * 业务点登录守卫：未登录时跳登录页（记录 pendingRoute），返回 false；
 * 已登录时返回 true，调用方继续执行业务。
 *
 * @param path     登录后期望续跳的目标页（不传则登录后停留在 home）
 * @param options  目标页 query
 */
export function ensureLoggedInForAction(path?: string, options?: Record<string, string | undefined>): boolean {
  const targetUrl = path ? buildPageUrl(path, options) : undefined;
  return appContextProvider.ensureLoggedIn(targetUrl);
}
