import type { CoreApi } from '@vben/api';

import { translatePresetAppName } from '@vben/saas/utils';

/**
 * 当前登录应用标识解析工具。
 *
 * 登录页在多个 Web 子应用间复用，这里统一把后端应用名与前端环境变量整理成用户可见名称。
 */
export interface CurrentAppEnv {
  /** 当前应用 ID，用于兜底展示。 */
  appId?: string;
  /** 当前应用运行标识，如 console、platform-manage。 */
  appName?: string;
  /** 当前应用前端标题。 */
  appTitle?: string;
}

/** 规范化可展示文本，过滤空白字符串。 */
function normalizeDisplayText(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

/** resolveCurrentAppDisplayName 按后端名称、标题、运行标识、应用 ID 的顺序解析展示名。 */
export function resolveCurrentAppDisplayName(
  appInfo: Pick<CoreApi.AppInfo, 'name'> | null | undefined,
  env: CurrentAppEnv,
) {
  const backendName = normalizeDisplayText(appInfo?.name);
  if (backendName) {
    // 预置应用多语言：仅当后端名称与种子默认名一致（未被平台管理员改写）时改用翻译键渲染
    return translatePresetAppName(env.appId, backendName) ?? backendName;
  }

  const appTitle = normalizeDisplayText(env.appTitle);
  if (appTitle) return appTitle;

  const appName = normalizeDisplayText(env.appName);
  if (appName) return appName;

  const appId = normalizeDisplayText(env.appId);
  return appId ? `应用 ${appId}` : '当前应用';
}

/** getCurrentAppEnv 读取当前构建注入的应用环境变量。 */
export function getCurrentAppEnv(): CurrentAppEnv {
  return {
    appId: import.meta.env.VITE_GLOB_APPID,
    appName: import.meta.env.VITE_GLOB_APPNAME,
    appTitle: import.meta.env.VITE_APP_TITLE,
  };
}
