import { describe, expect, it } from 'vitest';

import {
  createMenuIDSet,
  getTenantMenuNodeIDs,
  menuIDSetToArray,
  normalizeMenuID,
} from '../role-menu';

describe('role-menu utils', () => {
  it('normalizeMenuID 将数字与字符串统一为字符串', () => {
    expect(normalizeMenuID(50001)).toBe('50001');
    expect(normalizeMenuID('50001')).toBe('50001');
    expect(normalizeMenuID('')).toBeUndefined();
    expect(normalizeMenuID(null)).toBeUndefined();
  });

  it('createMenuIDSet 合并 number/string 重复项', () => {
    const set = createMenuIDSet([50001, '50001', 50002, '50002', '50001']);
    expect([...set]).toEqual(['50001', '50002']);
  });

  it('getTenantMenuNodeIDs 递归收集并规范化子节点', () => {
    const ids = getTenantMenuNodeIDs({
      menuID: 50001,
      children: [{ menuID: '50002' }, { menuID: 50003 }],
    });
    expect(ids).toEqual(['50001', '50002', '50003']);
  });

  it('menuIDSetToArray 输出去重后的字符串数组', () => {
    expect(menuIDSetToArray(new Set([50001, '50001', '50002']))).toEqual([
      '50001',
      '50002',
    ]);
  });
});
