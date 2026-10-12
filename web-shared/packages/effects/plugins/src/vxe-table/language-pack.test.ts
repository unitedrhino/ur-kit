/**
 * 文件说明：vxe 语言包互操作回归金丝雀。
 *
 * 背景（2026-09-12 生产回归）：语言包深路径导入曾在 rolldown（vite 8）CJS 互操作
 * 语义下多包一层 default，setI18n 后 getI18n 取不到值，分页等组件直接显示
 * `vxe.pager.total` 原始 key。此类错误无法被首屏静态资源检查发现，
 * 测试层是唯一可自动化的哨点。
 *
 * 断言口径：与 init.ts 完全相同的导入路径，语言包顶层必须是 `{ vxe: {...} }`
 * 形态（无 default 键），且关键 key（分页）可解析到非空文案。
 */
import { describe, expect, it } from 'vitest';

import enUS from 'vxe-pc-ui/es/language/en-US';
import zhCN from 'vxe-pc-ui/es/language/zh-CN';

type LanguagePack = {
  default?: unknown;
  vxe?: Record<string, Record<string, unknown>>;
};

describe('vxe 语言包互操作', () => {
  it.each([
    ['zh-CN', zhCN as unknown as LanguagePack],
    ['en-US', enUS as unknown as LanguagePack],
  ])('%s 语言包顶层为 { vxe } 形态且无 default 包裹', (_name, pack) => {
    // 多包一层时顶层会出现 default 键且没有 vxe 键
    expect(pack.default).toBeUndefined();
    expect(pack.vxe).toBeTypeOf('object');
  });

  it('分页文案可解析（vxe.pager.total 等不再回显原始 key）', () => {
    expect((zhCN as unknown as LanguagePack).vxe?.pager?.total).toContain('条');
    expect((enUS as unknown as LanguagePack).vxe?.pager?.total).toBeTruthy();
    expect((zhCN as unknown as LanguagePack).vxe?.pager?.pagesize).toBeTruthy();
  });
});
