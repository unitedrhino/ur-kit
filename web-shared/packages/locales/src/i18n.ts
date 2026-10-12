/** 文件说明：装载多语言资源、切换当前语言，并同步页面语言与书写方向。 */
import type { App } from 'vue';
import type { Locale } from 'vue-i18n';

import type { ImportLocaleFn, LoadMessageFn, LocaleSetupOptions, SupportedLanguagesType } from './typing';

import { unref } from 'vue';
import { createI18n } from 'vue-i18n';

import { useSimpleLocale } from '@vben-core/composables';

const i18n = createI18n({
  fallbackLocale: 'zh-CN',
  globalInjection: true,
  legacy: false,
  locale: '',
  messages: {},
});

const modules = import.meta.glob('./langs/**/*.json');

const { setSimpleLocale } = useSimpleLocale();

const localesMap = loadLocalesMapFromDir(/\.\/langs\/([^/]+)\/(.*)\.json$/, modules);
let loadMessages: LoadMessageFn;
let requestedVersion = 0;
let languageSwitchHook: null | ((language: SupportedLanguagesType) => Promise<void>) = null;
let switchQueue = Promise.resolve();

/**
 * Load locale modules
 * @param modules
 */
function loadLocalesMap(modules: Record<string, () => Promise<unknown>>) {
  const localesMap: Record<Locale, ImportLocaleFn> = {};

  for (const [path, loadLocale] of Object.entries(modules)) {
    const key = path.match(/([\w-]*)\.(json)/)?.[1];
    if (key) {
      localesMap[key] = loadLocale as ImportLocaleFn;
    }
  }
  return localesMap;
}

/**
 * Load locale modules with directory structure
 * @param regexp - Regular expression to match language and file names
 * @param modules - The modules object containing paths and import functions
 * @returns A map of locales to their corresponding import functions
 */
function loadLocalesMapFromDir(regexp: RegExp, modules: Record<string, () => Promise<unknown>>): Record<Locale, ImportLocaleFn> {
  const localesRaw: Record<Locale, Record<string, () => Promise<unknown>>> = {};
  const localesMap: Record<Locale, ImportLocaleFn> = {};

  // Iterate over the modules to extract language and file names
  for (const path in modules) {
    const match = path.match(regexp);
    if (match) {
      const [_, locale, fileName] = match;
      if (locale && fileName) {
        if (!localesRaw[locale]) {
          localesRaw[locale] = {};
        }
        if (modules[path]) {
          localesRaw[locale][fileName] = modules[path];
        }
      }
    }
  }

  // Convert raw locale data into async import functions
  for (const [locale, files] of Object.entries(localesRaw)) {
    localesMap[locale] = async () => {
      const messages: Record<string, any> = {};
      for (const [fileName, importFn] of Object.entries(files)) {
        messages[fileName] = ((await importFn()) as any)?.default;
      }
      return { default: messages };
    };
  }

  return localesMap;
}

/** setI18nLanguage 提交语言及书写方向；locale 为目标语言，无返回值。 */
function setI18nLanguage(locale: Locale) {
  i18n.global.locale.value = locale;
  if (typeof document !== 'undefined') {
    document.querySelector('html')?.setAttribute('lang', locale);
    // 阿语与乌尔都语均使用 RTL；Tailwind 的 start-/end- 类会按 lang 镜像，dir 必须保持一致，避免侧栏和页头错位。
    document.documentElement.setAttribute('dir', locale === 'ar' || locale === 'ur-PK' ? 'rtl' : 'ltr');
  }
}

async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  const { defaultLocale = 'zh-CN' } = options;
  // app可以自行扩展一些第三方库和组件库的国际化
  loadMessages = options.loadMessages || (async () => ({}));
  app.use(i18n);
  // 英文缺键时使用中文兜底；首屏先载入中文，避免回退到裸键名。
  await loadLocaleMessages('zh-CN');
  if (defaultLocale !== 'zh-CN') {
    await loadLocaleMessages(defaultLocale);
  }

  // 在控制台打印警告
  i18n.global.setMissingHandler((locale, key) => {
    if (options.missingWarn && key.includes('.')) {
      console.warn(`[intlify] Not found '${key}' key in '${locale}' locale messages.`);
    }
  });
}

/**
 * Load locale messages
 * @param lang
 */
async function loadLocaleMessages(lang: SupportedLanguagesType) {
  // 每次意图都递增版本，旧异步请求完成时不得覆盖较新的语言选择。
  const version = ++requestedVersion;
  if (unref(i18n.global.locale) === lang) {
    setI18nLanguage(lang);
    return true;
  }
  const importer = localesMap[lang];
  if (!importer) throw new Error(`Unsupported locale: ${lang}`);
  // 两组语言包均成功载入后才提交，失败时保留页面、组件库与请求头语言。
  const [message, mergeMessage] = await Promise.all([importer(), loadMessages(lang)]);
  if (version !== requestedVersion) return false;
  i18n.global.setLocaleMessage(lang, message.default);
  if (mergeMessage) i18n.global.mergeLocaleMessage(lang, mergeMessage);
  setSimpleLocale(lang);
  setI18nLanguage(lang);
  return true;
}

/** setLanguageSwitchHook 注册业务侧的个人语言持久化动作，通用切换器不直接依赖业务 API。 */
function setLanguageSwitchHook(hook: null | ((language: SupportedLanguagesType) => Promise<void>)) {
  languageSwitchHook = hook;
}

/** switchLocale 串行提交切换；持久化失败时恢复原语言，不让较早请求覆盖较新选择。 */
function switchLocale(lang: SupportedLanguagesType) {
  const operation = switchQueue.then(async () => {
    const previous = unref(i18n.global.locale) as SupportedLanguagesType;
    try {
      if (!await loadLocaleMessages(lang)) return false;
      await languageSwitchHook?.(lang);
      return true;
    } catch (error) {
      await loadLocaleMessages(previous);
      throw error;
    }
  });
  switchQueue = operation.then(() => {}, () => {});
  return operation;
}

export { i18n, loadLocaleMessages, loadLocalesMap, loadLocalesMapFromDir, setLanguageSwitchHook, setupI18n, switchLocale };
