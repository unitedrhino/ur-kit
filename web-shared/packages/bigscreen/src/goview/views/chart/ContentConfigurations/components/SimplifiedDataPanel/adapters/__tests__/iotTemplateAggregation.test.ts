import { describe, expect, it } from 'vitest';

import {
  combineAreaValuesForSingleStat,
  resolveSingleStatBucketConfig,
  shouldAggregateAcrossAreasBySum,
} from '../iotTemplateAggregation';

describe('iotTemplateAggregation', () => {
  it('电量类字段跨区域按求和合并', () => {
    const result = combineAreaValuesForSingleStat('TotalEnergyChange', [100, 200, 300]);
    expect(result).toBe(600);
  });

  it('电压类字段跨区域默认按平均值合并', () => {
    const result = combineAreaValuesForSingleStat('Ua', [235.1, 235.1, 235.1]);
    expect(result).toBeCloseTo(235.1, 6);
  });

  it('当 schema unit 为 V 时即使字段未知也不按求和处理', () => {
    const shouldSum = shouldAggregateAcrossAreasBySum('customField', {
      aggFunc: 'last',
      aggFuncs: [],
      areaIDs: [],
      dataIDs: ['customField'],
      dataIDNames: { customField: '自定义字段' },
      dataUnits: { 自定义字段: 'V' },
      dataView: 'prop',
      deviceNames: [],
      logInterval: '10m',
      logTimeRange: '1h',
      mode: 'log',
    } as any);
    expect(shouldSum).toBe(false);
  });

  it('短时间范围单值卡默认按小时分桶', () => {
    const start = 0;
    const end = 24 * 60 * 60 * 1000;
    expect(resolveSingleStatBucketConfig(start, end)).toEqual({
      format: 'time',
      interval: 1,
      intervalUnit: 'h',
    });
  });

  it('中等时间范围单值卡默认按天分桶', () => {
    const start = 0;
    const end = 30 * 24 * 60 * 60 * 1000;
    expect(resolveSingleStatBucketConfig(start, end)).toEqual({
      format: 'date',
      interval: 1,
      intervalUnit: 'd',
    });
  });

  it('更长时间范围单值卡默认按月分桶', () => {
    const start = 0;
    const end = 180 * 24 * 60 * 60 * 1000;
    expect(resolveSingleStatBucketConfig(start, end)).toEqual({
      format: 'month',
      interval: 1,
      intervalUnit: 'n',
    });
  });
});
