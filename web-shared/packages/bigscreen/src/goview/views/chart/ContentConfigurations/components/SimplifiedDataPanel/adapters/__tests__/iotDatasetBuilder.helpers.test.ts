import { describe, expect, it } from 'vitest';

import {
  aggregateBucketValue,
  createEmptyLogStats,
  formatLogTime,
  hasMeaningfulValue,
  mergeLogPoint,
  normalizeAreaTreeNodeLabel,
  normalizeDeviceNames,
  normalizeRankingGroupBy,
  normalizeStringArray,
  normalizeTimestampLike,
  parseLogTimestamp,
  resolveIoTProductFilter,
  sortTimeRowsAsc,
  timeRangeToMs,
} from '../iotDatasetBuilder';

describe('normalizeDeviceNames / normalizeStringArray', () => {
  it('设备名数组过滤空值与非字符串，字符串包装为数组', () => {
    expect(normalizeDeviceNames(['a', '', 1, null, 'b'])).toEqual(['a', 'b']);
    expect(normalizeDeviceNames('single')).toEqual(['single']);
    expect(normalizeDeviceNames(undefined)).toEqual([]);
    expect(normalizeStringArray([1, '', 'x'])).toEqual(['1', 'x']);
    expect(normalizeStringArray('not-array')).toEqual([]);
  });
});

describe('hasMeaningfulValue', () => {
  it('区分有意义值与空值占位', () => {
    expect(hasMeaningfulValue(0)).toBe(true);
    expect(hasMeaningfulValue(false)).toBe(true);
    expect(hasMeaningfulValue('')).toBe(false);
    expect(hasMeaningfulValue('undefined')).toBe(false);
    expect(hasMeaningfulValue('null')).toBe(false);
    expect(hasMeaningfulValue(null)).toBe(false);
    expect(hasMeaningfulValue(undefined)).toBe(false);
  });
});

describe('normalizeTimestampLike / parseLogTimestamp', () => {
  it('时间戳归一：正有限数通过，其余为 null', () => {
    expect(normalizeTimestampLike(1700000000000)).toBe(1700000000000);
    expect(normalizeTimestampLike(0)).toBeNull();
    expect(normalizeTimestampLike(-1)).toBeNull();
    expect(normalizeTimestampLike('abc')).toBeNull();
  });

  it('parseLogTimestamp 支持数字/纯数字字符串/日期串/非法值', () => {
    expect(parseLogTimestamp(1700000000000)).toBe(1700000000000);
    expect(parseLogTimestamp('1700000000000')).toBe(1700000000000);
    expect(parseLogTimestamp('2024-03-10T00:00:00Z')).toBe(Date.parse('2024-03-10T00:00:00Z'));
    expect(parseLogTimestamp('bad')).toBeNull();
    expect(parseLogTimestamp(NaN)).toBeNull();
  });
});

describe('timeRangeToMs / normalizeRankingGroupBy', () => {
  it('时间范围映射，未知范围兜底 1 小时', () => {
    expect(timeRangeToMs('1h')).toBe(3_600_000);
    expect(timeRangeToMs('24h')).toBe(86_400_000);
    expect(timeRangeToMs('30d')).toBe(2_592_000_000);
    expect(timeRangeToMs('bad')).toBe(3_600_000);
    expect(timeRangeToMs(undefined)).toBe(3_600_000);
  });

  it('排名分组仅接受 area/device，默认 device', () => {
    expect(normalizeRankingGroupBy('area')).toBe('area');
    expect(normalizeRankingGroupBy('device')).toBe('device');
    expect(normalizeRankingGroupBy('other')).toBe('device');
    expect(normalizeRankingGroupBy()).toBe('device');
  });
});

describe('normalizeAreaTreeNodeLabel / resolveIoTProductFilter', () => {
  it('区域树节点标签按优先级取值', () => {
    expect(normalizeAreaTreeNodeLabel({ areaName: 'A' })).toBe('A');
    expect(normalizeAreaTreeNodeLabel({ name: 'B', areaID: 'x' })).toBe('B');
    expect(normalizeAreaTreeNodeLabel({ areaID: 'x' })).toBe('x');
    expect(normalizeAreaTreeNodeLabel({})).toBe('');
  });

  it('产品过滤条件按类别码/产品 ID 分级生成', () => {
    expect(resolveIoTProductFilter({ productCategoryCode: 'dianbiao' } as any)).toEqual({
      productCategoryCode: 'dianbiao',
    });
    expect(
      resolveIoTProductFilter({ productCategoryCode: 'dianbiao', productCategoryID: 3 } as any),
    ).toEqual({ productCategoryCode: 'dianbiao', productCategoryID: 3 });
    expect(resolveIoTProductFilter({ productID: 'pid-1' } as any)).toEqual({ productID: 'pid-1' });
    expect(resolveIoTProductFilter({} as any)).toEqual({});
  });
});

describe('formatLogTime / sortTimeRowsAsc', () => {
  it('格式化为 ISO 截断到秒；非法值截断原文', () => {
    expect(formatLogTime(0)).toBe('1970-01-01T00:00:00');
    expect(formatLogTime('1700000000000')).toBe(new Date(1700000000000).toISOString().slice(0, 19));
    expect(formatLogTime('not-a-time')).toBe('not-a-time');
    expect(formatLogTime(undefined)).toBe('');
  });

  it('时间行升序原地排序，不可解析时间按 0 处理', () => {
    const rows = [{ time: '1700000000000' }, { time: '1000' }, { time: 'bad' }];
    sortTimeRowsAsc(rows);
    expect(rows.map((row) => row.time)).toEqual(['bad', '1000', '1700000000000']);
  });
});

describe('aggregateBucketValue / mergeLogPoint / createEmptyLogStats', () => {
  it('空桶：count 返回 0，其余聚合返回 null', () => {
    const empty = createEmptyLogStats();
    expect(aggregateBucketValue('count', empty)).toBe(0);
    expect(aggregateBucketValue('sum', empty)).toBeNull();
    expect(aggregateBucketValue('avg', empty)).toBeNull();
  });

  it('合并样本后支持 sum/avg/max/min/last 取值', () => {
    const stats = createEmptyLogStats();
    mergeLogPoint(stats, '10', 1000);
    mergeLogPoint(stats, 20, 2000);
    mergeLogPoint(stats, null, 3000); // 空值不计入
    expect(stats.count).toBe(2);
    expect(stats.sum).toBe(30);
    expect(aggregateBucketValue('avg', stats)).toBe(15);
    expect(aggregateBucketValue('max', stats)).toBe(20);
    expect(aggregateBucketValue('min', stats)).toBe(10);
    // 后时间戳覆盖 lastValue；早时间戳不回退
    mergeLogPoint(stats, 5, 1500);
    expect(aggregateBucketValue('last', stats)).toBe(20);
  });
});
