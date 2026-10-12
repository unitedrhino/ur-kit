import { describe, expect, it } from 'vitest';

import { buildPageTitle } from './page-title';

describe('buildPageTitle', () => {
  it('页面标题与应用名都存在时以" - "拼接', () => {
    expect(buildPageTitle('登录', '逸凡科技')).toBe('登录 - 逸凡科技');
  });

  it('应用名为空时只保留页面标题，不出现孤立分隔符', () => {
    expect(buildPageTitle('登录', '')).toBe('登录');
  });

  it('页面标题为空时只保留应用名', () => {
    expect(buildPageTitle('', '逸凡科技')).toBe('逸凡科技');
  });

  it('两段都为空时返回空字符串', () => {
    expect(buildPageTitle('', '')).toBe('');
  });

  it('纯空白段视同为空，不产生多余空格或分隔符', () => {
    expect(buildPageTitle('  登录  ', '  ')).toBe('登录');
  });
});
