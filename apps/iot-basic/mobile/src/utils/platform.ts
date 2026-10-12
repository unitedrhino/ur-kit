/**
 * 跨端系统信息适配
 * - mp-weixin: 使用 wx.getMenuButtonBoundingClientRect 计算自定义导航栏高度
 * - app-plus / h5 / 其他小程序: 使用兜底常量
 */

export interface MenuButtonRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

interface SystemInfoResult {
  statusBarHeight: number;
  navBarHeight: number;
  menuButtonRect: MenuButtonRect;
  screenWidth: number;
  screenHeight: number;
  windowHeight: number;
  pixelRatio: number;
  platform: string;
  isIOS: boolean;
  safeAreaBottom: number;
}

let cachedInfo: SystemInfoResult | null = null;

function getRuntimePlatform(): string {
  try {
    const deviceInfo = uni.getDeviceInfo() as { platform?: string };
    if (deviceInfo?.platform) return deviceInfo.platform;
  } catch (_) {
    // 忽略，继续使用系统信息兜底。
  }
  try {
    const systemInfo = uni.getSystemInfoSync() as { platform?: string };
    if (systemInfo?.platform) return systemInfo.platform;
  } catch (_) {
    // ignore
  }
  // #ifdef H5
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
  }
  // #endif
  return 'unknown';
}

export function getSystemInfo(): SystemInfoResult {
  if (cachedInfo) return cachedInfo;

  const sysInfo = uni.getWindowInfo() as any;
  const platform = getRuntimePlatform();
  const statusBarHeight = sysInfo.statusBarHeight || 0;

  let menuButtonRect: MenuButtonRect = {
    top: statusBarHeight + 4,
    bottom: statusBarHeight + 36,
    left: sysInfo.screenWidth - 95,
    right: sysInfo.screenWidth - 8,
    width: 87,
    height: 32,
  };
  let navBarHeight = 44;

  // #ifdef MP-WEIXIN
  try {
    const mb = uni.getMenuButtonBoundingClientRect() as MenuButtonRect;
    menuButtonRect = mb;
    navBarHeight = mb.bottom - mb.top + (mb.top - statusBarHeight) * 2;
  } catch (_) {
    // 忽略, 用兜底值
  }
  // #endif

  cachedInfo = {
    statusBarHeight,
    navBarHeight,
    menuButtonRect,
    screenWidth: sysInfo.screenWidth,
    screenHeight: sysInfo.screenHeight,
    windowHeight: sysInfo.windowHeight,
    pixelRatio: sysInfo.pixelRatio,
    platform,
    isIOS: platform.toLowerCase().includes('ios'),
    safeAreaBottom: sysInfo.safeArea
      ? sysInfo.screenHeight - sysInfo.safeArea.bottom
      : 0,
  };

  return cachedInfo;
}
