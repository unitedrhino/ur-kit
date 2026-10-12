/**
 * 文件说明：告警 v2 前端类型定义
 * 与后端领域模型 backend/things/service/dmsvr/internal/domain/alarm 对齐，
 * 供告警规则编辑、触发条件模板、通知内容模板等页面使用。
 */
import { $t } from '@vben/locales';

// ==================== 告警级别 ====================

export type AlarmLevel = 'remind' | 'minor' | 'major' | 'critical';

export interface AlarmLevelOption {
  value: AlarmLevel;
  label: string;
  color: string;
  levelValue: number;
}

export const AlarmLevelList: AlarmLevelOption[] = [
  { value: 'remind', label: '提醒', color: '#1677ff', levelValue: 1 },
  { value: 'minor', label: '次要', color: '#faad14', levelValue: 2 },
  { value: 'major', label: '重要', color: '#fa8c16', levelValue: 3 },
  { value: 'critical', label: '紧急', color: '#f5222d', levelValue: 4 },
];

/**
 * 应用级等级文案覆盖表。共享告警页面被多个应用挂载（结构监测/能耗管理等），
 * 各应用行业口径不同（结构监测用地灾四色：蓝色/黄色/橙色/红色预警），
 * 由应用入口调用 setAlarmLevelLabels 覆盖展示文案；未覆盖的应用保持默认。
 */
const alarmLevelLabelOverride: Partial<Record<AlarmLevel, string>> = {};

/** setAlarmLevelLabels 按应用覆盖等级展示文案（幂等，仅改 label 不改 value/颜色/levelValue）。 */
export function setAlarmLevelLabels(labels: Partial<Record<AlarmLevel, string>>): void {
  for (const item of AlarmLevelList) {
    const label = labels[item.value];
    if (label) {
      item.label = label;
      alarmLevelLabelOverride[item.value] = label;
    }
  }
}

/** getAlarmLevelLabelOverride 读取某等级的覆盖文案（未覆盖返回 undefined）。 */
export function getAlarmLevelLabelOverride(level: AlarmLevel): string | undefined {
  return alarmLevelLabelOverride[level];
}

export const AlarmLevelMap: Record<AlarmLevel, AlarmLevelOption> = AlarmLevelList.reduce(
  (acc, item) => {
    acc[item.value] = item;
    return acc;
  },
  {} as Record<AlarmLevel, AlarmLevelOption>,
);

export function levelLabel(level?: AlarmLevel): string {
  return level ? AlarmLevelMap[level]?.label ?? '-' : '-';
}

// ==================== 告警目标 ====================

/** 目标选择方式 */
export type SelectType = 'all' | 'fixed' | 'area' | 'areaWithChildren' | 'group';

export interface SelectTypeOption {
  value: SelectType;
  label: string;
}

/** label 保存 i18n 键（iotApp.alarmRule.scope*），渲染处以 $t 输出当前语言文案。 */
export const SelectTypeList: SelectTypeOption[] = [
  { value: 'all', label: 'iotApp.alarmRule.scopeAll' },
  { value: 'fixed', label: 'iotApp.alarmRule.scopeDevice' },
  { value: 'area', label: 'iotApp.alarmRule.scopeArea' },
  { value: 'areaWithChildren', label: 'iotApp.alarmRule.scopeAreaWithChildren' },
  { value: 'group', label: 'iotApp.alarmRule.scopeGroup' },
];

/** selectTypeText 渲染目标选择方式的当前语言文案。 */
export function selectTypeText(value: string): string {
  const label = SelectTypeList.find((item) => item.value === value)?.label ?? value;
  return label.startsWith('iotApp.') ? $t(label) : label;
}

/** 物模型来源类型：产品或产品品类 */
export type TargetKind = 'product' | 'category';

export interface TargetKindOption {
  value: TargetKind;
  label: string;
}

export const TargetKindList: TargetKindOption[] = [
  { value: 'product', label: '按产品' },
  { value: 'category', label: '按品类' },
];

/** 指定设备项 */
export interface AlarmTargetDevice {
  productID: string;
  name: string;
  alias?: string;
}

/** 告警目标 */
export interface AlarmTarget {
  /** 目标选择方式 */
  selectType: SelectType;
  /** 物模型来源：产品或产品品类 */
  targetKind: TargetKind;
  /** 产品 ID，targetKind=product 时必填 */
  productID?: string;
  /** 产品名称（只读，展示用） */
  productName?: string;
  /** 产品品类 ID，targetKind=category 时必填 */
  categoryID?: string;
  /** 品类名称（只读，展示用） */
  categoryName?: string;
  /** 指定设备列表，selectType=fixed 时使用 */
  devices?: AlarmTargetDevice[];
  /** 区域 ID 列表，selectType=area / areaWithChildren 时使用 */
  areas?: number[];
  /** 分组 ID 列表，selectType=group 时使用 */
  groups?: number[];
}

// ==================== 触发条件 ====================

/** 叶子条件数据源类型 */
export type ConditionSourceType = 'property' | 'event' | 'action' | 'online';

export interface ConditionSourceTypeOption {
  value: ConditionSourceType;
  label: string;
}

export const ConditionSourceTypeList: ConditionSourceTypeOption[] = [
  { value: 'property', label: '属性' },
  { value: 'event', label: '事件' },
  { value: 'action', label: '行为调用' },
  { value: 'online', label: '在线状态' },
];

/** 比较运算符 */
export type CmpType = 'eq' | 'not' | 'btw' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'all';

export interface CmpTypeOption {
  value: CmpType;
  label: string;
}

export const CmpTypeList: CmpTypeOption[] = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
  { value: 'not', label: '!=' },
  { value: 'btw', label: '介于' },
  { value: 'in', label: '在列表中' },
];

/** 聚合方法：按数据源能力矩阵选择，不是所有数据源都支持全部值。 */
export type AggregateType =
  | 'last'
  | 'max'
  | 'min'
  | 'avg'
  | 'sum'
  | 'count'
  | 'occurred'
  | 'onlineDuration'
  | 'offlineDuration'
  | 'onlineRate'
  | 'onlineCount'
  | 'offlineCount'
  | 'switchCount';

export interface AggregateTypeOption {
  value: AggregateType;
  label: string;
}

export const AggregateTypeList: AggregateTypeOption[] = [
  { value: 'last', label: '最新值' },
  { value: 'max', label: '最大值' },
  { value: 'min', label: '最小值' },
  { value: 'avg', label: '平均值' },
  { value: 'sum', label: '求和' },
  { value: 'count', label: '计数' },
  { value: 'occurred', label: '是否发生' },
  { value: 'onlineDuration', label: '在线时长' },
  { value: 'offlineDuration', label: '离线时长' },
  { value: 'onlineRate', label: '在线率' },
  { value: 'onlineCount', label: '上线次数' },
  { value: 'offlineCount', label: '下线次数' },
  { value: 'switchCount', label: '状态切换次数' },
];

/** 结构体/数组子比较条件 */
export interface Cmp {
  column: string;
  termType: CmpType;
  values: string[];
}

/** 比较条件 */
export interface Compare {
  termType: CmpType;
  values: string[];
  terms?: Cmp[];
}

/** 叶子条件 */
export interface LeafCondition {
  /** 前端渲染用唯一标识 */
  id: string;
  /** 同级排序 */
  order?: number;
  /** 物模型标识符 */
  dataID?: string;
  /** 物模型名称（只读） */
  dataName?: string;
  /** 数据源类型 */
  sourceType: ConditionSourceType;
  /** 比较条件 */
  compare: Compare;
  /** 统计周期（秒），默认 60 */
  period?: number;
  /** 聚合方式：last / max / min / avg / sum / count，默认 last */
  aggregateMethod?: AggregateType;
  /** 持续周期数，默认 1 */
  continuePeriod?: number;
}

/** 判据类型 */
export type CriterionType = 'plain' | 'duration' | 'kOfN' | 'rollingAggregate' | 'frequency';

/** 普通条件判据 */
export interface PlainCriterion {
  /** 叶子条件组合逻辑，默认 AND */
  logic?: 'and' | 'or';
  leaves: LeafCondition[];
}

/** 持续时长判据 */
export interface DurationCriterion {
  windowSeconds: number;
  child: Criterion;
}

/** k-of-n 判据 */
export interface KOfNCriterion {
  threshold: number;
  children: Criterion[];
}

/** 滚动聚合判据 */
export interface RollingAggregateCriterion {
  windowSeconds: number;
  aggregate: 'max' | 'min' | 'avg';
  threshold: number;
  cmp: CmpType;
  child: Criterion;
}

/** 持续次数判据 */
export interface FrequencyCriterion {
  windowSeconds: number;
  times: number;
  child: Criterion;
}

/** 判据统一结构 */
export interface Criterion {
  id: string;
  type: CriterionType;
  order?: number;
  plain?: PlainCriterion;
  duration?: DurationCriterion;
  kOfN?: KOfNCriterion;
  rollingAggregate?: RollingAggregateCriterion;
  frequency?: FrequencyCriterion;
}

/** 触发条件 */
export interface Trigger {
  id: string;
  /** 判据组合类型 */
  type: 'and' | 'or';
  /** 本触发条件命中时对应的告警级别 */
  level: AlarmLevel;
  /** 判据列表 */
  criteria: Criterion[];
  /** 关联的触发条件模板 ID；存在时表示本触发条件来自模板快照，默认只读 */
  templateID?: string;
  /** 模板名称（只读展示用） */
  templateName?: string;
}

/** 触发条件集合 */
export interface If {
  triggers: Trigger[];
}

// ==================== 通知配置 ====================

/** 通知时机 */
export type NotifyTiming = 'trigger' | 'recovery' | 'both';

export interface NotifyTimingOption {
  value: NotifyTiming;
  label: string;
}

export const NotifyTimingList: NotifyTimingOption[] = [
  { value: 'trigger', label: '告警触发' },
  { value: 'recovery', label: '恢复时' },
  { value: 'both', label: '触发和恢复' },
];

/** 通知目标 */
export interface NotifyTargets {
  /** 用户 ID 列表；接口回显为字符串，兼容旧表单中的数字值。 */
  userIDs?: Array<number | string>;
  /** 用户组 ID 列表；接口回显为字符串，兼容旧表单中的数字值。 */
  groupIDs?: Array<number | string>;
  /** 角色编码列表；接口回显为字符串，兼容旧表单中的数字值。 */
  roleIDs?: Array<number | string>;
  /** 直接填写的手机号列表；仅短信渠道生效，站内信不支持。 */
  phones?: string[];
  /** 直接填写的邮箱列表；仅邮件渠道生效，站内信不支持。 */
  emails?: string[];
}

/** 回调配置 */
export interface CallbackConfig {
  id?: string;
  url: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
  bodyTemplate?: string;
  authType: 'none' | 'basic' | 'bearer';
  authToken?: string;
  timeoutSeconds: number;
  retryTimes: number;
  notifyDays?: number[];
  notifyTimeRange?: { start: string; end: string };
}

/** 通知渠道 */
export interface NotifyChannel {
  code: string;
  name: string;
  icon?: string;
}

/** 后端通知调度器当前能够实际发送的消息渠道；接口回调使用 callbacks 独立配置。 */
export const NotifyChannelList: NotifyChannel[] = [
  { code: 'sms', name: '短信' },
  { code: 'email', name: '邮件' },
  { code: 'message', name: '站内信' },
];

/** 通知目标候选 */
export interface NotifyTargetCandidate {
  id: string;
  name: string;
  type: 'user' | 'group' | 'role';
  typeLabel: string;
}

/** 通知内容模板候选（一个模板只对应一个渠道，默认同时包含触发和恢复内容） */
export interface NotifyContentTemplate {
  id: string;
  name: string;
  /** 所属通知渠道 */
  channel: string;
}

/** 通知阶梯 */
export interface NotifyLadder {
  id: string;
  order: number;
  timing: NotifyTiming;
  levels: AlarmLevel[];
  /** 选中的通知渠道编码列表 */
  channels: string[];
  /** 渠道到通知内容模板 ID 的映射 */
  channelTemplates: Record<string, string>;
  delaySeconds: number;
  /** 未处理重复提醒间隔秒数：未恢复时按该间隔重复提醒，0=不重复 */
  repeatIntervalSeconds: number;
  /** 重复提醒最大次数，0=不限 */
  repeatMaxCount: number;
  targets: NotifyTargets;
  callbacks?: CallbackConfig[];
}

/** 通知配置 */
export interface Notify {
  ladders: NotifyLadder[];
}

// ==================== AI 判断配置 ====================

/** 告警 AI 判断配置（通知前由绑定的 AI 工具判断是否通知） */
export interface AlarmAiConfig {
  /** 是否启用 AI 判断 */
  enable?: boolean;
  /** 绑定的 AI 工具 ID（数字分身页 ai/digital-clone/1?tab=tools） */
  toolID?: string;
  /** 用户提示词，拼装进工具入参，指导判断口径 */
  prompt?: string;
  /** 等待工具出参超时秒数，默认 10，上限 30 */
  timeout?: number;
}

// ==================== 告警规则 ====================

/** 告警规则 */
export interface AlarmRule {
  id?: string;
  tenantCode?: string;
  projectID?: string;
  name: string;
  target: AlarmTarget;
  /** 评估周期（分钟） */
  evalPeriod: number;
  /** 连续满足次数，默认 1 */
  consecutiveCount?: number;
  /** 抑制期（秒），0 表示不抑制 */
  suppressSeconds?: number;
  /** 启用状态：1 启用，2 禁用 */
  status: number;
  /** 触发条件 */
  if: If;
  /** 通知配置 */
  notify: Notify;
  /** AI 判断配置，为空表示不启用 */
  aiConfig?: AlarmAiConfig;
  /** 描述 */
  desc?: string;
  createdTime?: string;
  updatedTime?: string;
}

// ==================== 触发条件模板（接口与页面用） ====================

/** 触发条件模板概览：一个模板本质上就是一个条件组（Trigger），只定义条件，不定义告警级别 */
export interface ConditionTemplate {
  id: string;
  name: string;
  /** 模板简介 */
  summary: string;
  /** 模板对应的条件组 */
  trigger: Trigger;
}

// ==================== 对象树与 Schema（接口与页面用） ====================

/** 对象树节点 */
export interface AlarmObjectNode {
  id: string;
  name: string;
  level: string;
  levelName: string;
  nextLevel?: string;
  nextLevelName?: string;
  meta?: {
    required?: boolean;
    multiSelect?: boolean;
    selectAll?: boolean;
    levelName?: string;
    nextLevel?: string;
  };
  children?: AlarmObjectNode[];
}

/** 物模型 Schema 字段 */
export interface SchemaField {
  id: string;
  name: string;
  dataID: string;
  sourceType: ConditionSourceType;
  unit?: string;
  valueType?:
    | 'array'
    | 'bool'
    | 'enum'
    | 'float'
    | 'int'
    | 'matrix'
    | 'string'
    | 'struct'
    | 'timestamp';
  children?: SchemaField[];
  /** 数组属性点位选择元数据（点位上限与结构体成员）；仅 valueType=array 时存在。 */
  arrayMeta?: {
    max: number;
    struct: boolean;
    elementValueType?: string;
    elementUnit?: string;
    specs: Array<{ identifier: string; name: string; valueType?: string; unit?: string }>;
  };
}

/** 物模型 Schema 响应 */
export interface AlarmObjectSchema {
  metricFields: SchemaField[];
  eventFields: SchemaField[];
  actionFields: SchemaField[];
  /** 内置在线状态字段 */
  onlineFields: SchemaField[];
}
