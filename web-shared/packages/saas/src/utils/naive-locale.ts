import { arDZ, dateArDZ, dateDeDE, dateEnUS, dateEsAR, dateFrFR, dateIdID, dateJaJP, datePtBR, dateRuRU, dateThTH, dateZhCN, dateZhTW, deDE, enUS, esAR, frFR, idID, jaJP, ptBR, ruRU, thTH, zhCN, zhTW } from 'naive-ui';

/**
 * 文件说明：统一多语言（TASK-142 扩展）的 Naive UI locale 映射。
 * 按界面语言标签返回组件库 locale 与日期 locale；naive-ui 未提供的语言
 * （孟加拉语、乌尔都语等）回退英文，泰语使用组件库内置映射。
 */
const NAIVE_LOCALES: Record<string, { locale: unknown; dateLocale: unknown }> = {
  'zh-CN': { locale: zhCN, dateLocale: dateZhCN },
  'en-US': { locale: enUS, dateLocale: dateEnUS },
  'zh-TW': { locale: zhTW, dateLocale: dateZhTW },
  'ja-JP': { locale: jaJP, dateLocale: dateJaJP },
  'ru-RU': { locale: ruRU, dateLocale: dateRuRU },
  'de-DE': { locale: deDE, dateLocale: dateDeDE },
  'fr-FR': { locale: frFR, dateLocale: dateFrFR },
  // naive-ui 无 es-ES，esAR 为最接近的西班牙语 locale
  'es-ES': { locale: esAR, dateLocale: dateEsAR },
  'pt-BR': { locale: ptBR, dateLocale: datePtBR },
  'id-ID': { locale: idID, dateLocale: dateIdID },
  'th-TH': { locale: thTH, dateLocale: dateThTH },
  // naive-ui 无标准阿语，arDZ 为最接近的阿拉伯语 locale
  ar: { locale: arDZ, dateLocale: dateArDZ },
};

/**
 * naiveLocaleFor 按语言标签取 Naive UI locale 与日期 locale。
 * @param tag 界面语言标签（BCP 47）
 * @returns 未提供的语言回退英文 locale
 */
export function naiveLocaleFor(tag: string) {
  const hit = NAIVE_LOCALES[tag];
  return {
    locale: (hit?.locale ?? enUS) as typeof enUS,
    dateLocale: (hit?.dateLocale ?? dateEnUS) as typeof dateEnUS,
  };
}
