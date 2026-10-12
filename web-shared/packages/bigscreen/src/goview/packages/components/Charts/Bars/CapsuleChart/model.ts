/**
 * 文件说明：胶囊排行图的数值展示格式，避免大数值标签挤压和难以辨读。
 */

import { i18n } from '@vben/saas/locales';

/** formatCapsuleValue 按当前界面语言格式化排行值；参数为原始值，返回最多两位小数的展示文本。 */
export function formatCapsuleValue(value: unknown): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? '');
  return new Intl.NumberFormat(i18n.global.locale.value, {
    maximumFractionDigits: 2,
  }).format(numeric);
}

/** formatCapsuleScale 将原始数值转换为当前语言的紧凑刻度，中文保留原有量级规则。 */
export function formatCapsuleScale(value: unknown): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? '');
  // 非中文刻度使用语言标准的紧凑量级，避免英文界面仍显示万、亿。
  const locale = i18n.global.locale.value;
  if (!locale.startsWith('zh')) {
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);
  }
  const absolute = Math.abs(numeric);
  if (absolute >= 100_000_000) return `${trimScale(numeric / 100_000_000)}${locale === 'zh-TW' ? '億' : '亿'}`;
  if (absolute >= 10_000) return `${trimScale(numeric / 10_000)}万`;
  if (absolute >= 1_000) return `${trimScale(numeric / 1_000)}千`;
  return trimScale(numeric);
}

/** trimScale 保留最多一位小数，同时移除整数末尾的零。 */
function trimScale(value: number): string {
  return Number(value.toFixed(1)).toString();
}
