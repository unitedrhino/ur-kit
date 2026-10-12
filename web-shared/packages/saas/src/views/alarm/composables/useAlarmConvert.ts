/**
 * 文件说明：告警 V2 前端类型与后端 API 类型双向映射
 * 前端类型位于 ../types/alarm-v2.types，后端类型来自 @vben/api（ThingsApi）。
 */
import type { ThingsApi } from '@vben/api';

import type {
  AlarmAiConfig,
  AlarmRule,
  CallbackConfig,
  Cmp,
  Compare,
  ConditionTemplate,
  Criterion,
  If,
  LeafCondition,
  Notify,
  NotifyLadder,
  NotifyTargets,
  Trigger,
} from '../types/alarm-v2.types';

// ==================== Target ====================

/**
 * 把前端告警目标转换为后端目标（去掉前端展示字段）
 */
export function toBackendTarget(target: AlarmRule['target']): ThingsApi.AlarmTarget {
  const result: ThingsApi.AlarmTarget = {
    selectType: target.selectType,
  };
  if (target.productID) result.productID = target.productID;
  if (target.categoryID) result.categoryID = target.categoryID;
  if (target.devices?.length) {
    result.devices = target.devices.map((d) => ({
      productID: d.productID,
      name: d.name,
      alias: d.alias,
    }));
  }
  if (target.areas?.length) result.areas = target.areas;
  if (target.groups?.length) result.groups = target.groups;
  return result;
}

/**
 * 把后端目标转换为前端目标
 */
export function fromBackendTarget(target?: ThingsApi.AlarmTarget): AlarmRule['target'] {
  return {
    selectType: (target?.selectType as AlarmRule['target']['selectType']) || 'all',
    targetKind: target?.categoryID ? 'category' : 'product',
    productID: target?.productID,
    categoryID: target?.categoryID,
    devices:
      target?.devices?.map((d: ThingsApi.AlarmTargetDevice) => ({
        productID: d.productID ?? '',
        name: d.name ?? '',
        alias: d.alias,
      })) ?? [],
    areas: target?.areas ?? [],
    groups: target?.groups ?? [],
  };
}

// ==================== Compare / Leaf ====================

function toBackendCompare(compare: Compare): ThingsApi.AlarmCompare {
  const result: ThingsApi.AlarmCompare = {
    cmpType: compare.termType,
    values: compare.values,
  };
  return result;
}

function fromBackendCompare(compare?: ThingsApi.AlarmCompare): Compare {
  return {
    termType: (compare?.cmpType as Compare['termType']) || 'gt',
    values: compare?.values ?? [],
  };
}

function toBackendLeaf(leaf: LeafCondition): ThingsApi.AlarmLeafCondition {
  const result: ThingsApi.AlarmLeafCondition = {
    id: stableBackendID(leaf.id),
    dataID: leaf.dataID,
    sourceType: leaf.sourceType,
    compare: toBackendCompare(leaf.compare),
    period: leaf.period ?? 60,
    aggregateMethod: leaf.aggregateMethod ?? 'last',
    continuePeriod: leaf.continuePeriod ?? 1,
  };
  if ((leaf.sourceType === 'event' || leaf.sourceType === 'action') && leaf.compare.terms?.length) {
    result.filters = leaf.compare.terms.map((term) => ({
      column: term.column,
      cmpType: term.termType,
      values: term.values,
    }));
  }
  return result;
}

/** 把滚动聚合内部叶子转换为无独立判断参数的原始属性选择器。 */
function toBackendRollingSelector(criterion: Criterion): ThingsApi.AlarmCriterion {
  const leaf = criterion.plain?.leaves[0];
  return {
    type: 'plain',
    plain: {
      leaves: leaf
        ? [
            {
              dataID: leaf.dataID,
              id: stableBackendID(leaf.id),
              sourceType: 'property',
            } as ThingsApi.AlarmLeafCondition,
          ]
        : [],
    },
  };
}

/** 存量规则 leaf.sourceType 兼容：数字枚举(1/2/3)归一化为字符串数据源类型 */
function normalizeLeafSourceType(value: unknown): LeafCondition['sourceType'] {
  if (value === 1 || value === '1') return 'property';
  if (value === 2 || value === '2') return 'event';
  if (value === 3 || value === '3') return 'action';
  return (value as LeafCondition['sourceType']) || 'property';
}

function fromBackendLeaf(leaf?: ThingsApi.AlarmLeafCondition): LeafCondition {
  const compare = fromBackendCompare(leaf?.compare);
  if (leaf?.filters?.length) {
    compare.terms = leaf.filters.map((filter) => ({
      column: filter.column ?? '',
      termType: (filter.cmpType as Cmp['termType']) || 'eq',
      values: filter.values ?? [],
    }));
  }
  return {
    id: leaf?.id || `leaf-${Math.random().toString(36).slice(2)}`,
    // 兼容存量规则：后端 sourceType 可能是数字枚举（1=属性 2=事件 3=行为），统一归一化为字符串
    sourceType: normalizeLeafSourceType(leaf?.sourceType),
    dataID: leaf?.dataID,
    dataName: leaf?.dataID,
    compare,
    period: leaf?.period ?? 60,
    aggregateMethod: (leaf?.aggregateMethod as LeafCondition['aggregateMethod']) || 'last',
    continuePeriod: leaf?.continuePeriod ?? 1,
  };
}

// ==================== Criterion ====================

/** stableBackendID 把前端字符串节点标识稳定映射为 proto int64 可接收的十进制字符串。 */
function stableBackendID(id?: string): string | undefined {
  if (!id) return undefined;
  if (/^[1-9]\d*$/.test(id)) return id;
  let hash = 2_166_136_261;
  for (let index = 0; index < id.length; index++) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return String(hash >>> 0 || 1);
}

/** normalizeTemplateID 将历史零值和空值模板引用归一为空。 */
function normalizeTemplateID(id?: number | string): string | undefined {
  if (id === undefined || id === null) return undefined;
  const normalized = String(id).trim();
  return normalized && normalized !== '0' ? normalized : undefined;
}

function toBackendCriterion(criterion: Criterion): ThingsApi.AlarmCriterion {
  const result: ThingsApi.AlarmCriterion = {
    id: stableBackendID(criterion.id),
    type: criterion.type,
  };
  if (criterion.order !== undefined) result.order = criterion.order;

  if (criterion.plain?.leaves?.length) {
    result.plain = {
      leaves: criterion.plain.leaves.map(toBackendLeaf),
    };
  } else if (criterion.duration) {
    result.duration = {
      durationSeconds: criterion.duration.windowSeconds,
      child: toBackendCriterion(criterion.duration.child),
    };
  } else if (criterion.kOfN) {
    result.kOfN = {
      k: criterion.kOfN.threshold,
      n: criterion.kOfN.children.length,
      children: criterion.kOfN.children.map(toBackendCriterion),
    };
  } else if (criterion.rollingAggregate) {
    result.rollingAggregate = {
      aggregate: criterion.rollingAggregate.aggregate,
      cmp: criterion.rollingAggregate.cmp,
      threshold: criterion.rollingAggregate.threshold,
      windowSeconds: criterion.rollingAggregate.windowSeconds,
      child: toBackendRollingSelector(criterion.rollingAggregate.child),
    };
  } else if (criterion.frequency) {
    result.frequency = {
      times: criterion.frequency.times,
      windowSeconds: criterion.frequency.windowSeconds,
      child: toBackendCriterion(criterion.frequency.child),
    };
  }
  return result;
}

function fromBackendCriterion(criterion?: ThingsApi.AlarmCriterion): Criterion {
  const base: Criterion = {
    id: criterion?.id || `crit-${Math.random().toString(36).slice(2)}`,
    type: (criterion?.type as Criterion['type']) || 'plain',
    order: criterion?.order,
  };

  if (criterion?.plain?.leaves) {
    base.plain = {
      logic: 'and',
      leaves: criterion.plain.leaves.map(fromBackendLeaf),
    };
  } else if (criterion?.duration) {
    base.duration = {
      windowSeconds: criterion.duration.durationSeconds ?? 300,
      child: fromBackendCriterion(criterion.duration.child),
    };
  } else if (criterion?.kOfN) {
    base.kOfN = {
      threshold: criterion.kOfN.k ?? 1,
      children: criterion.kOfN.children?.map(fromBackendCriterion) ?? [],
    };
  } else if (criterion?.rollingAggregate) {
    const rolling = criterion.rollingAggregate;
    base.rollingAggregate = {
      windowSeconds: rolling.windowSeconds ?? 300,
      aggregate: (rolling.aggregate as NonNullable<Criterion['rollingAggregate']>['aggregate']) || 'avg',
      threshold: rolling.threshold ?? 0,
      cmp: (rolling.cmp as NonNullable<Criterion['rollingAggregate']>['cmp']) || 'gt',
      child: fromBackendCriterion(rolling.child),
    };
  } else if (criterion?.frequency) {
    base.frequency = {
      windowSeconds: criterion.frequency.windowSeconds ?? 300,
      times: criterion.frequency.times ?? 3,
      child: fromBackendCriterion(criterion.frequency.child),
    };
  }
  return base;
}

// ==================== Trigger / If ====================

function toBackendTrigger(trigger: Trigger): ThingsApi.AlarmTrigger {
  const templateID = normalizeTemplateID(trigger.templateID);
  const result: ThingsApi.AlarmTrigger = {
    id: stableBackendID(trigger.id),
    type: trigger.type,
    level: trigger.level,
    criteria: trigger.criteria.map(toBackendCriterion),
  };
  if (templateID) result.templateID = templateID;
  if (templateID && trigger.templateName) result.templateName = trigger.templateName;
  return result;
}

function fromBackendTrigger(trigger?: ThingsApi.AlarmTrigger): Trigger {
  const templateID = normalizeTemplateID(trigger?.templateID);
  return {
    id: trigger?.id || `trigger-${Math.random().toString(36).slice(2)}`,
    type: (trigger?.type as Trigger['type']) || 'and',
    level: (trigger?.level as Trigger['level']) || 'major',
    templateID,
    templateName: templateID ? trigger?.templateName : undefined,
    criteria: trigger?.criteria?.map(fromBackendCriterion) ?? [],
  };
}

function toBackendIf(ifObj: If): ThingsApi.AlarmIf {
  return {
    triggers: ifObj.triggers.map(toBackendTrigger),
  };
}

function fromBackendIf(ifObj?: ThingsApi.AlarmIf): If {
  return {
    triggers: ifObj?.triggers?.map(fromBackendTrigger) ?? [],
  };
}

// ==================== Notify Ladders ====================

export function toBackendTargets(targets?: NotifyTargets): ThingsApi.AlarmNotifyTargets | undefined {
  if (!targets) return undefined;
  const result: ThingsApi.AlarmNotifyTargets = {};
  if (targets.userIDs?.length) result.userIDs = targets.userIDs.map(String);
  if (targets.groupIDs?.length) result.groupIDs = targets.groupIDs.map(String);
  if (targets.roleIDs?.length) result.roleIDs = targets.roleIDs.map(String);
  if (targets.phones?.length) result.phones = targets.phones.filter(Boolean);
  if (targets.emails?.length) result.emails = targets.emails.filter(Boolean);
  return Object.keys(result).length ? result : undefined;
}

export function fromBackendTargets(targets?: ThingsApi.AlarmNotifyTargets): NotifyTargets {
  return {
    userIDs: targets?.userIDs?.filter(Boolean),
    groupIDs: targets?.groupIDs?.filter(Boolean),
    roleIDs: targets?.roleIDs?.filter(Boolean),
    phones: targets?.phones?.filter(Boolean),
    emails: targets?.emails?.filter(Boolean),
  };
}

function toBackendCallback(callback: CallbackConfig): ThingsApi.AlarmCallbackConfig {
  return {
    name: callback.url,
    url: callback.url,
    method: callback.method,
    headers: callback.headers,
    bodyTemplate: callback.bodyTemplate,
    authType: callback.authType,
    authToken: callback.authToken,
    timeoutSeconds: callback.timeoutSeconds,
    retryTimes: callback.retryTimes,
  };
}

function fromBackendCallback(callback?: ThingsApi.AlarmCallbackConfig): CallbackConfig {
  return {
    id: `cb-${Math.random().toString(36).slice(2)}`,
    url: callback?.url ?? '',
    method: (callback?.method as CallbackConfig['method']) || 'POST',
    headers: callback?.headers,
    bodyTemplate: callback?.bodyTemplate,
    authType: (callback?.authType as CallbackConfig['authType']) || 'none',
    authToken: callback?.authToken,
    timeoutSeconds: callback?.timeoutSeconds || 30,
    retryTimes: callback?.retryTimes ?? 0,
  };
}

function toBackendLadder(ladder: NotifyLadder): ThingsApi.AlarmNotifyLadder {
  const channelTemplates: Record<string, number> = {};
  Object.entries(ladder.channelTemplates || {}).forEach(([channel, id]) => {
    const num = Number(id);
    if (id && !Number.isNaN(num)) channelTemplates[channel] = num;
  });

  return {
    order: ladder.order,
    timing: ladder.timing,
    levels: ladder.levels,
    channels: ladder.channels,
    channelTemplates: Object.keys(channelTemplates).length ? channelTemplates : undefined,
    delaySeconds: ladder.delaySeconds,
    repeatIntervalSeconds: ladder.repeatIntervalSeconds,
    repeatMaxCount: ladder.repeatMaxCount,
    targets: toBackendTargets(ladder.targets),
    callbacks: ladder.callbacks?.map(toBackendCallback),
  };
}

function fromBackendLadder(ladder?: ThingsApi.AlarmNotifyLadder): NotifyLadder {
  const channelTemplates: Record<string, string> = {};
  Object.entries(ladder?.channelTemplates || {}).forEach(([channel, id]) => {
    channelTemplates[channel] = String(id);
  });
  /** 领域层以渠道模板映射为真实通知渠道，兼容详情接口未回填 channels 的情况。 */
  const channels = ladder?.channels?.length ? ladder.channels : Object.keys(channelTemplates);

  return {
    id: `ladder-${Math.random().toString(36).slice(2)}`,
    order: ladder?.order ?? 1,
    timing: (ladder?.timing as NotifyLadder['timing']) || 'trigger',
    levels: (ladder?.levels as NotifyLadder['levels']) || [],
    channels,
    channelTemplates,
    delaySeconds: ladder?.delaySeconds ?? 0,
    repeatIntervalSeconds: ladder?.repeatIntervalSeconds ?? 0,
    repeatMaxCount: ladder?.repeatMaxCount ?? 0,
    targets: fromBackendTargets(ladder?.targets),
    callbacks: ladder?.callbacks?.map(fromBackendCallback),
  };
}

function toBackendNotify(notify: Notify): ThingsApi.AlarmNotifyLadder[] {
  return notify.ladders.map((ladder, index) => toBackendLadder({ ...ladder, order: index + 1 }));
}

function fromBackendLadders(ladders?: ThingsApi.AlarmNotifyLadder[]): Notify {
  return {
    ladders:
      ladders
        ?.map(fromBackendLadder)
        .sort((left, right) => left.order - right.order)
        .map((ladder, index) => ({ ...ladder, order: index + 1 })) ?? [],
  };
}

// ==================== AI 判断配置 ====================

function toBackendAiConfig(aiConfig?: AlarmAiConfig): ThingsApi.AlarmAiConfig | undefined {
  // 未启用时显式下发 enable:false：后端更新接口仅在 AiConfig 非 nil 时覆盖旧值，
  // 若省略该字段会导致已保存的 AI 配置残留，「不使用 AI 判断」无法生效。
  if (!aiConfig?.enable) return { enable: false };
  return {
    enable: true,
    toolID: aiConfig.toolID,
    prompt: aiConfig.prompt,
    timeout: aiConfig.timeout,
  };
}

function fromBackendAiConfig(aiConfig?: ThingsApi.AlarmAiConfig): AlarmAiConfig | undefined {
  if (!aiConfig?.enable) return undefined;
  return {
    enable: true,
    toolID: aiConfig.toolID,
    prompt: aiConfig.prompt,
    timeout: aiConfig.timeout,
  };
}

// ==================== AlarmRule <-> AlarmInfo ====================

/**
 * 前端规则对象转后端创建请求
 */
export function toAlarmInfoCreateReq(rule: AlarmRule): ThingsApi.AlarmInfoCreateReq {
  return {
    name: rule.name,
    desc: rule.desc,
    evalPeriod: rule.evalPeriod,
    target: toBackendTarget(rule.target),
    if: toBackendIf(rule.if),
    ladders: toBackendNotify(rule.notify),
    aiConfig: toBackendAiConfig(rule.aiConfig),
  };
}

/**
 * 前端规则对象转后端更新请求
 */
export function toAlarmInfoUpdateReq(rule: AlarmRule): ThingsApi.AlarmInfoUpdateReq {
  return {
    id: rule.id!,
    name: rule.name,
    desc: rule.desc,
    evalPeriod: rule.evalPeriod,
    target: toBackendTarget(rule.target),
    if: toBackendIf(rule.if),
    ladders: toBackendNotify(rule.notify),
    aiConfig: toBackendAiConfig(rule.aiConfig),
  };
}

/**
 * 后端规则详情转前端规则对象
 */
export function fromAlarmInfo(info?: ThingsApi.AlarmInfo): AlarmRule {
  return {
    id: info?.id,
    projectID: info?.projectID,
    name: info?.name ?? '',
    target: fromBackendTarget(info?.target),
    evalPeriod: info?.evalPeriod ?? 1,
    status: info?.status ?? 1,
    if: fromBackendIf(info?.if),
    notify: fromBackendLadders(info?.ladders),
    aiConfig: fromBackendAiConfig(info?.aiConfig),
    desc: info?.desc,
    createdTime: info?.createdTime,
    updatedTime: info?.updatedTime,
  };
}

// ==================== Condition Template ====================

/**
 * 把后端触发条件模板转换为前端 ConditionTemplate
 * 后端一个模板可包含多个 trigger，前端只展示第一个 trigger
 */
export function fromConditionTemplate(tpl?: ThingsApi.AlarmConditionTemplate): ConditionTemplate {
  const trigger = tpl?.if?.triggers?.[0];
  return {
    id: tpl?.id ?? '',
    name: tpl?.name ?? '',
    summary: tpl?.desc ?? '',
    trigger: trigger ? fromBackendTrigger(trigger) : ({} as Trigger),
  };
}

/**
 * 把前端 ConditionTemplate 转换为后端创建/更新请求
 * 这里只转换第一个 trigger；如需支持多 trigger 可扩展
 */
export function toConditionTemplateCreateReq(
  tpl: ConditionTemplate,
  bindType: 'none' | 'category' | 'product',
  bindValue: string,
): ThingsApi.AlarmConditionTemplateCreateReq {
  return {
    name: tpl.name,
    desc: tpl.summary,
    if: {
      triggers: [toBackendTrigger(tpl.trigger)],
    },
    productCategoryID: bindType === 'category' ? bindValue : undefined,
    productID: bindType === 'product' ? bindValue : undefined,
  };
}

export function toConditionTemplateUpdateReq(
  tpl: ConditionTemplate,
  bindType: 'none' | 'category' | 'product',
  bindValue: string,
): ThingsApi.AlarmConditionTemplateUpdateReq {
  return {
    id: tpl.id,
    name: tpl.name,
    desc: tpl.summary,
    if: {
      triggers: [toBackendTrigger(tpl.trigger)],
    },
    productCategoryID: bindType === 'category' ? bindValue : undefined,
    productID: bindType === 'product' ? bindValue : undefined,
  };
}

// ==================== Notify Template ====================

export interface ContentTemplate {
  id: string;
  name: string;
  channel: string;
  ref: number;
  status: 1 | 2;
  remark?: string;
  triggerTitle?: string;
  triggerBody?: string;
  recoveryTitle?: string;
  recoveryBody?: string;
  /** 后端持久化的扩展请求头，常用于机器人或回调类渠道。 */
  headers?: Record<string, string>;
}

export function fromNotifyTemplate(tpl?: ThingsApi.AlarmNotifyTemplate): ContentTemplate {
  return {
    id: tpl?.id ?? '',
    name: tpl?.name ?? '',
    channel: tpl?.channel ?? '',
    ref: tpl?.refCount ?? 0,
    status: (tpl?.status as 1 | 2) ?? 1,
    remark: tpl?.desc,
    triggerTitle: tpl?.subject,
    triggerBody: tpl?.triggerBody,
    recoveryTitle: tpl?.subject,
    recoveryBody: tpl?.recoveryBody,
    headers: tpl?.headers ?? {},
  };
}

export function toNotifyTemplateCreateReq(tpl: ContentTemplate): ThingsApi.AlarmNotifyTemplateCreateReq {
  return {
    name: tpl.name,
    channel: tpl.channel,
    desc: tpl.remark,
    subject: tpl.triggerTitle,
    triggerBody: tpl.triggerBody,
    recoveryBody: tpl.recoveryBody,
    headers: tpl.headers,
  };
}

export function toNotifyTemplateUpdateReq(tpl: ContentTemplate): ThingsApi.AlarmNotifyTemplateUpdateReq {
  return {
    id: tpl.id,
    name: tpl.name,
    channel: tpl.channel,
    desc: tpl.remark,
    subject: tpl.triggerTitle,
    triggerBody: tpl.triggerBody,
    recoveryBody: tpl.recoveryBody,
    headers: tpl.headers,
    status: tpl.status,
  };
}
