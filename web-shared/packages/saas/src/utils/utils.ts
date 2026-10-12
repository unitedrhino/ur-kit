
import { notifyRequestError } from '@vben/saas/request-error';
import { $t } from '@vben/locales';
/**
 * SaaS 通用工具函数
 */

import { openWindow, openWindowInCurrentTab } from '@vben/utils';

import { uploadFile } from '../api/upload';
import { APPS_DEV_HOST_MAP } from '../constants';

function resolveDevAppUrl(appDevHost: string): string {
  try {
    const target = new URL(appDevHost, window.location.origin);
    target.protocol = window.location.protocol;
    target.hostname = window.location.hostname;
    return target.toString();
  } catch {
    return appDevHost;
  }
}

function normalizeAppUrlKey(appUrlKey: string): string {
  const trimmed = appUrlKey.trim();
  if (!trimmed) return '';

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const normalized = withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;

  switch (normalized) {
    case '/app/org-iot/': {
      return '/app/iot/';
    }
    case '/app/platform-iot/': {
      return '/app/iot/';
    }
    default: {
      return normalized;
    }
  }
}

type AppNavigationQueryValue = boolean | null | number | string | undefined;
type AppNavigationQuery = Record<string, AppNavigationQueryValue>;

/** Web 物联客户端应用 URL key。 */
const ORG_IOT_CLIENT_APP_URL_KEY = '/app/org-iot-client/';
/** Web 物联客户端进入应用后的默认 hash 业务路径。 */
const ORG_IOT_CLIENT_DEFAULT_ENTRY_PATH = '/dashboard';

/**
 * 获取头像完整 URL
 * @param avatar - 头像相对路径
 * @returns 完整的头像 URL
 */
export function getAvatarUrl(avatar: string | undefined): string {
  const value = avatar?.trim() || '';
  if (!value) return '';

  if (value.includes('default-logo.png')) {
    return '/default-logo.png';
  }

  return value;
}

/**
 * 获取 window.open url
 * @param appUrlKey - 应用URL关键字
 * @returns  url
 */
export function getAppOpenUrl(appUrlKey: string): null | string {
  const normalizedAppUrlKey = normalizeAppUrlKey(appUrlKey);
  if (!normalizedAppUrlKey) {
    return null;
  }

  const isDev = import.meta.env.DEV;
  if (isDev) {
    const appDevHost = APPS_DEV_HOST_MAP.find((item) => item.appUrlKey === normalizedAppUrlKey)?.appDevHost;
    if (appDevHost) {
      return resolveDevAppUrl(appDevHost);
    }
    if (normalizedAppUrlKey.startsWith('/')) {
      const backendBase = import.meta.env.VITE_GLOB_API_URL || window.location.origin;
      try {
        return new URL(normalizedAppUrlKey, backendBase).toString();
      } catch {
        return `${window.location.origin}${normalizedAppUrlKey}`;
      }
    }
    return null;
  }
  return `${normalizedAppUrlKey}`;
}

function appendQueryToUrl(url: string, query?: AppNavigationQuery): string {
  if (!query) {
    return url;
  }

  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (entries.length === 0) {
    return url;
  }

  const [base = '', hash = ''] = url.split('#', 2);
  const [pathname, search = ''] = base.split('?', 2);
  const searchParams = new URLSearchParams(search);

  entries.forEach(([key, value]) => {
    searchParams.set(key, String(value));
  });

  const nextSearch = searchParams.toString();
  const nextHash = hash ? `#${hash}` : '';

  return `${pathname}${nextSearch ? `?${nextSearch}` : ''}${nextHash}`;
}

/**
 * 判断应用 URL 是否指向 Web 物联客户端。
 * @param appUrlKey - 应用 URL 关键字
 * @returns 是否为 Web 物联客户端应用
 */
export function isOrgIotClientAppUrl(appUrlKey: string): boolean {
  return normalizeAppUrlKey(appUrlKey) === ORG_IOT_CLIENT_APP_URL_KEY;
}

/**
 * 将应用根地址与 hash 业务入口路径拼成同标签跳转地址。
 * @param url - 应用根地址
 * @param path - 需要追加到 hash 后的业务路径
 * @returns 已追加 hash 业务路径的完整地址
 */
function appendHashPathToUrl(url: string, path: string): string {
  const [withoutHash = ''] = url.split('#', 2);
  const [base = '', search = ''] = withoutHash.split('?', 2);
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const nextSearch = search ? `?${search}` : '';

  return `${normalizedBase}${nextSearch}#${normalizedPath}`;
}

/**
 * 删除已经转成路径段的查询参数。
 * @param query - 原查询参数
 * @param key - 需要移除的参数名
 * @returns 移除指定参数后的查询参数
 */
function omitQueryKey(query: AppNavigationQuery | undefined, key: string): AppNavigationQuery | undefined {
  if (!query) {
    return undefined;
  }

  const nextQuery = Object.fromEntries(Object.entries(query).filter(([entryKey]) => entryKey !== key));

  return Object.keys(nextQuery).length > 0 ? nextQuery : undefined;
}

/**
 * 解析需要组织路径前缀的应用跳转地址。
 * @param normalizedAppUrlKey - 标准化后的应用 URL key
 * @param appOpenUrl - 运行环境下的应用根地址
 * @param query - 原查询参数
 * @returns 可直接打开的地址与剩余查询参数
 */
function resolveOrgScopedAppOpenUrl(normalizedAppUrlKey: string, appOpenUrl: string, query?: AppNavigationQuery): { query?: AppNavigationQuery; url: string } {
  const tenantCode = String(query?.tenantCode ?? '').trim();
  if (normalizedAppUrlKey !== ORG_IOT_CLIENT_APP_URL_KEY || !tenantCode) {
    return query ? { query, url: appOpenUrl } : { url: appOpenUrl };
  }

  const orgScopedPath = `/${encodeURIComponent(tenantCode)}${ORG_IOT_CLIENT_DEFAULT_ENTRY_PATH}`;
  const nextQuery = omitQueryKey(query, 'tenantCode');
  const url = appendHashPathToUrl(appOpenUrl, orgScopedPath);

  return nextQuery ? { query: nextQuery, url } : { url };
}

/**
 * 解析最终用于打开应用的完整地址。
 * @param appUrlKey - 应用 URL 关键字
 * @param query - 可选查询参数
 * @returns 可打开的完整地址，无法解析时返回 null
 */
function resolveAppWindowUrl(appUrlKey: string, query?: AppNavigationQuery): null | string {
  const normalizedAppUrlKey = normalizeAppUrlKey(appUrlKey);
  const appOpenUrl = getAppOpenUrl(normalizedAppUrlKey);
  if (!appOpenUrl) {
    return null;
  }

  const resolvedAppOpenUrl = resolveOrgScopedAppOpenUrl(normalizedAppUrlKey, appOpenUrl, query);
  return appendQueryToUrl(resolvedAppOpenUrl.url, resolvedAppOpenUrl.query);
}

/**
 * 在当前标签页打开应用。
 * @param appUrlKey - 应用URL关键字
 * @param query - 可选查询参数
 * @returns 是否成功发起跳转
 */
export function openAppInCurrentTab(appUrlKey: string, query?: AppNavigationQuery): boolean {
  const appWindowUrl = resolveAppWindowUrl(appUrlKey, query);
  if (!appWindowUrl) {
    return false;
  }

  openWindowInCurrentTab(appWindowUrl);
  return true;
}

/**
 * 在新标签页打开应用。
 * @param appUrlKey - 应用URL关键字
 * @param query - 可选查询参数
 * @returns 是否成功发起跳转
 */
export function openAppInNewTab(appUrlKey: string, query?: AppNavigationQuery): boolean {
  const appWindowUrl = resolveAppWindowUrl(appUrlKey, query);
  if (!appWindowUrl) {
    return false;
  }

  openWindow(appWindowUrl, { target: '_blank' });
  return true;
}

/**
 * 返回 console
 * url 可选
 * 返回 可用于 window.location.href 的 url
 */
export function getBackToConsoleUrl(url?: string): string {
  const appOpenUrl = getAppOpenUrl('/app/console/');
  if (appOpenUrl) {
    const path = url || '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // 判断 appOpenUrl 是否为 /app/console/ 还是 http://localhost:3001
    // 1. /app/console/ 则 需要加 # 生产 hash 路由 /console
    // 2. http://localhost:3001 /console
    const hashUrl = appOpenUrl.includes('/app/console/') ? `#${normalizedPath}` : `${appOpenUrl.replace(/\/+$/, '')}${normalizedPath}`;
    return appOpenUrl.includes('/app/console/') ? `${appOpenUrl}${hashUrl}` : hashUrl;
  } else {
    return '';
  }
}

/**
 * 图片上传配置选项
 */
export interface ImageUploadOptions {
  /** 失败提示消息，默认为 '上传头像失败' */
  errorMsg?: string;
  /** 最大文件大小（字节），默认为 2MB */
  maxSize?: number;
  /** 文件大小错误提示，默认为 '图片大小不能超过 2MB' */
  sizeErrorMsg?: string;
  /** 成功提示消息，默认为 '头像更新成功' */
  successMsg?: string;
  /** 文件类型错误提示，默认为 '请选择 PNG、JPG 或 JPEG 格式的图片' */
  typeErrorMsg?: string;
  /** 允许的文件类型，默认为 ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'] */
  validTypes?: string[];
}

/**
 * 验证图片文件
 * @param file - 文件对象
 * @param options - 配置选项
 * @returns 验证是否通过
 */
export function validateImageFile(file: File, options?: ImageUploadOptions): { error?: string; valid: boolean } {
  const {
    validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'],
    maxSize = 2 * 1024 * 1024,
    typeErrorMsg = '请选择 PNG、JPG 或 JPEG 格式的图片',
    sizeErrorMsg = '图片大小不能超过 2MB',
  } = options || {};

  // 验证文件类型
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: typeErrorMsg };
  }

  // 验证文件大小
  if (file.size > maxSize) {
    return { valid: false, error: sizeErrorMsg };
  }

  return { valid: true };
}

/**
 * 处理文件选择事件，验证并上传图片
 * @param event - 文件选择事件
 * @param onUpload - 上传回调函数，接收文件路径并返回 Promise
 * @param message - 消息提示函数（如 useMessage 返回的 message）
 * @param message.error - 错误提示函数
 * @param message.success - 成功提示函数
 * @param options - 配置选项
 * @param loadingRef - 可选的 loading 状态引用
 * @param loadingRef.value - 当前上传 loading 状态
 */
export async function handleImageFileSelect(
  event: Event,
  onUpload: (filePath: string) => Promise<void>,
  message: {
    error: (msg: string) => void;
    success: (msg: string) => void;
  },
  options?: ImageUploadOptions,
  loadingRef?: { value: boolean },
): Promise<void> {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) {
    return;
  }

  const file = files[0];
  if (!file) {
    return;
  }

  // 验证文件
  const validation = validateImageFile(file, options);
  if (!validation.valid) {
    message.error(validation.error || '文件验证失败');
    target.value = '';
    return;
  }

  // 上传文件
  try {
    if (loadingRef) {
      loadingRef.value = true;
    }

    const res: any = await uploadFile(file);
    const filePath = res.filePath;

    if (filePath) {
      await onUpload(filePath);
      message.success(options?.successMsg || '头像更新成功');
    }
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || options?.errorMsg || $t('console.user.avatarUploadFailed'), (text) => message.error(text));
    console.error('上传头像失败:', error);
  } finally {
    if (loadingRef) {
      loadingRef.value = false;
    }
    // 清空 input value，允许重复选择同一文件
    target.value = '';
  }
}

/**
 * 根据字符串获取首字母
 * @param text - 文本字符串
 * @returns 首字母（中文直接返回，英文返回大写）
 */
export function getInitials(text: string | undefined): string {
  if (!text) return '';
  // 获取第一个字符，支持中文和英文
  const firstChar = text.trim().charAt(0);
  // 如果是中文字符，直接返回
  if (/[\u4E00-\u9FA5]/.test(firstChar)) {
    return firstChar;
  }
  // 如果是英文字符，返回大写
  return firstChar.toUpperCase();
}

/**
 * 根据字符串生成固定的背景颜色（符合 UX 的柔和颜色）
 * @param text - 文本字符串
 * @returns 十六进制颜色值
 */
export function getAvatarColorValue(text: string | undefined): string {
  if (!text) return '#6b7280'; // gray-500

  // 使用字符串的哈希值来生成固定颜色
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (text.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }

  // 预定义一组符合 UX 的柔和颜色（RGB 值）
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#06b6d4', // cyan-500
    '#f59e0b', // amber-500
    '#f43f5e', // rose-500
    '#8b5cf6', // violet-500
    '#10b981', // emerald-500
  ];

  // 使用哈希值选择颜色，确保相同字符串总是得到相同颜色
  const index = Math.abs(hash) % colors.length;
  return colors[index] ?? '#6b7280';
}
