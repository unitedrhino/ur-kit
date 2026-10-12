/** 文件说明：GoView 独立语言实例及宿主语言同步，避免编辑器沿用旧本地语言。 */
//语言
import { lang } from '@/settings/designSetting'
import { SUPPORT_LANGUAGES } from '@vben/saas/locales';
import { createI18n } from 'vue-i18n' //引入vue-i18n组件
import { getLocalStorage } from '@/utils'
import { StorageEnum }from '@/enums/storageEnum'
import { LangEnum } from '@/enums/styleEnum'
import type { LangStateType } from '@/store/modules/langStore/langStore.type'
import zh from './zh/index'
import en from './en/index'

const langStorage: LangStateType = getLocalStorage(StorageEnum.GO_LANG_STORE)

// 语言数组
export const langList = SUPPORT_LANGUAGES.map(({ label, value }) => ({ label, key: value }));

/** 初始消息保留独立编辑器兼容入口，嵌入后台时由宿主覆盖。 */
const initialMessages: Record<string, typeof en> = { [LangEnum.ZH]: zh, [LangEnum.EN]: en };

/** 编辑器独立实例支持宿主的全部语言标签。 */
const i18n = createI18n({
  legacy: false,
  globalInjection:true,
  locale: langStorage?.lang || lang,
  fallbackLocale: langStorage?.lang || lang,
  messages: initialMessages
})

/**
 * syncGoviewLocale 同步已加载的宿主消息与语言；保留编辑器旧命名空间以兼容存量组件。
 * @param locale 宿主当前语言标签
 * @param messages 宿主已加载的完整消息，包含编辑器兼容命名空间
 */
export function syncGoviewLocale(locale: string, messages: Record<string, any>): void {
  // 兼容命名空间只补充编辑器键，保留宿主已有的通用消息。
  const legacy = messages.bigscreenEditor?.legacy ?? (locale === 'zh-CN' ? zh : en);
  const mergedMessages = { ...messages };
  for (const namespace of ['global', 'login', 'project']) {
    mergedMessages[namespace] = { ...(messages[namespace] ?? {}), ...legacy[namespace] };
  }
  i18n.global.setLocaleMessage(locale, mergedMessages);
  i18n.global.fallbackLocale.value = 'en-US';
  i18n.global.locale.value = locale;
}

export default i18n
