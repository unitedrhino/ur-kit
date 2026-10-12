const TAB_BAR_URLS = new Set([
  '/pages/home/index',
  '/pages/device/index',
  '/pages/scene/index',
  '/pages/mine/index',
]);

export interface SafeBackOptions {
  delta?: number;
  fallbackUrl?: string;
}

function normalizeUrl(url: string): string {
  if (!url) return '/pages/home/index';
  return url.startsWith('/') ? url : `/${url}`;
}

function goFallback(url: string): void {
  const targetUrl = normalizeUrl(url);
  if (TAB_BAR_URLS.has(targetUrl)) {
    uni.switchTab({ url: targetUrl });
    return;
  }
  uni.redirectTo({
    url: targetUrl,
    fail: () => uni.reLaunch({ url: targetUrl }),
  });
}

export function safeNavigateBack(options: SafeBackOptions = {}): void {
  const delta = Math.max(1, options.delta || 1);
  const fallbackUrl = options.fallbackUrl || '/pages/home/index';
  const pages = getCurrentPages();

  if (pages.length > delta) {
    uni.navigateBack({
      delta,
      fail: () => goFallback(fallbackUrl),
    });
    return;
  }

  goFallback(fallbackUrl);
}
