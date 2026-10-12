/**
 * @zh_CN 登录页面 url 地址
 */
export const LOGIN_PATH = '/auth/login';

/** BCP 47 语言标签（统一多语言支持清单的值类型） */
export type LanguageTag =
  | 'en-US'
  | 'zh-CN'
  | 'zh-TW'
  | 'es-ES'
  | 'ar'
  | 'fr-FR'
  | 'bn-BD'
  | 'pt-BR'
  | 'ru-RU'
  | 'id-ID'
  | 'th-TH'
  | 'ur-PK'
  | 'de-DE'
  | 'ja-JP';

export interface LanguageOption {
  /** 各语言以自身名称展示（如日语显示「日本語」），不随界面语言变化 */
  label: string;
  value: LanguageTag;
}

/**
 * Supported languages（统一多语言清单，TASK-142 扩展）
 * 顺序按任务约定：中文、英语在前，其余按使用人口排列。
 * 新增语言须同步：语言包目录（packages/locales 与 packages/saas/locales/langs/<tag>/）、
 * check-i18n-keys.mjs 校验、后端各服务 etc/i18n/<Go 标签>.json。
 */
export const SUPPORT_LANGUAGES: LanguageOption[] = [
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en-US' },
  { label: 'Español', value: 'es-ES' },
  { label: 'العربية', value: 'ar' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'বাংলা', value: 'bn-BD' },
  { label: 'Português', value: 'pt-BR' },
  { label: 'Русский', value: 'ru-RU' },
  { label: 'Bahasa Indonesia', value: 'id-ID' },
  { label: 'ไทย', value: 'th-TH' },
  { label: 'اردو', value: 'ur-PK' },
  { label: 'Deutsch', value: 'de-DE' },
  { label: '日本語', value: 'ja-JP' },
];
