/**
 * 文件说明：验证证据引用原文定位的纯算法——URL 参数编解码、
 * 全文三态判定（精确/仅页/未找到）、归一化匹配与码点偏移换算。
 */
import { describe, expect, it } from 'vitest';

import {
  buildCitationLocateQuery,
  buildCitationQuote,
  findNormalizedMatches,
  locateCitationInText,
  normalizeForMatch,
  normalizedRangeToTextRange,
  parseCitationLocateQuery,
} from '../citation-locate';

describe('定位 URL 参数编解码', () => {
  it('从切片引用生成定位参数，quote 截取前 50 字', () => {
    const query = buildCitationLocateQuery({
      charEnd: 30,
      charStart: 12,
      chunkIndex: 3,
      content: '一'.repeat(80),
      pageIdx: 2,
    });
    expect(query.chunk).toBe(3);
    expect(query.cs).toBe(12);
    expect(query.ce).toBe(30);
    expect(query.pi).toBe(2);
    expect(query.q).toHaveLength(50);
  });

  it('无效偏移不写入参数', () => {
    const query = buildCitationLocateQuery({ charStart: 0, chunkIndex: 1, snippet: '片段' });
    expect(query.cs).toBeUndefined();
    expect(query.ce).toBeUndefined();
    expect(query.q).toBe('片段');
  });

  it('parseCitationLocateQuery 还原请求，无参数返回 null', () => {
    expect(parseCitationLocateQuery({ chunk: '2', pi: '5', q: '设备接入' })).toEqual({
      charEnd: undefined,
      charStart: undefined,
      chunkIndex: 2,
      pageIdx: 5,
      quote: '设备接入',
    });
    expect(parseCitationLocateQuery({ doc: '9' })).toBeNull();
    expect(parseCitationLocateQuery({ chunk: 'abc' })).toBeNull();
  });

  it('buildCitationQuote 空内容返回空串', () => {
    expect(buildCitationQuote()).toBe('');
    expect(buildCitationQuote('  ')).toBe('');
  });
});

describe('全文三态定位', () => {
  const text = '第一段介绍知识库。\n第二段讲设备接入与远程控制。重复句也会出现。设备接入是重点。\n结尾。';

  it('锚点优先：按 artifactID 命中返回精确区间', () => {
    const start = Array.from(text).findIndex((_, index) => Array.from(text).slice(index).join('').startsWith('设备接入是重点'));
    const result = locateCitationInText(
      text,
      { artifactID: 42, chunkIndex: 9, quote: '不可能匹配的内容' },
      [{ artifactID: 42, charEnd: start + 8, charStart: start, chunkIndex: 9 }],
    );
    expect(result.status).toBe('exact');
    expect(result.charStart).toBe(start);
    expect(result.charEnd).toBe(start + 8);
    expect(result.message).toBe('已定位到引用内容');
  });

  it('锚点表无该 artifact 时按 chunkIndex 兜底', () => {
    const result = locateCitationInText(text, { artifactID: 99, chunkIndex: 2 }, [
      { artifactID: 1, charEnd: 0, charStart: 0, chunkIndex: 1 },
      { artifactID: 2, charEnd: 30, charStart: 10, chunkIndex: 2 },
    ]);
    expect(result.status).toBe('exact');
    expect(result.charStart).toBe(10);
  });

  it('引文全文唯一匹配返回精确命中并换算原文区间', () => {
    const result = locateCitationInText(text, { quote: '介绍知识库' });
    expect(result.status).toBe('exact');
    expect(result.charStart).toBe(text.indexOf('介绍知识库'));
    expect(result.charEnd).toBe(text.indexOf('介绍知识库') + 5);
  });

  it('引文多处匹配降级仅页并给出首处位置', () => {
    const result = locateCitationInText(text, { quote: '设备接入', pageIdx: 1 });
    expect(result.status).toBe('page');
    expect(result.pageIndex).toBe(1);
    expect(result.message).toContain('2 处相似内容');
    expect(result.charStart).toBe(text.indexOf('设备接入'));
  });

  it('引文零匹配时回退检索偏移并标记参考位置', () => {
    const result = locateCitationInText(text, { charEnd: 30, charStart: 10, pageIdx: 3, quote: '全文里不存在的句子' });
    expect(result.status).toBe('page');
    expect(result.charStart).toBe(10);
    expect(result.message).toContain('参考位置');
  });

  it('引文零匹配且无偏移判为未找到', () => {
    const result = locateCitationInText(text, { quote: '全文里不存在的句子' });
    expect(result.status).toBe('miss');
    expect(result.message).toContain('文档可能已更新');
  });

  it('无引文无锚点但偏移有效时按检索记录位置定位', () => {
    const result = locateCitationInText(text, { charEnd: 15, charStart: 5 });
    expect(result.status).toBe('exact');
    expect(result.message).toBe('已按检索记录位置定位');
  });

  it('仅有页码时降级页级反馈', () => {
    const result = locateCitationInText(text, { pageIdx: 4 });
    expect(result.status).toBe('page');
    expect(result.message).toContain('第 5 页');
  });

  it('完全无信号判为未找到', () => {
    expect(locateCitationInText(text, {}).status).toBe('miss');
    expect(locateCitationInText('', { quote: '任意' }).status).toBe('miss');
  });
});

describe('归一化匹配与码点换算', () => {
  it('findNormalizedMatches 忽略空白差异并统计全部命中', () => {
    const text = '设备 A 支持远程\n控制。设备 A 支持远程 控制。';
    const matches = findNormalizedMatches(text, '设备 A 支持远程控制');
    expect(matches).toHaveLength(2);
  });

  it('过短引文不参与匹配', () => {
    expect(findNormalizedMatches('设备控制', '  ')).toHaveLength(0);
    expect(findNormalizedMatches('设备控制', '备')).toHaveLength(0);
  });

  it('normalizedRangeToTextRange 把归一化起点换算回原文区间并包含区间内空白', () => {
    const text = '前言：设备 A 支持\n远程控制。';
    const start = normalizeForMatch('前言：').length;
    const range = normalizedRangeToTextRange(text, '设备A支持远程控制', start);
    expect(range).toBeDefined();
    expect(text.slice(range?.charStart ?? 0, range?.charEnd ?? 0)).toBe('设备 A 支持\n远程控制');
  });

  it('换算起点超出范围时返回 undefined', () => {
    expect(normalizedRangeToTextRange('短文', '短文', 5)).toBeUndefined();
  });
});
