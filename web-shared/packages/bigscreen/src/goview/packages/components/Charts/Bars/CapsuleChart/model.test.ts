/** 文件说明：胶囊图数字展示回归，覆盖中文量级与英文紧凑刻度。 */
import { i18n } from '@vben/saas/locales';
/**
 * 文件说明：验证胶囊排行图的大数值和紧凑刻度格式。
 */
import { describe, expect, it } from 'vitest';

import { formatCapsuleScale, formatCapsuleValue } from './model';

describe('CapsuleChart 数值格式', () => {
  it('排行值使用千分位并保留必要小数', () => {
    expect(formatCapsuleValue(47304)).toBe('47,304');
    expect(formatCapsuleValue(3.456)).toBe('3.46');
  });

  it('密集横轴使用紧凑量级', () => {
    expect(formatCapsuleScale(0)).toBe('0');
    expect(formatCapsuleScale(47304)).toBe('4.7万');
    expect(formatCapsuleScale(800_000_000)).toBe('8亿');
  });
  it('英文刻度使用当前语言量级并保留原始数值含义', () => {
    const previousLocale = i18n.global.locale.value;
    i18n.global.locale.value = 'en-US';
    try {
      expect(formatCapsuleScale(47304)).toBe('47.3K');
      expect(formatCapsuleScale(800_000_000)).toBe('800M');
      expect(formatCapsuleValue(47304)).toBe('47,304');
    } finally {
      i18n.global.locale.value = previousLocale;
    }
  });

});
