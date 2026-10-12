/** 业务语言资源窄入口：只装载消息，供独立应用复用，避免引入登录、API 和业务状态。 */
import type { SupportedLanguagesType } from '@vben/locales';
import { loadLocalesMapFromDir } from '@vben/locales';

/** 已注册业务语言按目录装载，保持与主应用使用同一份翻译。 */
export const businessLocalesMap = loadLocalesMapFromDir(/\.\/langs\/([^/]+)\/(.*)\.json$/, import.meta.glob('./langs/**/*.json'));

/** loadBusinessLocaleMessages 返回目标语言的业务消息，未注册时返回 undefined。 */
export async function loadBusinessLocaleMessages(language: SupportedLanguagesType) {
  const messages = await businessLocalesMap[language]?.();
  return messages?.default;
}
