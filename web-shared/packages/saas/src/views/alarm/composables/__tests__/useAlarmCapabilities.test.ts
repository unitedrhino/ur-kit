/**
 * 文件说明：验证告警前端能力矩阵与后端历史窗口契约保持一致。
 */
import type { ThingsApi } from '@vben/api';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  aggregateOptionsForField,
  callbackAuthTypesFromCapabilities,
  callbackMethodsFromCapabilities,
  compareOptionsForField,
  compareOptionsForSource,
  configureAlarmCapabilities,
  criterionTypesFromCapabilities,
  defaultCompareForField,
  defaultAggregateForField,
  isAlarmCapabilitiesReady,
  loadAlarmCapabilities,
  notifyChannelsFromCapabilities,
  notifyTimingOptionsFromCapabilities,
  requiresScalarCompare,
  resetAlarmCapabilities,
  sourceTypeOptionsFromCapabilities,
  targetTypeOptionsFromCapabilities,
  usesOnlineStateCompare,
} from '../useAlarmCapabilities';
import { useAlarmNotifyChannel } from '../useAlarmNotifyChannel';

const apiMocks = vi.hoisted(() => ({
  getCapability: vi.fn(),
}));

vi.mock('../../api/alarm-capability.api', () => ({
  getAlarmCapability: apiMocks.getCapability,
}));

const capability: ThingsApi.AlarmCapability = {
  criteria: [
    { allowedChildren: [], type: 'plain' },
    { allowedChildren: ['plain'], type: 'duration' },
    { allowedChildren: ['plain'], type: 'kOfN' },
    { allowedChildren: ['plain'], type: 'rollingAggregate' },
    { allowedChildren: ['plain'], type: 'frequency' },
  ],
  notify: {
    callbackAuthTypes: ['none', 'basic', 'bearer'],
    callbackMethods: ['GET', 'POST'],
    channels: ['sms', 'email', 'message', 'callback'],
    timings: ['trigger', 'recovery', 'both'],
  },
  sources: [
    {
      aggregates: [
        {
          compares: {
            avg: { values: ['eq', 'gt', 'gte', 'lt', 'lte'] },
            last: { values: ['eq', 'not', 'gt'] },
          },
          dataType: 'float',
          values: ['last', 'max', 'min', 'avg', 'sum', 'count'],
        },
        { dataType: 'int', values: ['last', 'max', 'min', 'avg', 'sum', 'count'] },
        {
          compares: { last: { values: ['eq', 'not', 'in'] } },
          dataType: 'string',
          values: ['last', 'count'],
        },
      ],
      compareTypes: ['eq', 'not', 'btw', 'gt', 'gte', 'lt', 'lte', 'in'],
      dataTypes: ['float', 'int', 'string'],
      sourceType: 'property',
      supportsFilters: false,
    },
    {
      aggregates: [{ dataType: 'struct', values: ['occurred', 'count'] }],
      compareTypes: ['eq', 'not'],
      dataTypes: ['struct'],
      sourceType: 'event',
      supportsFilters: true,
    },
    {
      aggregates: [{ dataType: 'struct', values: ['occurred', 'count'] }],
      compareTypes: ['eq', 'not'],
      dataTypes: ['struct'],
      sourceType: 'action',
      supportsFilters: true,
    },
    {
      aggregates: [{
        dataType: 'bool',
        values: [
          'last',
          'onlineDuration',
          'offlineDuration',
          'onlineRate',
          'onlineCount',
          'offlineCount',
          'switchCount',
        ],
      }],
      compareTypes: ['eq', 'not', 'gt', 'gte', 'lt', 'lte'],
      dataTypes: ['bool'],
      sourceType: 'online',
      supportsFilters: false,
    },
  ],
  targets: ['all', 'fixed', 'area', 'areaWithChildren', 'group'],
  version: 'test-v1',
};

describe('alarmCapabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAlarmCapabilities();
    configureAlarmCapabilities(capability);
  });

  it('只使用接口加载的能力矩阵并标记为就绪', async () => {
    resetAlarmCapabilities();
    apiMocks.getCapability.mockResolvedValue(capability);

    expect(isAlarmCapabilitiesReady()).toBe(false);
    await loadAlarmCapabilities();

    expect(apiMocks.getCapability).toHaveBeenCalledOnce();
    expect(isAlarmCapabilitiesReady()).toBe(true);
    expect(aggregateOptionsForField('event').map((item) => item.value)).toEqual(['occurred', 'count']);
  });

  it('接口失败时不使用本地静态兜底', async () => {
    resetAlarmCapabilities();
    apiMocks.getCapability.mockRejectedValue(new Error('network'));

    await expect(loadAlarmCapabilities()).rejects.toThrow('network');

    expect(isAlarmCapabilitiesReady()).toBe(false);
    expect(aggregateOptionsForField('property', 'float')).toEqual([]);
  });

  it('独立通知模板入口会先加载能力契约再提供通知渠道', async () => {
    resetAlarmCapabilities();
    apiMocks.getCapability.mockResolvedValue(capability);
    const { channels, loadChannels } = useAlarmNotifyChannel();

    await loadChannels();

    expect(apiMocks.getCapability).toHaveBeenCalledOnce();
    expect(channels.value.map((item) => item.code)).toEqual([
      'sms',
      'email',
      'message',
    ]);
  });

  it('事件和行为只允许发生与次数统计', () => {
    expect(aggregateOptionsForField('event').map((item) => item.value)).toEqual(['occurred', 'count']);
    expect(aggregateOptionsForField('action').map((item) => item.value)).toEqual(['occurred', 'count']);
  });

  it('在线状态使用历史状态派生指标', () => {
    expect(aggregateOptionsForField('online').map((item) => item.value)).toEqual([
      'last',
      'onlineDuration',
      'offlineDuration',
      'onlineRate',
      'onlineCount',
      'offlineCount',
      'switchCount',
    ]);
  });

  it('数值属性支持数值聚合，非数值属性只支持最后值和次数', () => {
    expect(aggregateOptionsForField('property', 'float').map((item) => item.value)).toEqual([
      'last',
      'max',
      'min',
      'avg',
      'sum',
      'count',
    ]);
    expect(aggregateOptionsForField('property', 'string').map((item) => item.value)).toEqual(['last', 'count']);
  });

  it('比较符按字段类型和聚合结果精确过滤', () => {
    expect(compareOptionsForField('property', 'string', 'last').map(
      (item) => item.value,
    )).toEqual(['eq', 'not', 'in']);
    expect(compareOptionsForField('property', 'float', 'avg').map(
      (item) => item.value,
    )).toEqual(['gt', 'gte', 'lt', 'lte', 'eq']);
    expect(defaultCompareForField('property', 'string', 'last')).toBe('eq');
  });

  it('各数据源默认聚合符合后端契约', () => {
    expect(defaultAggregateForField('event')).toBe('occurred');
    expect(defaultAggregateForField('action')).toBe('occurred');
    expect(defaultAggregateForField('online')).toBe('last');
    expect(defaultAggregateForField('property', 'float')).toBe('last');
  });

  it('事件是否发生不需要阈值，次数统计需要数值阈值', () => {
    expect(requiresScalarCompare('event', 'occurred')).toBe(false);
    expect(requiresScalarCompare('action', 'occurred')).toBe(false);
    expect(requiresScalarCompare('event', 'count')).toBe(true);
    expect(requiresScalarCompare('action', 'count')).toBe(true);
  });

  it('在线最新状态使用枚举，历史派生指标使用数值阈值', () => {
    expect(usesOnlineStateCompare('online', 'last')).toBe(true);
    expect(usesOnlineStateCompare('online', 'onlineDuration')).toBe(false);
    expect(requiresScalarCompare('online', 'last')).toBe(false);
    expect(requiresScalarCompare('online', 'onlineDuration')).toBe(true);
  });

  it('目标、判据、比较符和通知控件都由接口矩阵过滤', () => {
    expect(sourceTypeOptionsFromCapabilities().map((item) => item.value)).toEqual([
      'property',
      'event',
      'action',
      'online',
    ]);
    expect(compareOptionsForSource('event').map((item) => item.value)).toEqual([
      'eq',
      'not',
    ]);
    expect(criterionTypesFromCapabilities()).toEqual([
      'plain',
      'duration',
      'kOfN',
      'rollingAggregate',
      'frequency',
    ]);
    expect(targetTypeOptionsFromCapabilities().map((item) => item.value)).toEqual([
      'all',
      'fixed',
      'area',
      'areaWithChildren',
      'group',
    ]);
    expect(notifyChannelsFromCapabilities().map((item) => item.code)).toEqual([
      'sms',
      'email',
      'message',
    ]);
    expect(notifyTimingOptionsFromCapabilities().map((item) => item.value)).toEqual([
      'trigger',
      'recovery',
      'both',
    ]);
    expect(callbackMethodsFromCapabilities()).toEqual(['GET', 'POST']);
    expect(callbackAuthTypesFromCapabilities()).toEqual([
      'none',
      'basic',
      'bearer',
    ]);
  });
});
