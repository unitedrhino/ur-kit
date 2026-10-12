import { describe, expect, it } from 'vitest';

import { createOptionsAndMapping, decodeDateMask, formatDate, generateBatchProductIds, generateProductId, generateProductIdWithChecksum, normalizeRedirectPath } from './common';

describe('createOptionsAndMapping', () => {
  it('options 取前两元、mapping 为 value→label、mapping2 为 value→自定义扩展', () => {
    const data = [
      ['v1', '标签一', { color: 'red' }],
      ['v2', '标签二', { color: 'blue' }],
    ] as const;
    const { options, mapping, mapping2 } = createOptionsAndMapping(data);

    expect(options).toEqual([
      { value: 'v1', label: '标签一' },
      { value: 'v2', label: '标签二' },
    ]);
    expect(mapping).toEqual({ v1: '标签一', v2: '标签二' });
    expect(mapping2).toEqual({ v1: { color: 'red' }, v2: { color: 'blue' } });
  });
});

describe('generateProductId 系列', () => {
  it('生成指定长度的产品 ID（5 位日期掩码 + length 位序列号）', () => {
    const id = generateProductId();
    expect(id).toMatch(/^[A-Z0-9]+$/);
    // 默认 8 位序列号 + 5 位日期掩码 = 13
    expect(id).toHaveLength(13);
    expect(generateProductId(10)).toHaveLength(15);
  });

  it('批量生成数量与去重', () => {
    const ids = generateBatchProductIds(20, 8);
    expect(ids).toHaveLength(20);
    // 随机序列号在批量内应互不相同
    expect(new Set(ids).size).toBe(20);
  });

  it('带校验码的产品 ID：校验码为 ASCII 和模 26 对应的大写字母', () => {
    const withChecksum = generateProductIdWithChecksum(8);
    expect(withChecksum).toHaveLength(14);
    const base = withChecksum.slice(0, 13);
    const checksum = withChecksum.slice(13);
    const sum = base.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    expect(checksum).toBe(String.fromCharCode(65 + (sum % 26)));
  });
});

describe('normalizeRedirectPath', () => {
  it('非法输入回退到默认路径', () => {
    expect(normalizeRedirectPath(undefined)).toBe('/');
    expect(normalizeRedirectPath(null)).toBe('/');
    expect(normalizeRedirectPath('')).toBe('/');
    expect(normalizeRedirectPath('   ')).toBe('/');
    expect(normalizeRedirectPath('undefined')).toBe('/');
    expect(normalizeRedirectPath('null')).toBe('/');
    expect(normalizeRedirectPath('https://evil.example.com')).toBe('/');
    expect(normalizeRedirectPath('relative/path')).toBe('/');
  });

  it('合法站内路径保留，支持多重 URL 编码解码', () => {
    expect(normalizeRedirectPath('/device-map')).toBe('/device-map');
    expect(normalizeRedirectPath('  /device-map  ')).toBe('/device-map');
    expect(normalizeRedirectPath(encodeURIComponent('/device-map'))).toBe('/device-map');
    expect(normalizeRedirectPath(encodeURIComponent(encodeURIComponent('/a/b')))).toBe('/a/b');
  });

  it('登录页与空值回退，fallback 可自定义', () => {
    expect(normalizeRedirectPath('/auth/login')).toBe('/');
    expect(normalizeRedirectPath(encodeURIComponent('/auth/login'))).toBe('/');
    expect(normalizeRedirectPath(undefined, '/demo-org/index')).toBe('/demo-org/index');
  });
});

describe('decodeDateMask', () => {
  it('按年两位/月一位/日两位映射解码为 YYYY-MM-DD', () => {
    // 2023-11-29 → 年 23→'CD'，月 11→'C'（monthMap 无 B），日 29→'29'
    expect(decodeDateMask('CDC29')).toBe('2023-11-29');
    // 2024-01-15 → 年 24→'CE'，月 1→'1'，日 15→'15'
    expect(decodeDateMask('CE115')).toBe('2024-01-15');
    // 仅 4 位时日个位按 0 处理
    expect(decodeDateMask('CDC2')).toBe('2023-11-20');
  });

  it('掩码不足 4 位返回无效提示', () => {
    expect(decodeDateMask('CDC')).toBe('无效日期掩码');
    expect(decodeDateMask('')).toBe('无效日期掩码');
  });
});

describe('formatDate', () => {
  it('空值返回占位符', () => {
    expect(formatDate(0)).toBe('--');
    expect(formatDate('')).toBe('--');
  });

  it('自动识别秒级与毫秒级时间戳', () => {
    const ms = new Date(2026, 8, 24, 12, 0, 0).getTime();
    const s = Math.floor(ms / 1000);
    expect(formatDate(ms)).toBe('2026-09-24 12:00:00');
    expect(formatDate(s)).toBe('2026-09-24 12:00:00');
    expect(formatDate(String(ms))).toBe('2026-09-24 12:00:00');
  });

  it('非法日期字符串返回无效提示', () => {
    expect(formatDate('not-a-date')).toBe('无效日期');
  });
});
