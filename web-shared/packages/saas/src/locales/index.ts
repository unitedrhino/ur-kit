import type { App } from 'vue';

import type { LocaleSetupOptions, SupportedLanguagesType } from '@vben/locales';

import { $t, i18n, setupI18n as coreSetup } from '@vben/locales';
import { preferences } from '@vben/preferences';

import type { Get, Paths } from 'type-fest';

import { has } from 'lodash-es';
import { browserLanguages, resolveEffectiveLanguage } from './language';

import { businessLocalesMap as localesMap, loadBusinessLocaleMessages as loadMessages } from './messages';

async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  await coreSetup(app, {
    defaultLocale: resolveEffectiveLanguage(undefined, browserLanguages(), undefined),
    loadMessages,
    missingWarn: !import.meta.env.PROD,
    ...options,
  });
}

// 共享编辑器通过同一消息实例同步已加载的语言，避免读取偏好早于消息加载。
export { $t, i18n, setupI18n };
export { SUPPORT_LANGUAGES } from '@vben/constants';
export { applyPersonalLanguage, initializeEffectiveLanguage, resolveEffectiveLanguage, savePersonalLanguage } from './language';

export function isI18nKey(key: string): key is I18nKeyPath {
  return has(localesMap[preferences.app.locale], key);
}

export type LangType = (typeof localesMap)[keyof typeof localesMap];

// 获取所有语言包的联合类型
type AllLocaleMessages = {
  [K in keyof typeof localesMap]: Awaited<ReturnType<(typeof localesMap)[K]>>;
};

// 获取当前语言的消息类型
type CurrentLocaleMessages = AllLocaleMessages[SupportedLanguagesType];

// 生成所有可能的国际化键路径
export type I18nKeyPath = Paths<CurrentLocaleMessages['default'], { leavesOnly: true }>;

export type MaybeI18nKeyPath = I18nKeyPath | (string & {});
export type IsI18nKey<K> = K extends I18nKeyPath ? true : false;
export type Translate<K extends MaybeI18nKeyPath> = IsI18nKey<K> extends true ? Get<CurrentLocaleMessages['default'], K> : K;
