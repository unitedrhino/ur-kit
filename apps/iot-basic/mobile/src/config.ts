/**
 * 平台与环境配置（多端兼容）
 * - mp-weixin: 通过 __wxConfig.envVersion 区分 develop / trial / release
 * - APP-PLUS: 通过 uni.getSystemInfoSync().platform 区分 Android / iOS
 * - 其他平台: 兜底使用微信小程序业务应用配置，环境通过 import.meta.env.MODE 区分
 */
import { resolveThemeTokens } from './config/theme';

interface EnvConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  appId: string;
  tenantApiBaseUrl: string;
  brandName: string;
  tenantMode: TenantMode;
  singleTenantCode: string;
  themePrimaryColor: string;
  themePrimaryLightColor: string;
  themeOnPrimaryColor: string;
  themeTextPrimaryColor: string;
  themeTextSecondaryColor: string;
  themeTextPlaceholderColor: string;
  themeBorderColor: string;
  themeErrorColor: string;
  themeChartGridColor: string;
  terminologyPreset: TerminologyPreset;
  persistLocalLogs: boolean;
  localLogHistoryLimit: number;
}

type EnvVersion = 'develop' | 'trial' | 'release';
type RuntimePlatform = 'mp-weixin' | 'app-android' | 'app-ios';
/** TenantMode 表示移动端组织上下文模式：multi 保留选择/邀请，single 固定配置组织。 */
export type TenantMode = 'single' | 'multi';
/** TerminologyPreset 表示当前环境使用的项目/区域用户可见文案预设。 */
export type TerminologyPreset = 'home' | 'projectArea';

/** buildEnv 保存 Vite 编译期注入的环境变量，避免在小程序运行态直接访问 import.meta 本体。 */
const buildEnv = import.meta.env as Record<string, string | boolean | undefined>;

/** 读取构建期注入的前端环境变量，不存在时返回空字符串。 */
function getBuildEnvValue(key: string): string {
  const value = buildEnv[key];
  return value === undefined || value === null ? '' : String(value);
}

const persistLocalLogs = getBuildEnvValue('VITE_LOG_PERSIST_HISTORY') !== 'false';
const localLogHistoryLimit = normalizeLogHistoryLimit(getBuildEnvValue('VITE_LOG_HISTORY_LIMIT'));
const apiBaseUrl = normalizeBaseUrl(getBuildEnvValue('VITE_API_BASE_URL'));
const wsBaseUrl = normalizeBaseUrl(getBuildEnvValue('VITE_WS_BASE_URL'));
const brandName = getBuildEnvValue('VITE_BRAND_NAME').trim() || '联犀';
const tenantMode = normalizeTenantMode(getBuildEnvValue('VITE_TENANT_MODE'));
const singleTenantCode = getBuildEnvValue('VITE_SINGLE_TENANT_CODE').trim();
/** terminologyPreset 保存构建期选择的项目/区域术语预设，未配置时保持项目/区域默认口径。 */
const terminologyPreset = normalizeTerminologyPreset(getBuildEnvValue('VITE_TERMINOLOGY_PRESET'));
const tenantApiBaseUrl = normalizeBaseUrl(getBuildEnvValue('VITE_TENANT_API_BASE_URL'));
const themeTokens = resolveThemeTokens(buildEnv);

/** 解析本地日志历史容量，非法配置回退到默认 200 条。 */
function normalizeLogHistoryLimit(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 200;
  return Math.floor(parsed);
}

/** 解析租户模式配置，非法值回退到多组织默认模式。 */
function normalizeTenantMode(value: string): TenantMode {
  return value === 'single' ? 'single' : 'multi';
}

/** 解析术语预设配置，非法值回退到项目/区域默认模式。 */
function normalizeTerminologyPreset(value: string): TerminologyPreset {
  return value === 'home' ? 'home' : 'projectArea';
}

/** normalizeBaseUrl 统一去掉接口域名末尾斜杠，避免拼接接口路径时出现双斜杠。 */
function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

const baseLogConfig = {
  persistLocalLogs,
  localLogHistoryLimit,
};

const baseTenantConfig = {
  brandName,
  tenantMode,
  singleTenantCode,
};

/** baseTerminologyConfig 保存用户可见业务对象术语配置，供所有端和环境复用。 */
const baseTerminologyConfig = {
  terminologyPreset,
};

const baseThemeConfig = {
  themePrimaryColor: themeTokens.colorPrimary,
  themePrimaryLightColor: themeTokens.colorPrimaryContainer,
  themeOnPrimaryColor: themeTokens.colorOnPrimary,
  themeTextPrimaryColor: themeTokens.colorTextPrimary,
  themeTextSecondaryColor: themeTokens.colorTextSecondary,
  themeTextPlaceholderColor: themeTokens.colorTextPlaceholder,
  themeBorderColor: themeTokens.colorOutlineVariant,
  themeErrorColor: themeTokens.colorError,
  themeChartGridColor: themeTokens.colorChartGrid,
};

function normalizeApiBaseUrl(value: string, fallback: string): string {
  return value || fallback;
}

function normalizeTenantApiBaseUrl(value: string, fallback: string): string {
  return value || fallback;
}

/** normalizeWsBaseUrl 默认让 WS 跟随 API 环境，避免登录 token 和 WS 鉴权落到不同后端。 */
function normalizeWsBaseUrl(value: string, apiUrl: string, fallback: string): string {
  if (value) return value;
  if (apiUrl.startsWith('https://')) return `wss://${apiUrl.slice('https://'.length)}`;
  if (apiUrl.startsWith('http://')) return `ws://${apiUrl.slice('http://'.length)}`;
  return fallback;
}

const platformEnvMap: Record<RuntimePlatform, Record<EnvVersion, EnvConfig>> = {
  'mp-weixin': {
    develop: {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl, ''),
      wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl, normalizeApiBaseUrl(apiBaseUrl, ''), ''),
      tenantApiBaseUrl: normalizeTenantApiBaseUrl(tenantApiBaseUrl, normalizeApiBaseUrl(apiBaseUrl, '')),
      appId: '700',
      ...baseTenantConfig,
      ...baseThemeConfig,
      ...baseTerminologyConfig,
      ...baseLogConfig,
    },
    trial: {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl, ''),
      wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl, normalizeApiBaseUrl(apiBaseUrl, ''), ''),
      tenantApiBaseUrl: normalizeTenantApiBaseUrl(tenantApiBaseUrl, normalizeApiBaseUrl(apiBaseUrl, '')),
      appId: '700',
      ...baseTenantConfig,
      ...baseThemeConfig,
      ...baseTerminologyConfig,
      ...baseLogConfig,
    },
    release: {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl, ''),
      wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl, normalizeApiBaseUrl(apiBaseUrl, ''), ''),
      tenantApiBaseUrl: normalizeTenantApiBaseUrl(tenantApiBaseUrl, normalizeApiBaseUrl(apiBaseUrl, '')),
      appId: '700',
      ...baseTenantConfig,
      ...baseThemeConfig,
      ...baseTerminologyConfig,
      ...baseLogConfig,
    },
  },
  'app-android': {
    develop: {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl, ''),
      wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl, normalizeApiBaseUrl(apiBaseUrl, ''), ''),
      tenantApiBaseUrl: normalizeTenantApiBaseUrl(tenantApiBaseUrl, normalizeApiBaseUrl(apiBaseUrl, '')),
      appId: '800',
      ...baseTenantConfig,
      ...baseThemeConfig,
      ...baseTerminologyConfig,
      ...baseLogConfig,
    },
    trial: {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl, ''),
      wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl, normalizeApiBaseUrl(apiBaseUrl, ''), ''),
      tenantApiBaseUrl: normalizeTenantApiBaseUrl(tenantApiBaseUrl, normalizeApiBaseUrl(apiBaseUrl, '')),
      appId: '800',
      ...baseTenantConfig,
      ...baseThemeConfig,
      ...baseTerminologyConfig,
      ...baseLogConfig,
    },
    release: {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl, ''),
      wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl, normalizeApiBaseUrl(apiBaseUrl, ''), ''),
      tenantApiBaseUrl: normalizeTenantApiBaseUrl(tenantApiBaseUrl, normalizeApiBaseUrl(apiBaseUrl, '')),
      appId: '800',
      ...baseTenantConfig,
      ...baseThemeConfig,
      ...baseTerminologyConfig,
      ...baseLogConfig,
    },
  },
  'app-ios': {
    develop: {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl, ''),
      wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl, normalizeApiBaseUrl(apiBaseUrl, ''), ''),
      tenantApiBaseUrl: normalizeTenantApiBaseUrl(tenantApiBaseUrl, normalizeApiBaseUrl(apiBaseUrl, '')),
      appId: '900',
      ...baseTenantConfig,
      ...baseThemeConfig,
      ...baseTerminologyConfig,
      ...baseLogConfig,
    },
    trial: {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl, ''),
      wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl, normalizeApiBaseUrl(apiBaseUrl, ''), ''),
      tenantApiBaseUrl: normalizeTenantApiBaseUrl(tenantApiBaseUrl, normalizeApiBaseUrl(apiBaseUrl, '')),
      appId: '900',
      ...baseTenantConfig,
      ...baseThemeConfig,
      ...baseTerminologyConfig,
      ...baseLogConfig,
    },
    release: {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl, ''),
      wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl, normalizeApiBaseUrl(apiBaseUrl, ''), ''),
      tenantApiBaseUrl: normalizeTenantApiBaseUrl(tenantApiBaseUrl, normalizeApiBaseUrl(apiBaseUrl, '')),
      appId: '900',
      ...baseTenantConfig,
      ...baseThemeConfig,
      ...baseTerminologyConfig,
      ...baseLogConfig,
    },
  },
};

function normalizeEnvVersion(value: string): EnvVersion {
  if (value === 'trial' || value === 'release') return value;
  return 'develop';
}

/** 获取当前运行平台对应的 SaaS 业务应用配置分支。 */
function getRuntimePlatform(): RuntimePlatform {
  let platform: RuntimePlatform = 'mp-weixin';
  // #ifdef MP-WEIXIN
  platform = 'mp-weixin';
  // #endif
  // #ifdef APP-PLUS
  try {
    const systemInfo = uni.getSystemInfoSync();
    platform = systemInfo.platform === 'ios' ? 'app-ios' : 'app-android';
  } catch (_) {
    platform = 'app-android';
  }
  // #endif
  return platform;
}

/** 获取当前环境版本，非微信端只区分开发与生产构建。 */
function getEnvVersion(): EnvVersion {
  // #ifdef MP-WEIXIN
  try {
    // @ts-ignore
    if (typeof __wxConfig !== 'undefined' && __wxConfig.envVersion) {
      // @ts-ignore
      return normalizeEnvVersion(__wxConfig.envVersion);
    }
  } catch (_) {
    // ignore
  }
  // #endif
  const mode = getBuildEnvValue('MODE');
  if (mode === 'production') return 'release';
  if (mode === 'development') return 'develop';
  return 'develop';
}

const runtimePlatform = getRuntimePlatform();
const envVersion = getEnvVersion();

export const config: EnvConfig =
  platformEnvMap[runtimePlatform]?.[envVersion] || platformEnvMap['mp-weixin'].develop;
