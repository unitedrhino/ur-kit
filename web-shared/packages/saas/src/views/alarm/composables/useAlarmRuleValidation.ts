/**
 * 文件说明：告警规则表单校验与可读摘要
 * 集中维护新增/编辑规则各步骤的阻断性校验，避免页面组件各自使用零散弹窗。
 */
import type { AlarmRule, Criterion, LeafCondition, NotifyLadder, Trigger } from '../types/alarm-v2.types';

import {
  AggregateTypeList,
  AlarmLevelList,
  CmpTypeList,
  ConditionSourceTypeList,
  NotifyChannelList,
  SelectTypeList,
  TargetKindList,
} from '../types/alarm-v2.types';
import { aggregateOptionsForField, defaultAggregateForField } from './useAlarmCapabilities';

/** 告警规则表单问题，step 对应创建向导步骤。 */
export interface AlarmRuleIssue {
  step: 1 | 2 | 3;
  field: string;
  message: string;
  /** 条件编辑器中的稳定节点标识，用于把汇总错误定位到具体控件。 */
  nodeId?: string;
  /** 节点内发生错误的具体控件，用于展示字段级错误状态。 */
  control?:
    | 'aggregate'
    | 'callbackAuthToken'
    | 'callbackMethod'
    | 'callbackRetryTimes'
    | 'callbackTimeoutSeconds'
    | 'callbackUrl'
    | 'channels'
    | 'channelTemplate'
    | 'compareValue'
    | 'continuePeriod'
    | 'dataID'
    | 'delaySeconds'
    | 'duplicate'
    | 'filter'
    | 'level'
    | 'levels'
    | 'logic'
    | 'period'
    | 'targets'
    | 'threshold'
    | 'times'
    | 'timing'
    | 'windowSeconds';
}

/** 返回告警级别的用户可读名称。 */
function alarmLevelLabel(level: string): string {
  return AlarmLevelList.find((item) => item.value === level)?.label ?? level;
}

/** 把通知时机展开为后端判重使用的实际触发阶段。 */
function notifyTimingScopes(timing: NotifyLadder['timing']): Array<'recovery' | 'trigger'> {
  if (timing === 'both') return ['trigger', 'recovery'];
  return [timing];
}

/** 判断文本值是否已经由用户填写。 */
function hasValue(value: unknown): boolean {
  return String(value ?? '').trim().length > 0;
}

/** 生成不包含前端节点标识的叶子条件语义键，用于识别完全相同的判断。 */
function leafSemanticKey(leaf: LeafCondition): string {
  const values = leaf.compare.termType === 'in' ? [...leaf.compare.values].sort() : leaf.compare.values;
  return JSON.stringify({
    sourceType: leaf.sourceType,
    dataID: leaf.dataID ?? '',
    compare: { termType: leaf.compare.termType, values, terms: leaf.compare.terms ?? [] },
    period: leaf.period ?? 60,
    aggregateMethod: leaf.aggregateMethod ?? 'last',
    continuePeriod: leaf.continuePeriod ?? 1,
  });
}

/** 递归生成判据语义键；普通条件内叶子顺序不影响 AND/OR 的判断含义。 */
function criterionSemanticKey(criterion: Criterion): string {
  if (criterion.type === 'plain' && criterion.plain) {
    return JSON.stringify({
      type: criterion.type,
      logic: criterion.plain.logic ?? 'and',
      leaves: criterion.plain.leaves.map((leaf) => leafSemanticKey(leaf)).sort(),
    });
  }
  if (criterion.type === 'duration' && criterion.duration) {
    return JSON.stringify({ type: criterion.type, windowSeconds: criterion.duration.windowSeconds, child: criterionSemanticKey(criterion.duration.child) });
  }
  if (criterion.type === 'kOfN' && criterion.kOfN) {
    return JSON.stringify({
      type: criterion.type,
      threshold: criterion.kOfN.threshold,
      children: criterion.kOfN.children.map((child) => criterionSemanticKey(child)).sort(),
    });
  }
  if (criterion.type === 'rollingAggregate' && criterion.rollingAggregate) {
    return JSON.stringify({
      type: criterion.type,
      windowSeconds: criterion.rollingAggregate.windowSeconds,
      aggregate: criterion.rollingAggregate.aggregate,
      threshold: criterion.rollingAggregate.threshold,
      cmp: criterion.rollingAggregate.cmp,
      child: criterionSemanticKey(criterion.rollingAggregate.child),
    });
  }
  if (criterion.type === 'frequency' && criterion.frequency) {
    return JSON.stringify({
      type: criterion.type,
      windowSeconds: criterion.frequency.windowSeconds,
      times: criterion.frequency.times,
      child: criterionSemanticKey(criterion.frequency.child),
    });
  }
  return JSON.stringify({ type: criterion.type });
}

/** 递归检查一个判据及其子判据。 */
function validateCriterion(criterion: Criterion, path: string, issues: AlarmRuleIssue[]) {
  if (criterion.type === 'plain' && criterion.plain) {
    if (criterion.plain.leaves.length === 0) {
      issues.push({ step: 2, field: path, message: `${path}至少需要一条条件` });
      return;
    }
    criterion.plain.leaves.forEach((leaf, index) => validateLeaf(leaf, `${path}的第 ${index + 1} 条条件`, issues));
    return;
  }

  if (criterion.type === 'duration' && criterion.duration) {
    if (criterion.duration.windowSeconds < 1) {
      issues.push({ step: 2, field: path, message: `${path}的持续时间必须大于 0 秒`, nodeId: criterion.id, control: 'windowSeconds' });
    }
    validateCriterion(criterion.duration.child, `${path}的子条件`, issues);
    return;
  }

  if (criterion.type === 'kOfN' && criterion.kOfN) {
    const count = criterion.kOfN.children.length;
    if (!count) {
      issues.push({ step: 2, field: path, message: `${path}至少需要一个子条件` });
      return;
    }
    if (criterion.kOfN.threshold < 1 || criterion.kOfN.threshold > count) {
      issues.push({
        step: 2,
        field: path,
        message: `${path}的满足次数应在 1 到 ${count} 之间`,
        nodeId: criterion.id,
        control: 'threshold',
      });
    }
    const semanticOwners = new Map<string, number>();
    criterion.kOfN.children.forEach((child, index) => {
      const semanticKey = criterionSemanticKey(child);
      const ownerIndex = semanticOwners.get(semanticKey);
      if (ownerIndex !== undefined) {
        issues.push({
          step: 2,
          field: path,
          message: `${path}的第 ${index + 1} 个子条件与第 ${ownerIndex + 1} 个子条件重复，请配置不同的判断条件`,
          nodeId: child.id,
          control: 'duplicate',
        });
      } else {
        semanticOwners.set(semanticKey, index);
      }
      validateCriterion(child, `${path}的第 ${index + 1} 个子条件`, issues);
    });
    return;
  }

  if (criterion.type === 'rollingAggregate' && criterion.rollingAggregate) {
    if (criterion.rollingAggregate.windowSeconds < 1) {
      issues.push({ step: 2, field: path, message: `${path}的统计窗口必须大于 0 秒`, nodeId: criterion.id, control: 'windowSeconds' });
    }
    if (!['max', 'min', 'avg'].includes(criterion.rollingAggregate.aggregate)) {
      issues.push({ step: 2, field: path, message: `${path}请选择最大值、最小值或平均值聚合`, nodeId: criterion.id, control: 'aggregate' });
    }
    const child = criterion.rollingAggregate.child;
    if (child.type !== 'plain' || !child.plain || child.plain.leaves.length !== 1 || child.plain.leaves[0]?.sourceType !== 'property') {
      issues.push({ step: 2, field: path, message: `${path}的子条件必须是单个数值属性条件` });
    } else if (!child.plain.leaves[0]?.dataID) {
      issues.push({
        step: 2,
        field: path,
        message: `${path}尚未选择需要聚合的数值属性`,
        nodeId: child.plain.leaves[0]?.id,
        control: 'dataID',
      });
    }
    return;
  }

  if (criterion.type === 'frequency' && criterion.frequency) {
    if (criterion.frequency.windowSeconds < 1) {
      issues.push({
        step: 2,
        field: path,
        message: `${path}的统计窗口必须大于 0 秒`,
        nodeId: criterion.id,
        control: 'windowSeconds',
      });
    }
    if (criterion.frequency.times < 1) {
      issues.push({
        step: 2,
        field: path,
        message: `${path}的满足次数必须大于 0`,
        nodeId: criterion.id,
        control: 'times',
      });
    }
    validateCriterion(criterion.frequency.child, `${path}的子条件`, issues);
    return;
  }

  issues.push({ step: 2, field: path, message: `${path}配置不完整，请重新选择判据类型` });
}

/** 检查一个最小条件的字段、阈值和高级评估参数。 */
function validateLeaf(leaf: LeafCondition, path: string, issues: AlarmRuleIssue[]) {
  if (!ConditionSourceTypeList.some((item) => item.value === leaf.sourceType)) {
    issues.push({ step: 2, field: path, message: `${path}的数据源类型不受支持`, nodeId: leaf.id, control: 'dataID' });
    return;
  }
  const aggregateMethod =
    leaf.aggregateMethod ?? defaultAggregateForField(leaf.sourceType);
  if (
    leaf.sourceType !== 'property' &&
    !aggregateOptionsForField(leaf.sourceType).some(
      (item) => item.value === aggregateMethod,
    )
  ) {
    issues.push({
      step: 2,
      field: path,
      message: `${path}不支持当前统计方式`,
      nodeId: leaf.id,
      control: 'aggregate',
    });
  }
  if (leaf.sourceType !== 'online' && !leaf.dataID) {
    issues.push({ step: 2, field: path, message: `${path}尚未选择监控字段`, nodeId: leaf.id, control: 'dataID' });
  }
  // 数组属性（dataID 为「属性.点位[.成员]」点分路径）必须选择点位；
  // 结构体数组缺成员由后端物模型校验兜底（此处无 schema 上下文）
  if (leaf.sourceType === 'property' && leaf.dataID?.includes('.')) {
    const parts = leaf.dataID.split('.');
    if (!parts[1]) {
      issues.push({ step: 2, field: path, message: `${path}尚未选择数组点位`, nodeId: leaf.id, control: 'dataID' });
    }
  }
  if (leaf.sourceType === 'event' || leaf.sourceType === 'action') {
    validateFilterTerms(leaf, path, issues);
  }
  if (leaf.period !== undefined && leaf.period < 1) {
    issues.push({ step: 2, field: path, message: `${path}的统计周期必须大于 0 秒`, nodeId: leaf.id, control: 'period' });
  }
  if (leaf.continuePeriod !== undefined && leaf.continuePeriod < 1) {
    issues.push({ step: 2, field: path, message: `${path}的持续周期数必须大于 0`, nodeId: leaf.id, control: 'continuePeriod' });
  }
  if (leaf.sourceType === 'online' && aggregateMethod === 'last') {
    if (leaf.compare.termType !== 'eq' || !['offline', 'online'].includes(leaf.compare.values[0] ?? '')) {
      issues.push({ step: 2, field: path, message: `${path}请选择在线或离线状态`, nodeId: leaf.id, control: 'compareValue' });
    }
    return;
  }
  if (
    (leaf.sourceType === 'event' || leaf.sourceType === 'action') &&
    aggregateMethod === 'occurred'
  ) {
    return;
  }
  const values = leaf.compare.values ?? [];
  if (leaf.compare.termType === 'btw') {
    if (!hasValue(values[0]) || !hasValue(values[1])) {
      issues.push({ step: 2, field: path, message: `${path}需要填写起始值和结束值`, nodeId: leaf.id, control: 'compareValue' });
    }
  } else if (leaf.compare.termType === 'in') {
    if (!values.some((value) => hasValue(value))) {
      issues.push({ step: 2, field: path, message: `${path}至少需要填写一个候选值`, nodeId: leaf.id, control: 'compareValue' });
    }
  } else if (!hasValue(values[0])) {
    issues.push({ step: 2, field: path, message: `${path}尚未填写比较值`, nodeId: leaf.id, control: 'compareValue' });
  }
}

/** validateFilterTerms 检查事件或行为原始记录过滤条件是否完整。 */
function validateFilterTerms(
  leaf: LeafCondition,
  path: string,
  issues: AlarmRuleIssue[],
): void {
  (leaf.compare.terms ?? []).forEach((term, index) => {
    const filterPath = `${path}的第 ${index + 1} 个参数过滤`;
    if (!hasValue(term.column)) {
      issues.push({
        step: 2,
        field: path,
        message: `${filterPath}尚未选择参数`,
        nodeId: leaf.id,
        control: 'filter',
      });
    }
    if (!CmpTypeList.some((item) => item.value === term.termType)) {
      issues.push({
        step: 2,
        field: path,
        message: `${filterPath}的比较方式不受支持`,
        nodeId: leaf.id,
        control: 'filter',
      });
      return;
    }
    const values = term.values ?? [];
    const hasRequiredValues =
      term.termType === 'btw'
        ? hasValue(values[0]) && hasValue(values[1])
        : term.termType === 'in'
          ? values.some((value) => hasValue(value))
          : hasValue(values[0]);
    if (!hasRequiredValues) {
      issues.push({
        step: 2,
        field: path,
        message: `${filterPath}尚未填写比较值`,
        nodeId: leaf.id,
        control: 'filter',
      });
    }
  });
}

/** 检查一个通知阶梯是否具备可执行的渠道、模板和接收目标。 */
function validateLadder(ladder: NotifyLadder, index: number, issues: AlarmRuleIssue[]) {
  const path = `第 ${index + 1} 个通知阶梯`;
  if (!['trigger', 'recovery', 'both'].includes(ladder.timing)) {
    issues.push({ step: 3, field: path, message: `${path}请选择有效的通知时机`, nodeId: ladder.id, control: 'timing' });
  }
  if (ladder.levels.length === 0) {
    issues.push({ step: 3, field: path, message: `${path}至少需要选择一个告警级别`, nodeId: ladder.id, control: 'levels' });
  } else if (ladder.levels.some((level) => !AlarmLevelList.some((item) => item.value === level))) {
    issues.push({ step: 3, field: path, message: `${path}包含后端不支持的告警级别`, nodeId: ladder.id, control: 'levels' });
  }
  const callbacks = ladder.callbacks ?? [];
  // 模板消息和接口回调都属于可独立使用的通知渠道。
  if (ladder.channels.length === 0 && callbacks.length === 0) {
    issues.push({ step: 3, field: path, message: `${path}至少需要选择一个通知渠道`, nodeId: ladder.id, control: 'channels' });
  }
  ladder.channels.forEach((channel) => {
    if (!NotifyChannelList.some((item) => item.code === channel)) {
      issues.push({ step: 3, field: path, message: `${path}包含后端暂不支持的通知渠道 ${channel}`, nodeId: ladder.id, control: 'channels' });
    }
    const templateID = ladder.channelTemplates[channel];
    if (!templateID) {
      issues.push({ step: 3, field: path, message: `${path}尚未选择 ${channel} 的消息模板`, nodeId: ladder.id, control: 'channelTemplate' });
    } else if (!/^\d+$/.test(templateID) || Number(templateID) <= 0) {
      issues.push({ step: 3, field: path, message: `${path}的 ${channel} 消息模板标识无效，请重新选择`, nodeId: ladder.id, control: 'channelTemplate' });
    }
  });
  // 通知目标：选人（userIDs）或直接填写（手机号/邮箱）至少其一；
  // 直接地址仅短信/邮件渠道生效，若勾选了站内信则仍需选人
  const hasDirectContacts = Boolean(ladder.targets.phones?.length || ladder.targets.emails?.length);
  const hasUserTargets = Boolean(ladder.targets.userIDs?.length);
  if (ladder.channels.length > 0 && !hasUserTargets && !hasDirectContacts) {
    issues.push({ step: 3, field: path, message: `${path}尚未选择通知接收人或填写手机号/邮箱`, nodeId: ladder.id, control: 'targets' });
  } else if (ladder.channels.includes('message') && !hasUserTargets) {
    issues.push({ step: 3, field: path, message: `${path}已选择站内信渠道，站内信仅支持按用户发送，请选择通知接收人`, nodeId: ladder.id, control: 'targets' });
  }
  if (!Number.isInteger(ladder.delaySeconds) || ladder.delaySeconds < 0) {
    issues.push({ step: 3, field: path, message: `${path}的延迟秒数必须是大于或等于 0 的整数`, nodeId: ladder.id, control: 'delaySeconds' });
  }
  callbacks.forEach((callback, callbackIndex) => {
    const callbackPath = `${path}的第 ${callbackIndex + 1} 个回调`;
    if (!hasValue(callback.url)) {
      issues.push({
        step: 3,
        field: path,
        message: `${callbackPath}尚未填写 URL`,
        nodeId: callback.id,
        control: 'callbackUrl',
      });
    } else {
      try {
        const url = new URL(callback.url);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
      } catch {
        issues.push({ step: 3, field: path, message: `${callbackPath} URL 格式不正确`, nodeId: callback.id, control: 'callbackUrl' });
      }
    }
    if (!['GET', 'POST'].includes(callback.method)) {
      issues.push({ step: 3, field: path, message: `${callbackPath}只支持 GET 或 POST`, nodeId: callback.id, control: 'callbackMethod' });
    }
    if (!['none', 'basic', 'bearer'].includes(callback.authType)) {
      issues.push({ step: 3, field: path, message: `${callbackPath}的认证方式不受支持`, nodeId: callback.id, control: 'callbackAuthToken' });
    } else if (callback.authType !== 'none' && !hasValue(callback.authToken)) {
      issues.push({ step: 3, field: path, message: `${callbackPath}需要填写认证 Token`, nodeId: callback.id, control: 'callbackAuthToken' });
    }
    if (!Number.isInteger(callback.timeoutSeconds) || callback.timeoutSeconds < 1) {
      issues.push({ step: 3, field: path, message: `${callbackPath}的超时秒数必须是大于 0 的整数`, nodeId: callback.id, control: 'callbackTimeoutSeconds' });
    }
    if (!Number.isInteger(callback.retryTimes) || callback.retryTimes < 0) {
      issues.push({ step: 3, field: path, message: `${callbackPath}的重试次数必须是大于或等于 0 的整数`, nodeId: callback.id, control: 'callbackRetryTimes' });
    }
  });
}

/** 返回规则当前所有阻断性问题，页面可按 step 过滤并定位。 */
export function validateAlarmRule(rule: AlarmRule): AlarmRuleIssue[] {
  const issues: AlarmRuleIssue[] = [];
  const name = rule.name.trim();
  if (!name) {
    issues.push({ step: 1, field: 'name', message: '请输入一个便于识别的规则名称' });
  } else if (name.length > 128) {
    issues.push({ step: 1, field: 'name', message: '规则名称不能超过 128 个字符' });
  }
  if (rule.evalPeriod < 1) {
    issues.push({ step: 1, field: 'evalPeriod', message: '评估周期必须大于或等于 1 分钟' });
  }
  if (!SelectTypeList.some((item) => item.value === rule.target.selectType)) {
    issues.push({ step: 1, field: 'target', message: '请选择有效的告警对象范围' });
  }
  if (!TargetKindList.some((item) => item.value === rule.target.targetKind)) {
    issues.push({ step: 1, field: 'source', message: '请选择产品或产品品类作为告警来源' });
  }
  if (rule.target.targetKind === 'product' && !rule.target.productID) {
    issues.push({ step: 1, field: 'source', message: '请先选择需要监控的产品' });
  }
  if (rule.target.targetKind === 'category' && !rule.target.categoryID) {
    issues.push({ step: 1, field: 'source', message: '请先选择需要监控的产品品类' });
  }
  if (rule.target.selectType === 'fixed' && !rule.target.devices?.length) {
    issues.push({ step: 1, field: 'target', message: '请至少选择一台设备' });
  }
  if ((rule.target.selectType === 'area' || rule.target.selectType === 'areaWithChildren') && !rule.target.areas?.length) {
    issues.push({ step: 1, field: 'target', message: '请至少选择一个区域' });
  }
  if (rule.target.selectType === 'group' && !rule.target.groups?.length) {
    issues.push({ step: 1, field: 'target', message: '请至少选择一个设备分组' });
  }
  if ((rule.target.areas?.length || rule.target.groups?.length) && rule.target.devices?.length) {
    issues.push({ step: 1, field: 'target', message: '区域或分组不能与指定设备同时选择' });
  }
  if (rule.target.selectType === 'fixed' && rule.target.devices?.some((device) => !hasValue(device.name))) {
    issues.push({ step: 1, field: 'target', message: '指定设备中存在缺少设备标识的项目，请重新选择' });
  }

  if (rule.if.triggers.length === 0) {
    issues.push({ step: 2, field: 'triggers', message: '请至少添加一组触发条件' });
  }
  const triggerLevelOwners = new Map<string, number>();
  rule.if.triggers.forEach((trigger, triggerIndex) => {
    const path = `第 ${triggerIndex + 1} 组触发条件`;
    if (!AlarmLevelList.some((item) => item.value === trigger.level)) {
      issues.push({ step: 2, field: path, message: `${path}请选择有效的告警级别`, nodeId: trigger.id, control: 'level' });
    }
    if (!['and', 'or'].includes(trigger.type)) {
      issues.push({ step: 2, field: path, message: `${path}的组合方式必须是满足所有或满足任一`, nodeId: trigger.id, control: 'logic' });
    }
    const ownerIndex = triggerLevelOwners.get(trigger.level);
    if (ownerIndex !== undefined) {
      issues.push({
        step: 2,
        field: path,
        message: `${path}与第 ${ownerIndex + 1} 组重复使用“${alarmLevelLabel(trigger.level)}”级别，每个条件组必须使用不同级别`,
        nodeId: trigger.id,
        control: 'level',
      });
    } else {
      triggerLevelOwners.set(trigger.level, triggerIndex);
    }
    if (trigger.criteria.length === 0) {
      issues.push({ step: 2, field: path, message: `${path}至少需要一个判据` });
      return;
    }
    trigger.criteria.forEach((criterion, criterionIndex) => validateCriterion(criterion, `${path}的第 ${criterionIndex + 1} 个判据`, issues));
  });

  if (rule.notify.ladders.length === 0) {
    issues.push({ step: 3, field: 'ladders', message: '请至少添加一个通知阶梯' });
  }
  const ladderLevelTimingOwners = new Map<string, number>();
  const coveredLevels = new Set<string>();
  rule.notify.ladders.forEach((ladder, index) => {
    validateLadder(ladder, index, issues);
    ladder.levels.forEach((level) => {
      coveredLevels.add(level);
      notifyTimingScopes(ladder.timing).forEach((timing) => {
        const key = `${level}:${timing}`;
        const ownerIndex = ladderLevelTimingOwners.get(key);
        if (ownerIndex !== undefined) {
          issues.push({
            step: 3,
            field: `第 ${index + 1} 个通知阶梯`,
            message: `第 ${index + 1} 个通知阶梯与第 ${ownerIndex + 1} 个通知阶梯重复绑定“${alarmLevelLabel(level)}”级别的${timing === 'trigger' ? '告警触发' : '告警恢复'}通知`,
            nodeId: ladder.id,
            control: 'levels',
          });
        } else {
          ladderLevelTimingOwners.set(key, index);
        }
      });
    });
  });
  new Set(rule.if.triggers.map((trigger) => trigger.level)).forEach((level) => {
    if (!coveredLevels.has(level)) {
      issues.push({
        step: 3,
        field: 'ladders',
        message: `触发条件使用了“${alarmLevelLabel(level)}”级别，请为该级别配置通知方案`,
      });
    }
  });
  return issues;
}

/** 把一个最小条件转换为便于用户确认的自然语言。 */
export function summarizeLeaf(leaf: LeafCondition): string {
  const compare = CmpTypeList.find((item) => item.value === leaf.compare.termType)?.label;
  const aggregate = AggregateTypeList.find((item) => item.value === leaf.aggregateMethod)?.label;
  const value =
    leaf.compare.termType === 'btw'
      ? `${leaf.compare.values[0] || '?'} 到 ${leaf.compare.values[1] || '?'}`
      : leaf.compare.values.filter((value) => hasValue(value)).join('、') || '?';
  const period = leaf.period ? `${leaf.period} 秒内的${aggregate ?? '最新值'}` : aggregate;
  return `${leaf.dataName || leaf.dataID || '未选择字段'}的${period || '当前值'}${compare || ''}${value}`;
}

/** 把触发条件数组组合成一句可读摘要（「同时满足：Ua的60秒内的最新值>200」），供编辑核对与 AI 上下文共用。 */
export function summarizeTriggerConditions(triggers: Trigger[]): string {
  if (!triggers.length) return '尚未配置触发条件';
  return triggers
    .map((trigger) => {
      const criteria = trigger.criteria.flatMap((criterion) => {
        if (criterion.type === 'plain' && criterion.plain) {
          return criterion.plain.leaves.map(summarizeLeaf);
        }
        if (criterion.type === 'duration' && criterion.duration) {
          return [`条件持续 ${criterion.duration.windowSeconds} 秒`];
        }
        if (criterion.type === 'frequency' && criterion.frequency) {
          return [`${criterion.frequency.windowSeconds} 秒内满足 ${criterion.frequency.times} 次`];
        }
        if (criterion.type === 'kOfN' && criterion.kOfN) {
          return [`${criterion.kOfN.children.length} 个条件中满足 ${criterion.kOfN.threshold} 个`];
        }
        if (criterion.type === 'rollingAggregate' && criterion.rollingAggregate) {
          return [`按 ${criterion.rollingAggregate.windowSeconds} 秒窗口计算${criterion.rollingAggregate.aggregate}`];
        }
        return ['条件配置不完整'];
      });
      return `${trigger.type === 'and' ? '同时满足' : '满足任一'}：${criteria.join('；')}`;
    })
    .join('；');
}
