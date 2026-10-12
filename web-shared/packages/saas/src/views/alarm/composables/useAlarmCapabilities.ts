/**
 * 文件说明：消费后端告警能力矩阵，统一驱动前端编辑器、校验和默认值。
 * 接口未成功加载时不提供本地静态能力兜底，规则编辑页必须保持阻断状态。
 */
import type { ThingsApi } from '@vben/api';

import type {
  AggregateType,
  AggregateTypeOption,
  CmpTypeOption,
  ConditionSourceType,
  ConditionSourceTypeOption,
  CriterionType,
  NotifyChannel,
  NotifyTimingOption,
  SchemaField,
  SelectTypeOption,
} from '../types/alarm-v2.types';

import { getAlarmCapability } from '../api/alarm-capability.api';
import {
  AggregateTypeList,
  CmpTypeList,
  ConditionSourceTypeList,
  NotifyChannelList,
  NotifyTimingList,
  SelectTypeList,
} from '../types/alarm-v2.types';

// capability 保存最近一次由后端返回且通过基本结构校验的能力矩阵。
let capability: ThingsApi.AlarmCapability | null = null;
// capabilityPromise 合并同一页面生命周期内的并发加载请求。
let capabilityPromise: Promise<ThingsApi.AlarmCapability> | null = null;

/** configureAlarmCapabilities 安装已加载的后端能力矩阵。 */
export function configureAlarmCapabilities(value: ThingsApi.AlarmCapability) {
  if (!value?.version || !value.sources?.length) {
    throw new Error('告警能力矩阵缺少版本或数据源');
  }
  capability = value;
}

/** resetAlarmCapabilities 清理当前能力状态，供退出编辑器和自动化测试隔离使用。 */
export function resetAlarmCapabilities() {
  capability = null;
  capabilityPromise = null;
}

/** loadAlarmCapabilities 从后端加载能力矩阵，并合并并发请求。 */
export async function loadAlarmCapabilities(force = false) {
  if (capability && !force) return capability;
  if (capabilityPromise && !force) return capabilityPromise;
  capabilityPromise = getAlarmCapability()
    .then((value) => {
      configureAlarmCapabilities(value);
      return value;
    })
    .finally(() => {
      capabilityPromise = null;
    });
  return capabilityPromise;
}

/** isAlarmCapabilitiesReady 判断规则编辑器能否安全展示配置控件。 */
export function isAlarmCapabilitiesReady(): boolean {
  return capability !== null;
}

/** sourceCapability 返回指定数据源的后端能力。 */
function sourceCapability(sourceType: ConditionSourceType) {
  return capability?.sources.find((item) => item.sourceType === sourceType);
}

/** sourceTypeOptionsFromCapabilities 返回后端允许且当前物模型提供字段的数据源选项。 */
export function sourceTypeOptionsFromCapabilities(): ConditionSourceTypeOption[] {
  const values = new Set(capability?.sources.map((item) => item.sourceType) ?? []);
  return ConditionSourceTypeList.filter((item) => values.has(item.value));
}

/** compareOptionsForSource 返回指定数据源后端允许的比较符。 */
export function compareOptionsForSource(
  sourceType: ConditionSourceType,
): CmpTypeOption[] {
  const values = new Set(sourceCapability(sourceType)?.compareTypes ?? []);
  return CmpTypeList.filter((item) => values.has(item.value));
}

/** compareOptionsForField 返回字段类型和当前聚合结果允许使用的精确比较符。 */
export function compareOptionsForField(
  sourceType: ConditionSourceType,
  valueType?: SchemaField['valueType'],
  aggregate?: AggregateType,
): CmpTypeOption[] {
  const source = sourceCapability(sourceType);
  const aggregateCapability = source?.aggregates?.find(
    (item) => !valueType || item.dataType === valueType,
  );
  const values = aggregate
    ? aggregateCapability?.compares?.[aggregate]?.values
    : undefined;
  if (!values) return compareOptionsForSource(sourceType);
  const allowed = new Set(values);
  return CmpTypeList.filter((item) => allowed.has(item.value));
}

/** defaultCompareForField 返回切换字段或聚合时可立即提交的合法比较符。 */
export function defaultCompareForField(
  sourceType: ConditionSourceType,
  valueType?: SchemaField['valueType'],
  aggregate?: AggregateType,
): CmpTypeOption['value'] {
  const options = compareOptionsForField(sourceType, valueType, aggregate);
  return options.find((item) => item.value === 'eq')?.value
    ?? options[0]?.value
    ?? 'eq';
}

/** criterionTypesFromCapabilities 返回后端允许创建的判据类型。 */
export function criterionTypesFromCapabilities(): CriterionType[] {
  return (capability?.criteria.map((item) => item.type) ?? []) as CriterionType[];
}

/** allowedCriterionChildren 返回指定父判据允许直接嵌套的子判据类型。 */
export function allowedCriterionChildren(type: CriterionType): CriterionType[] {
  return (capability?.criteria.find((item) => item.type === type)
    ?.allowedChildren ?? []) as CriterionType[];
}

/** targetTypeOptionsFromCapabilities 返回后端允许的设备范围选项。 */
export function targetTypeOptionsFromCapabilities(): SelectTypeOption[] {
  const values = new Set(capability?.targets ?? []);
  return SelectTypeList.filter((item) => values.has(item.value));
}

/** notifyTimingOptionsFromCapabilities 返回后端允许的通知时机。 */
export function notifyTimingOptionsFromCapabilities(): NotifyTimingOption[] {
  const values = new Set(capability?.notify.timings ?? []);
  return NotifyTimingList.filter((item) => values.has(item.value));
}

/** notifyChannelsFromCapabilities 返回后端允许的模板消息渠道，不包含独立 callback 配置。 */
export function notifyChannelsFromCapabilities(): NotifyChannel[] {
  const values = new Set(capability?.notify.channels ?? []);
  return NotifyChannelList.filter((item) => values.has(item.code));
}

/** callbackMethodsFromCapabilities 返回后端允许的 callback 方法。 */
export function callbackMethodsFromCapabilities(): string[] {
  return [...(capability?.notify.callbackMethods ?? [])];
}

/** callbackAuthTypesFromCapabilities 返回后端允许的 callback 鉴权类型。 */
export function callbackAuthTypesFromCapabilities(): string[] {
  return [...(capability?.notify.callbackAuthTypes ?? [])];
}

/** aggregateValuesForField 返回数据源和字段类型对应的后端聚合枚举。 */
function aggregateValuesForField(
  sourceType: ConditionSourceType,
  valueType?: SchemaField['valueType'],
): AggregateType[] {
  const source = sourceCapability(sourceType);
  if (!source?.aggregates?.length) return [];
  if (valueType) {
    return (source.aggregates.find((item) => item.dataType === valueType)?.values ??
      []) as AggregateType[];
  }
  if (sourceType !== 'property') {
    return (source.aggregates[0]?.values ?? []) as AggregateType[];
  }
  const [first, ...rest] = source.aggregates.map((item) => item.values);
  return (first ?? []).filter((value) =>
    rest.every((values) => values.includes(value)),
  ) as AggregateType[];
}

/** aggregateOptionsForField 返回指定数据源和字段类型允许展示的聚合选项。 */
export function aggregateOptionsForField(
  sourceType: ConditionSourceType,
  valueType?: SchemaField['valueType'],
): AggregateTypeOption[] {
  return aggregateValuesForField(sourceType, valueType)
    .map((value) => AggregateTypeList.find((item) => item.value === value))
    .filter((item): item is AggregateTypeOption => Boolean(item));
}

/** defaultAggregateForField 返回新建或切换数据源时的合法默认聚合。 */
export function defaultAggregateForField(
  sourceType: ConditionSourceType,
  valueType?: SchemaField['valueType'],
): AggregateType {
  return aggregateOptionsForField(sourceType, valueType)[0]?.value ?? 'last';
}

/** usesOnlineStateCompare 判断叶子是否需要在线/离线枚举比较。 */
export function usesOnlineStateCompare(
  sourceType: ConditionSourceType,
  aggregate?: AggregateType,
): boolean {
  return sourceType === 'online' && (aggregate ?? 'last') === 'last';
}

/** requiresScalarCompare 判断窗口结果是否需要与用户输入的标量阈值比较。 */
export function requiresScalarCompare(
  sourceType: ConditionSourceType,
  aggregate?: AggregateType,
): boolean {
  const normalized = aggregate ?? defaultAggregateForField(sourceType);
  if (
    (sourceType === 'event' || sourceType === 'action') &&
    normalized === 'occurred'
  ) {
    return false;
  }
  return !usesOnlineStateCompare(sourceType, normalized);
}

/** isNumericPropertyField 判断字段能否作为滚动数值聚合的原始选择器。 */
export function isNumericPropertyField(field?: SchemaField): boolean {
  return field?.sourceType === 'property'
    && (field.valueType === 'int' || field.valueType === 'float');
}
