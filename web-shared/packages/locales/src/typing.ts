/** 前端支持的 BCP 47 语言标签（与 SUPPORT_LANGUAGES 清单同步维护） */
export type SupportedLanguagesType =
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

export type ImportLocaleFn = () => Promise<{ default: Record<string, string> }>;

export type LoadMessageFn = (lang: SupportedLanguagesType) => Promise<Record<string, string> | undefined>;

export interface LocaleSetupOptions {
  /**
   * Default language
   * @default zh-CN
   */
  defaultLocale?: SupportedLanguagesType;
  /**
   * Load message function
   * @param lang
   * @returns
   */
  loadMessages?: LoadMessageFn;
  /**
   * Whether to warn when the key is not found
   */
  missingWarn?: boolean;
}
