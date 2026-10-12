/**
 * 主题设计 Token。
 *
 * 这里是 mobile-uniapp 的主题入口，风格接近 Material Design 的 system color token：
 * - defaultThemeTokens 保存产品默认主题；
 * - resolveThemeTokens 将 Vite 环境变量归一化为运行时与构建时共用的 token；
 * - createThemeScssAdditionalData 把 token 注入页面 SCSS；
 * - createThemeStyleReplacements 把全局样式占位符替换为构建时 token，避开 uni.scss 的特殊编译顺序。
 */

export interface ThemeTokens {
  /** 主品牌色，用于按钮、链接、选中态和强调图标。 */
  colorPrimary: string;
  /** 主品牌浅色容器，用于弱强调背景。 */
  colorPrimaryContainer: string;
  /** 主品牌色上的前景色。 */
  colorOnPrimary: string;
  /** 主标题和高强调文字色。 */
  colorTextPrimary: string;
  /** 次级文字色。 */
  colorTextSecondary: string;
  /** 占位与弱提示文字色。 */
  colorTextPlaceholder: string;
  /** 页面背景色。 */
  colorPageBackground: string;
  /** 卡片与弹层表面色。 */
  colorSurface: string;
  /** 弱背景与列表侧栏背景色。 */
  colorSurfaceContainer: string;
  /** 边框与分割线色。 */
  colorOutlineVariant: string;
  /** 成功语义色。 */
  colorSuccess: string;
  /** 成功弱背景色。 */
  colorSuccessContainer: string;
  /** 警告语义色。 */
  colorWarning: string;
  /** 警告弱背景色。 */
  colorWarningContainer: string;
  /** 错误语义色。 */
  colorError: string;
  /** 错误弱背景色。 */
  colorErrorContainer: string;
  /** 遮罩色。 */
  colorScrim: string;
  /** 品牌阴影色。 */
  colorPrimaryShadow: string;
  /** 普通阴影色。 */
  colorShadow: string;
  /** 图表网格色。 */
  colorChartGrid: string;
}

export type ThemeEnv = Record<string, string | boolean | undefined>;

/** themeStylePlaceholders 是全局样式中允许出现的主题占位符。 */
export const themeStylePlaceholders = {
  colorPrimary: '__MOBILE_UNIAPP_THEME_COLOR_PRIMARY__',
  colorPrimaryContainer: '__MOBILE_UNIAPP_THEME_COLOR_PRIMARY_CONTAINER__',
  colorOnPrimary: '__MOBILE_UNIAPP_THEME_COLOR_ON_PRIMARY__',
  colorTextPrimary: '__MOBILE_UNIAPP_THEME_COLOR_TEXT_PRIMARY__',
  colorTextSecondary: '__MOBILE_UNIAPP_THEME_COLOR_TEXT_SECONDARY__',
  colorTextPlaceholder: '__MOBILE_UNIAPP_THEME_COLOR_TEXT_PLACEHOLDER__',
  colorPageBackground: '__MOBILE_UNIAPP_THEME_COLOR_PAGE_BACKGROUND__',
  colorSurface: '__MOBILE_UNIAPP_THEME_COLOR_SURFACE__',
  colorSurfaceContainer: '__MOBILE_UNIAPP_THEME_COLOR_SURFACE_CONTAINER__',
  colorOutlineVariant: '__MOBILE_UNIAPP_THEME_COLOR_OUTLINE_VARIANT__',
  colorSuccess: '__MOBILE_UNIAPP_THEME_COLOR_SUCCESS__',
  colorSuccessContainer: '__MOBILE_UNIAPP_THEME_COLOR_SUCCESS_CONTAINER__',
  colorWarning: '__MOBILE_UNIAPP_THEME_COLOR_WARNING__',
  colorWarningContainer: '__MOBILE_UNIAPP_THEME_COLOR_WARNING_CONTAINER__',
  colorError: '__MOBILE_UNIAPP_THEME_COLOR_ERROR__',
  colorErrorContainer: '__MOBILE_UNIAPP_THEME_COLOR_ERROR_CONTAINER__',
  colorScrim: '__MOBILE_UNIAPP_THEME_COLOR_SCRIM__',
  colorPrimaryShadow: '__MOBILE_UNIAPP_THEME_COLOR_PRIMARY_SHADOW__',
  colorShadow: '__MOBILE_UNIAPP_THEME_COLOR_SHADOW__',
  colorChartGrid: '__MOBILE_UNIAPP_THEME_COLOR_CHART_GRID__',
} as const;

/** defaultThemeTokens 是联犀默认主题，租户主题通过 VITE_THEME_* 覆盖。 */
export const defaultThemeTokens: ThemeTokens = {
  colorPrimary: '#1677ff',
  colorPrimaryContainer: 'rgba(22, 119, 255, 0.1)',
  colorOnPrimary: '#ffffff',
  colorTextPrimary: '#1a1a1a',
  colorTextSecondary: '#666666',
  colorTextPlaceholder: '#bbbbbb',
  colorPageBackground: '#f5f7fa',
  colorSurface: '#ffffff',
  colorSurfaceContainer: '#f7f8fa',
  colorOutlineVariant: '#f0f0f0',
  colorSuccess: '#52c41a',
  colorSuccessContainer: '#e8f7ef',
  colorWarning: '#faad14',
  colorWarningContainer: '#fff7e6',
  colorError: '#ff4d4f',
  colorErrorContainer: '#fff1f0',
  colorScrim: 'rgba(0, 0, 0, 0.45)',
  colorPrimaryShadow: 'rgba(22, 119, 255, 0.35)',
  colorShadow: 'rgba(31, 56, 88, 0.08)',
  colorChartGrid: '#edf1f7',
};

/** getEnvString 安全读取 Vite/Node 环境变量。 */
function getEnvString(env: ThemeEnv, key: string): string {
  const value = env[key];
  return value === undefined || value === null ? '' : String(value).trim();
}

/** normalizeHexColor 接受带 # 或不带 # 的十六进制颜色，非法配置回退默认值。 */
export function normalizeHexColor(value: string, fallback: string): string {
  const normalized = value.trim();
  if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) return normalized;
  if (/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) return `#${normalized}`;
  return fallback;
}

/** resolveThemeTokens 统一解析运行时和构建时主题 token。 */
export function resolveThemeTokens(env: ThemeEnv): ThemeTokens {
  return {
    colorPrimary: normalizeHexColor(getEnvString(env, 'VITE_THEME_PRIMARY_COLOR'), defaultThemeTokens.colorPrimary),
    colorPrimaryContainer: getEnvString(env, 'VITE_THEME_PRIMARY_LIGHT_COLOR') || defaultThemeTokens.colorPrimaryContainer,
    colorOnPrimary: normalizeHexColor(getEnvString(env, 'VITE_THEME_ON_PRIMARY_COLOR'), defaultThemeTokens.colorOnPrimary),
    colorTextPrimary: normalizeHexColor(getEnvString(env, 'VITE_THEME_TEXT_PRIMARY_COLOR'), defaultThemeTokens.colorTextPrimary),
    colorTextSecondary: normalizeHexColor(getEnvString(env, 'VITE_THEME_TEXT_SECONDARY_COLOR'), defaultThemeTokens.colorTextSecondary),
    colorTextPlaceholder: normalizeHexColor(getEnvString(env, 'VITE_THEME_TEXT_PLACEHOLDER_COLOR'), defaultThemeTokens.colorTextPlaceholder),
    colorPageBackground: normalizeHexColor(getEnvString(env, 'VITE_THEME_PAGE_BACKGROUND_COLOR'), defaultThemeTokens.colorPageBackground),
    colorSurface: normalizeHexColor(getEnvString(env, 'VITE_THEME_SURFACE_COLOR'), defaultThemeTokens.colorSurface),
    colorSurfaceContainer: normalizeHexColor(getEnvString(env, 'VITE_THEME_SURFACE_CONTAINER_COLOR'), defaultThemeTokens.colorSurfaceContainer),
    colorOutlineVariant: normalizeHexColor(getEnvString(env, 'VITE_THEME_OUTLINE_VARIANT_COLOR'), defaultThemeTokens.colorOutlineVariant),
    colorSuccess: normalizeHexColor(getEnvString(env, 'VITE_THEME_SUCCESS_COLOR'), defaultThemeTokens.colorSuccess),
    colorSuccessContainer: normalizeHexColor(getEnvString(env, 'VITE_THEME_SUCCESS_CONTAINER_COLOR'), defaultThemeTokens.colorSuccessContainer),
    colorWarning: normalizeHexColor(getEnvString(env, 'VITE_THEME_WARNING_COLOR'), defaultThemeTokens.colorWarning),
    colorWarningContainer: normalizeHexColor(getEnvString(env, 'VITE_THEME_WARNING_CONTAINER_COLOR'), defaultThemeTokens.colorWarningContainer),
    colorError: normalizeHexColor(getEnvString(env, 'VITE_THEME_ERROR_COLOR'), defaultThemeTokens.colorError),
    colorErrorContainer: normalizeHexColor(getEnvString(env, 'VITE_THEME_ERROR_CONTAINER_COLOR'), defaultThemeTokens.colorErrorContainer),
    colorScrim: getEnvString(env, 'VITE_THEME_SCRIM_COLOR') || defaultThemeTokens.colorScrim,
    colorPrimaryShadow: getEnvString(env, 'VITE_THEME_PRIMARY_SHADOW_COLOR') || defaultThemeTokens.colorPrimaryShadow,
    colorShadow: getEnvString(env, 'VITE_THEME_SHADOW_COLOR') || defaultThemeTokens.colorShadow,
    colorChartGrid: normalizeHexColor(getEnvString(env, 'VITE_THEME_CHART_GRID_COLOR'), defaultThemeTokens.colorChartGrid),
  };
}

/** createThemeScssAdditionalData 将主题 token 注入所有 SCSS 文件。 */
export function createThemeScssAdditionalData(tokens: ThemeTokens): string {
  return [
    `$theme-color-primary: ${tokens.colorPrimary};`,
    `$theme-color-primary-container: ${tokens.colorPrimaryContainer};`,
    `$theme-color-on-primary: ${tokens.colorOnPrimary};`,
    `$theme-color-text-primary: ${tokens.colorTextPrimary};`,
    `$theme-color-text-secondary: ${tokens.colorTextSecondary};`,
    `$theme-color-text-placeholder: ${tokens.colorTextPlaceholder};`,
    `$theme-color-page-background: ${tokens.colorPageBackground};`,
    `$theme-color-surface: ${tokens.colorSurface};`,
    `$theme-color-surface-container: ${tokens.colorSurfaceContainer};`,
    `$theme-color-outline-variant: ${tokens.colorOutlineVariant};`,
    `$theme-color-success: ${tokens.colorSuccess};`,
    `$theme-color-success-container: ${tokens.colorSuccessContainer};`,
    `$theme-color-warning: ${tokens.colorWarning};`,
    `$theme-color-warning-container: ${tokens.colorWarningContainer};`,
    `$theme-color-error: ${tokens.colorError};`,
    `$theme-color-error-container: ${tokens.colorErrorContainer};`,
    `$theme-color-scrim: ${tokens.colorScrim};`,
    `$theme-color-primary-shadow: ${tokens.colorPrimaryShadow};`,
    `$theme-color-shadow: ${tokens.colorShadow};`,
    `$theme-color-chart-grid: ${tokens.colorChartGrid};`,
  ].join(' ');
}

/** createThemeStyleReplacements 生成全局样式占位符到真实主题 token 的替换表。 */
export function createThemeStyleReplacements(tokens: ThemeTokens): Record<string, string> {
  return {
    [themeStylePlaceholders.colorPrimary]: tokens.colorPrimary,
    [themeStylePlaceholders.colorPrimaryContainer]: tokens.colorPrimaryContainer,
    [themeStylePlaceholders.colorOnPrimary]: tokens.colorOnPrimary,
    [themeStylePlaceholders.colorTextPrimary]: tokens.colorTextPrimary,
    [themeStylePlaceholders.colorTextSecondary]: tokens.colorTextSecondary,
    [themeStylePlaceholders.colorTextPlaceholder]: tokens.colorTextPlaceholder,
    [themeStylePlaceholders.colorPageBackground]: tokens.colorPageBackground,
    [themeStylePlaceholders.colorSurface]: tokens.colorSurface,
    [themeStylePlaceholders.colorSurfaceContainer]: tokens.colorSurfaceContainer,
    [themeStylePlaceholders.colorOutlineVariant]: tokens.colorOutlineVariant,
    [themeStylePlaceholders.colorSuccess]: tokens.colorSuccess,
    [themeStylePlaceholders.colorSuccessContainer]: tokens.colorSuccessContainer,
    [themeStylePlaceholders.colorWarning]: tokens.colorWarning,
    [themeStylePlaceholders.colorWarningContainer]: tokens.colorWarningContainer,
    [themeStylePlaceholders.colorError]: tokens.colorError,
    [themeStylePlaceholders.colorErrorContainer]: tokens.colorErrorContainer,
    [themeStylePlaceholders.colorScrim]: tokens.colorScrim,
    [themeStylePlaceholders.colorPrimaryShadow]: tokens.colorPrimaryShadow,
    [themeStylePlaceholders.colorShadow]: tokens.colorShadow,
    [themeStylePlaceholders.colorChartGrid]: tokens.colorChartGrid,
  };
}
