/** 文件说明：验证个人、浏览器和平台默认语言的优先级与不支持语言回退。 */
import { describe, expect, it } from 'vitest';

import { normalizeLanguage, resolveEffectiveLanguage } from '../language';

describe('有效语言决策', () => {
  it('个人设置高于浏览器和平台', () => {
    expect(resolveEffectiveLanguage('zh-CN', ['en-GB'], 'en-US')).toBe('zh-CN');
  });

  it('个人设置为空时浏览器优先，地区变体匹配唯一语言', () => {
    expect(resolveEffectiveLanguage('', ['en-GB'], 'zh-CN')).toBe('en-US');
    expect(resolveEffectiveLanguage('', ['th'], 'zh-CN')).toBe('th-TH');
    expect(normalizeLanguage('th-TH')).toBe('th-TH');
  });

  it('浏览器不支持时采用平台默认值，配置不可用时回退中文', () => {
    // fr-FR 已纳入支持语言（#1583 语言扩充），改用真正未注册的语言验证回退
    expect(resolveEffectiveLanguage('', ['xx-YY'], 'en-US')).toBe('en-US');
    expect(resolveEffectiveLanguage('', ['xx-YY'], undefined)).toBe('zh-CN');
  });
});
