/** 文件说明：确认共用表单轻量词库覆盖全部受支持语言与操作按钮。 */
import { describe, expect, it } from 'vitest';

import { getMessages, messages } from './messages';

/** 表单操作按钮使用的全部轻量文案键。 */
const ACTION_KEYS = ['cancel', 'collapse', 'confirm', 'expand', 'prompt', 'reset', 'submit'] as const;

describe('共用表单轻量词库', () => {
  it('14 种语言均有完整操作文案，不回退英语按钮', () => {
    expect(Object.keys(messages)).toHaveLength(14);
    for (const [locale, terms] of Object.entries(messages)) {
      expect(Object.keys(terms).sort(), locale).toEqual([...ACTION_KEYS].sort());
      for (const key of ACTION_KEYS) {
        expect(terms[key]?.trim(), `${locale}.${key}`).toBeTruthy();
      }
    }
    expect(getMessages('ur-PK').reset).toBe('ری سیٹ');
    expect(getMessages('ur-PK').collapse).toBe('سکیڑیں');
    expect(getMessages('ar').collapse).toBe('طي');
    expect(getMessages('th-TH').confirm).toBe('ยืนยัน');
  });
});
