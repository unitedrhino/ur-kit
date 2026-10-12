/**
 * 文件说明：集中计算软件界面的有效语言；个人设置高于浏览器，平台默认值仅作兜底。
 */
import type { SupportedLanguagesType } from '@vben/locales';

import { CoreApi } from '@vben/api';
import { SUPPORT_LANGUAGES } from '@vben/constants';
import { loadLocaleMessages, setLanguageSwitchHook } from '@vben/locales';
import { preferences, updatePreferences } from '@vben/preferences';
import { useAccessStore, useSystemConfigStore, useUserStore } from '@vben/stores';

const FALLBACK_LANGUAGE: SupportedLanguagesType = 'zh-CN';

/** normalizeLanguage 将明确配置或浏览器语言匹配到当前注册的语言。 */
export function normalizeLanguage(value: null | string | undefined, allowFamily = false): SupportedLanguagesType | undefined {
  const normalized = value?.trim().replaceAll('_', '-').toLowerCase();
  if (!normalized) return undefined;
  const exact = SUPPORT_LANGUAGES.find((item) => item.value.toLowerCase() === normalized);
  if (exact) return exact.value;
  if (!allowFamily) return undefined;
  const family = normalized.split('-')[0];
  const matches = SUPPORT_LANGUAGES.filter((item) => item.value.toLowerCase().split('-')[0] === family);
  return matches.length === 1 ? matches[0]?.value : undefined;
}

/** resolveEffectiveLanguage 按个人、浏览器、平台、中文顺序选择可用语言。 */
export function resolveEffectiveLanguage(
  personal: null | string | undefined,
  browser: readonly string[],
  platform: null | string | undefined,
): SupportedLanguagesType {
  const personalLanguage = normalizeLanguage(personal);
  if (personalLanguage) return personalLanguage;
  for (const candidate of browser) {
    const browserLanguage = normalizeLanguage(candidate, true);
    if (browserLanguage) return browserLanguage;
  }
  return normalizeLanguage(platform) ?? FALLBACK_LANGUAGE;
}

/** browserLanguages 返回浏览器按优先级声明的语言。 */
export function browserLanguages(): string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length ? [...navigator.languages] : [navigator.language];
}

/** initializeEffectiveLanguage 在 Pinia 初始化后应用平台配置和当前个人偏好。 */
export async function initializeEffectiveLanguage(): Promise<void> {
  // 业务持久化放在项目自有包，通用切换组件只调用已注册的动作。
  setLanguageSwitchHook(async (language) => {
    if (useAccessStore().accessToken) {
      await CoreApi.postApiV1SystemUserSelfUpdate({ language });
      useUserStore().$patch((state) => {
        if (state.userInfo) state.userInfo.language = language;
      });
    }
    updatePreferences({ app: { locale: language } });
  });
  // 启动时刷新公开配置，避免跨应用沿用过期的平台默认语言；请求失败由 store 回退缓存。
  const config = await useSystemConfigStore().getSystemConfig(true);
  const user = useUserStore().userInfo;
  const effective = resolveEffectiveLanguage(user?.language, browserLanguages(), config?.defaultLanguage);
  if (await loadLocaleMessages(effective)) {
    updatePreferences({ app: { locale: effective } });
  }
}

/** applyPersonalLanguage 在登录或个人设置变更后重新计算并应用有效语言。 */
export async function applyPersonalLanguage(language: null | string | undefined): Promise<void> {
  const config = await useSystemConfigStore().getSystemConfig();
  const effective = resolveEffectiveLanguage(language, browserLanguages(), config?.defaultLanguage);
  if (await loadLocaleMessages(effective)) {
    updatePreferences({ app: { locale: effective } });
  }
}

/** savePersonalLanguage 从快捷入口保存个人偏好；先载入目标语言，保存失败时恢复原界面。 */
export async function savePersonalLanguage(language: string): Promise<void> {
  const userStore = useUserStore();
  const previousLanguage = userStore.userInfo?.language ?? '';
  if (language === previousLanguage) return;
  if (language && !normalizeLanguage(language)) throw new Error('Unsupported personal language');

  const previousEffective = currentEffectiveLanguage();
  const config = await useSystemConfigStore().getSystemConfig();
  const effective = resolveEffectiveLanguage(language, browserLanguages(), config?.defaultLanguage);
  if (!(await loadLocaleMessages(effective))) throw new Error('Language switch superseded');

  try {
    await CoreApi.postApiV1SystemUserSelfUpdate({ language });
    userStore.$patch((state) => {
      if (state.userInfo) state.userInfo.language = language;
    });
    updatePreferences({ app: { locale: effective } });
  } catch (error) {
    await loadLocaleMessages(previousEffective);
    throw error;
  }
}

/** currentEffectiveLanguage 返回已提交的请求语言，与页面语言一致。 */
export function currentEffectiveLanguage(): SupportedLanguagesType {
  return normalizeLanguage(preferences.app.locale) ?? FALLBACK_LANGUAGE;
}
