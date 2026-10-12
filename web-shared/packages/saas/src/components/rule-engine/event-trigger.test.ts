/** 文件说明：物模型主题选择、AI 歧义处理与旧任务条件保留测试。 */
import { describe, expect, it } from 'vitest';

import type { EventTopic, ModelOption, ProjectDeviceOption } from './event-trigger';

import { emptyEventTrigger, parseEventSuggestion, readEventTrigger, serializeEventTrigger } from './event-trigger';

/** topics 模拟后端公开的三类物模型主题与旧批量属性主题。 */
const topics: EventTopic[] = [
  { code: 'device.report.thing.event', description: '事件', filterFields: [{ path: '$.identifier', label: '事件标识符' }] },
  { code: 'device.report.thing.action', description: '行为', filterFields: [{ path: '$.actionID', label: '行为标识符' }] },
  { code: 'device.report.thing.property', description: '属性', filterFields: [{ path: '$.identifier', label: '属性标识符' }] },
  { code: 'device.report.thing.property.v2', description: '批量属性', filterFields: [{ path: '$.device.productID', label: '产品 ID' }] },
];
const catalog: ModelOption[] = [
  { topic: topics[0]!.code, productID: 'p1', productName: '温度设备', identifier: 'fault', name: '故障事件' },
  { topic: topics[0]!.code, productID: 'p2', productName: '湿度设备', identifier: 'fault', name: '故障事件' },
  { topic: topics[1]!.code, productID: 'p1', productName: '温度设备', identifier: 'restart', name: '重启' },
  { topic: topics[2]!.code, productID: 'p1', productName: '温度设备', identifier: 'temperature', name: '温度' },
];
const devices: ProjectDeviceOption[] = [
  { productID: 'p1', deviceName: 'd1', deviceAlias: '设备 A' },
  { productID: 'p2', deviceName: 'd2', deviceAlias: '设备 B' },
];

describe('项目规则任务物模型主题配置', () => {
  it.each([
    [topics[0]!.code, 'identifier', 'fault'],
    [topics[1]!.code, 'actionID', 'restart'],
    [topics[2]!.code, 'identifier', 'temperature'],
  ])('保存与回读精确主题 %s', (topic, key, identifier) => {
    const config = { ...emptyEventTrigger(), triggerType: 'subscribe_message' as const, subscribeTopic: topic, topicMatch: { productID: 'p1', [key]: identifier } };
    const saved = serializeEventTrigger(config, topics, '9007199254740993');
    if (saved.triggerType !== 'subscribe_message') throw new Error('事件配置未序列化');
    expect(saved.scopeProjectID).toBe('9007199254740993');
    expect(JSON.parse(saved.subscribePayloadFilter)).toEqual({ logic: 'and', rules: [], topicMatch: config.topicMatch });
    expect(readEventTrigger(saved).topicMatch).toEqual(config.topicMatch);
  });

  it.each([
    [topics[0]!.code, 'identifier', 'fault'],
    [topics[1]!.code, 'actionID', 'restart'],
    [topics[2]!.code, 'identifier', 'temperature'],
  ])('不选产品时按物模型标识订阅 %s', (topic, key, identifier) => {
    const config = { ...emptyEventTrigger(), triggerType: 'subscribe_message' as const, subscribeTopic: topic, topicMatch: { [key]: identifier } };
    const saved = serializeEventTrigger(config, topics, '301');
    if (saved.triggerType !== 'subscribe_message') throw new Error('事件配置未序列化');
    expect(JSON.parse(saved.subscribePayloadFilter).topicMatch).toEqual({ [key]: identifier });
    expect(readEventTrigger(saved).topicMatch).toEqual({ [key]: identifier });
  });

  it('不选产品时不能单独限定设备', () => {
    const config = { ...emptyEventTrigger(), triggerType: 'subscribe_message' as const, subscribeTopic: topics[0]!.code, topicMatch: { deviceName: 'd1', identifier: 'fault' } };
    expect(() => serializeEventTrigger(config, topics, '301')).toThrow();
  });

  it('AI 对同名事件给出候选，由用户选择产品', () => {
    const result = parseEventSuggestion('{"topic":"device.report.thing.event","modelID":"fault"}', topics, catalog, devices);
    expect(result.config).toBeUndefined();
    expect(result.candidates).toHaveLength(2);
  });

  it('AI 可用当前项目设备确定产品与事件', () => {
    const result = parseEventSuggestion('{"topic":"device.report.thing.event","modelID":"fault","deviceName":"设备 A"}', topics, catalog, devices);
    expect(result.config?.topicMatch).toEqual({ productID: 'p1', deviceName: 'd1', identifier: 'fault' });
  });

  it.each([
    '{"topic":"unknown","modelID":"fault"}',
    '{"topic":"device.report.thing.property","modelID":"humidity"}',
    '{"topic":"device.report.thing.event","modelID":"fault","deviceName":"other"}',
    '{"topic":"device.report.thing.action","rules":[{"path":"$.params.code"}]}',
  ])('拒绝无效 AI 建议：%s', (content) => {
    expect(() => parseEventSuggestion(content, topics, catalog, devices)).toThrow();
  });

  it('旧详细条件在普通编辑时原样保存', () => {
    const raw = '{"logic":"and","rules":[{"path":"$.identifier","op":"eq","value":"fault"},{"path":"$.params.temperature","op":"gt","value":30}]}';
    const config = readEventTrigger({ triggerType: 'subscribe_message', subscribeTopic: topics[0]!.code, subscribePayloadFilter: raw });
    expect(config.legacyFilter).toBe(raw);
    const saved = serializeEventTrigger(config, topics, '301');
    if (saved.triggerType !== 'subscribe_message') throw new Error('旧配置未序列化');
    expect(saved.subscribePayloadFilter).toBe(raw);
  });

  it('旧全主题任务的空过滤串在编辑后仍保持为空', () => {
    const config = readEventTrigger({ triggerType: 'subscribe_message', subscribeTopic: 'device.report.thing.property.v2', subscribePayloadFilter: '' });
    expect(config.legacyFilter).toBe('');
    const saved = serializeEventTrigger(config, topics, '301');
    if (saved.triggerType !== 'subscribe_message') throw new Error('旧配置未序列化');
    expect(saved.subscribePayloadFilter).toBe('');
  });

  it('定时任务和损坏旧条件的处理保持原语义', () => {
    expect(serializeEventTrigger(emptyEventTrigger(), topics, '301')).toEqual({ triggerType: 'schedule' });
    expect(() => readEventTrigger({ triggerType: 'subscribe_message', subscribeTopic: topics[0]!.code, subscribePayloadFilter: '{"logic":"bad","rules":[]}' })).toThrow();
  });
});

describe('非项目规则范围', () => {
  it('企业规则保留物模型选择且不提交项目范围', () => {
    const config = { ...emptyEventTrigger(), triggerType: 'subscribe_message' as const, subscribeTopic: topics[0]!.code, topicMatch: { productID: 'p1', identifier: 'fault' } };
    const saved = serializeEventTrigger(config, topics);
    expect(saved).not.toHaveProperty('scopeProjectID');
    if (saved.triggerType !== 'subscribe_message') throw new Error('消息配置未序列化');
    expect(JSON.parse(saved.subscribePayloadFilter).topicMatch).toEqual(config.topicMatch);
  });

  it('平台公共规则允许按消息类型订阅，并拒绝项目表单的空物模型选择', () => {
    const config = { ...emptyEventTrigger(), triggerType: 'subscribe_message' as const, subscribeTopic: topics[0]!.code };
    expect(() => serializeEventTrigger(config, topics)).toThrow();
    const saved = serializeEventTrigger(config, topics, '', true);
    expect(saved).not.toHaveProperty('scopeProjectID');
    if (saved.triggerType !== 'subscribe_message') throw new Error('公共消息配置未序列化');
    expect(JSON.parse(saved.subscribePayloadFilter)).toEqual({ logic: 'and', rules: [] });
    expect(readEventTrigger(saved, true).legacyFilter).toBeUndefined();
  });
});
