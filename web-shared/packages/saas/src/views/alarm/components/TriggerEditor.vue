<script setup lang="ts">
import type { AlarmRuleIssue } from '../composables/useAlarmRuleValidation';
import type { AlarmLevel, AlarmObjectSchema, Criterion, CriterionType, LeafCondition, PlainCriterion, SchemaField, Trigger } from '../types/alarm-v2.types';

/**
 * 文件说明：触发条件（条件组）编辑器
 * 负责单个 Trigger 的完整编辑：头部级别/组合方式、判据列表、叶子条件增删改查、判据移动。
 * 与告警规则 Step 2 共用本组件，保证触发条件模板管理页与规则编辑页交互一致。
 * 当 Trigger 带有条件预设来源（templateID 非空）时，条件体默认只读；用户转换为自定义条件后可继续编辑。
 */
import { computed } from 'vue';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Input } from '@unitedrhino/saas-ui/ui/input';

import {
  aggregateOptionsForField,
  allowedCriterionChildren,
  compareOptionsForField,
  compareOptionsForSource,
  criterionTypesFromCapabilities,
  defaultAggregateForField,
  defaultCompareForField,
  requiresScalarCompare,
  sourceTypeOptionsFromCapabilities,
  usesOnlineStateCompare,
} from '../composables/useAlarmCapabilities';
import StepConditionNode from '../rule/edit/components/StepConditionNode.vue';
import { AlarmLevelList } from '../types/alarm-v2.types';
import AlarmSelect from './AlarmSelect.vue';
import LeafFilterEditor from './LeafFilterEditor.vue';
import {
  arrayContextOf,
  arrayMemberOptions,
  arrayPointOptions,
  buildArrayLeafPatch,
} from '../composables/useAlarmArrayLeaf';

const props = defineProps<{
  /** 是否展示复杂判据和单条件的统计参数。 */
  advanced?: boolean;
  /** 已经触发表单校验、需要映射到具体条件控件的问题。 */
  issues?: AlarmRuleIssue[];
  /** 是否只读（来自模板快照时锁定） */
  readonly?: boolean;
  schema: AlarmObjectSchema;
  /** 是否显示头部级别选择器；模板管理页仅指定条件，不指定级别 */
  showLevel?: boolean;
  trigger: Trigger;
  /** 已被其他条件组占用、当前条件组不可再选择的告警级别。 */
  unavailableLevels?: AlarmLevel[];
}>();

const emit = defineEmits<{
  (e: 'update:trigger', value: Trigger): void;
  (e: 'convert'): void;
  (e: 'remove'): void;
  (e: 'move', dir: -1 | 1): void;
}>();

const showLevel = computed(() => props.showLevel !== false);

/** 判断某个条件节点内的指定控件是否存在阻断性问题。 */
function hasControlIssue(nodeId: string, control: AlarmRuleIssue['control']): boolean {
  return props.issues?.some((issue) => issue.nodeId === nodeId && issue.control === control) ?? false;
}

/** 为错误控件提供一致且在深色模式下清晰可见的边框和焦点状态。 */
function controlIssueClass(nodeId: string, control: AlarmRuleIssue['control']): string {
  return hasControlIssue(nodeId, control) ? '!border-destructive ring-destructive/20 ring-1 focus:ring-destructive/30' : '';
}

/** 所有可选的物模型字段（含内置在线状态） */
const schemaFields = computed(() => {
  return [...props.schema.metricFields, ...props.schema.eventFields, ...props.schema.actionFields, ...props.schema.onlineFields];
});

/** levelOptions 标识已被其他条件组占用的告警级别。 */
const levelOptions = computed(() =>
  AlarmLevelList.map((level) => ({
    ...level,
    disabled: props.unavailableLevels?.includes(level.value),
  })),
);

/** sourceTypeOptions 标识当前物模型没有真实字段的数据源类型。 */
const sourceTypeOptions = computed(() =>
  sourceTypeOptionsFromCapabilities().map((item) => ({
    ...item,
    disabled: isSourceTypeUnavailable(item.value),
  })),
);

/** criterionTypeOptions 仅允许创建后端能力接口声明的判据。 */
const criterionTypeOptions = computed(() => criterionTypesFromCapabilities());

/** rollingCompareOptions 返回滚动数值聚合允许使用的有序比较符。 */
const rollingCompareOptions = computed(() => compareOptionsForSource('property').filter((item) => ['gt', 'gte', 'lt', 'lte'].includes(item.value)));

/** triggerLogicOptions 定义条件组组合方式。 */
const triggerLogicOptions = [
  { label: '满足所有（AND）', value: 'and' },
  { label: '满足任一（OR）', value: 'or' },
];

/** plainLogicOptions 定义普通判据内部组合方式。 */
const plainLogicOptions = [
  { label: 'AND', value: 'and' },
  { label: 'OR', value: 'or' },
];

/** onlineValueOptions 定义在线状态比较值。 */
const onlineValueOptions = [
  { label: '离线', value: 'offline' },
  { label: '在线', value: 'online' },
];

/** rollingAggregateOptions 定义复杂判据支持的聚合方式。 */
const rollingAggregateOptions = [
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '平均值', value: 'avg' },
];

/** 根据 dataID 查找字段 */
function findField(dataID?: string): SchemaField | undefined {
  return schemaFields.value.find((f) => f.dataID === dataID);
}

/** 判断当前告警来源是否提供指定类型的真实字段。 */
function isSourceTypeUnavailable(sourceType: LeafCondition['sourceType']): boolean {
  return !schemaFields.value.some((field) => field.sourceType === sourceType);
}

/** arrayFieldOf 按字段路径前缀匹配叶子对应的数组属性字段（dataID 点分路径）。 */
function arrayFieldOf(leaf: LeafCondition): SchemaField | undefined {
  return arrayContextOf(schemaFields.value, leaf)?.field;
}

/** fieldOptions 返回当前叶子的数据源字段，并保留历史失效字段。 */
function fieldOptions(leaf: LeafCondition) {
  const options = schemaFields.value.filter((field) => field.sourceType === leaf.sourceType).map((field) => ({ label: field.name, value: field.dataID }));
  if (leaf.dataID && !findField(leaf.dataID)) {
    const arrayField = arrayFieldOf(leaf);
    if (!arrayField) {
      options.unshift({
        label: `${leaf.dataName || leaf.dataID}（已失效）`,
        value: leaf.dataID,
      });
    } else {
      options.unshift({ label: leaf.dataName || arrayField.name, value: leaf.dataID });
    }
  }
  return options;
}

/** arrayCtxOf 返回当前叶子若为数组属性时的级联上下文（含点位/成员反解）。 */
function arrayCtxOf(leaf: LeafCondition) {
  return arrayContextOf(schemaFields.value, leaf);
}

/** onArrayPointChange 点位切换：拼 dataID 并按元素类型重置比较与聚合。 */
function onArrayPointChange(criterion: Criterion, leaf: LeafCondition, pointStr: string) {
  const ctx = arrayCtxOf(leaf);
  if (!ctx) return;
  const patch = buildArrayLeafPatch(ctx, Number(pointStr));
  const valueType = patch.memberValueType as SchemaField['valueType'];
  updateLeaf(criterion, leaf.id, {
    ...patch,
    compare: {
      termType: defaultCompareForField('property', valueType, defaultAggregateForField('property', valueType)),
      terms: [],
      values: [''],
    },
    aggregateMethod: defaultAggregateForField('property', valueType),
  } as Partial<LeafCondition>);
}

/** onArrayMemberChange 成员切换（结构体数组）：保留点位，按成员类型重置比较与聚合。 */
function onArrayMemberChange(criterion: Criterion, leaf: LeafCondition, member: string) {
  const ctx = arrayCtxOf(leaf);
  if (!ctx?.hasPoint) return;
  const patch = buildArrayLeafPatch(ctx, ctx.point!, member || undefined);
  const valueType = patch.memberValueType as SchemaField['valueType'];
  updateLeaf(criterion, leaf.id, {
    ...patch,
    compare: {
      termType: defaultCompareForField('property', valueType, defaultAggregateForField('property', valueType)),
      terms: [],
      values: [''],
    },
    aggregateMethod: defaultAggregateForField('property', valueType),
  } as Partial<LeafCondition>);
}

/** aggregateOptions 返回当前叶子与后端一致的历史窗口聚合选项。 */
function aggregateOptions(leaf: LeafCondition) {
  const ctx = arrayCtxOf(leaf);
  const valueType = ctx?.memberValueType as SchemaField['valueType'] | undefined;
  if (valueType) {
    return aggregateOptionsForField(leaf.sourceType, valueType);
  }
  return aggregateOptionsForField(leaf.sourceType, findField(leaf.dataID)?.valueType);
}

/** compareOptions 返回当前叶子数据源允许的比较符。 */
function compareOptions(leaf: LeafCondition) {
  const ctx = arrayCtxOf(leaf);
  const valueType = ctx?.memberValueType as SchemaField['valueType'] | undefined;
  if (valueType) {
    return compareOptionsForField(leaf.sourceType, valueType, leaf.aggregateMethod);
  }
  return compareOptionsForField(leaf.sourceType, findField(leaf.dataID)?.valueType, leaf.aggregateMethod);
}

/** requiresScalarCompareForLeaf 判断当前聚合结果是否需要数值或文本阈值。 */
function requiresScalarCompareForLeaf(leaf: LeafCondition): boolean {
  return requiresScalarCompare(leaf.sourceType, leaf.aggregateMethod);
}

/** usesOnlineStateCompareForLeaf 判断当前叶子是否比较窗口末在线状态。 */
function usesOnlineStateCompareForLeaf(leaf: LeafCondition): boolean {
  return usesOnlineStateCompare(leaf.sourceType, leaf.aggregateMethod);
}

let idCounter = 1;
function newId(prefix = 'node'): string {
  return `${prefix}-${Date.now()}-${idCounter++}`;
}

/** 创建一个默认叶子条件 */
function createLeaf(preferredField?: SchemaField): LeafCondition {
  const field = preferredField ?? props.schema.metricFields[0] ?? props.schema.eventFields[0] ?? props.schema.actionFields[0] ?? props.schema.onlineFields[0];
  const sourceType = field?.sourceType ?? 'property';
  const aggregateMethod = defaultAggregateForField(sourceType, field?.valueType);
  return {
    id: newId('leaf'),
    sourceType,
    dataID: field?.dataID,
    dataName: field?.name,
    compare:
      field?.sourceType === 'online'
        ? { termType: 'eq', values: ['offline'] }
        : {
            termType: defaultCompareForField(sourceType, field?.valueType, aggregateMethod),
            values: [''],
          },
    period: 60,
    aggregateMethod,
    continuePeriod: 1,
  };
}

/** 创建指定类型的判据 */
function createCriterion(type: CriterionType): Criterion {
  const base: Criterion = { id: newId('crit'), type };
  switch (type) {
    case 'duration': {
      base.duration = { windowSeconds: 300, child: createCriterion('plain') };

      break;
    }
    case 'frequency': {
      base.frequency = { windowSeconds: 300, times: 3, child: createCriterion('plain') };

      break;
    }
    case 'kOfN': {
      base.kOfN = { threshold: 1, children: [createCriterion('plain')] };

      break;
    }
    case 'plain': {
      base.plain = { logic: 'and', leaves: [createLeaf()] };

      break;
    }
    case 'rollingAggregate': {
      const propertyLeaf = createLeaf(props.schema.metricFields[0]);
      base.rollingAggregate = {
        windowSeconds: 300,
        aggregate: 'avg',
        threshold: 0,
        cmp: 'gt',
        child: {
          id: newId('crit'),
          type: 'plain',
          plain: { logic: 'and', leaves: [propertyLeaf] },
        },
      };

      break;
    }
    // No default
  }
  return base;
}

function updateTrigger(patch: Partial<Trigger>) {
  emit('update:trigger', { ...props.trigger, ...patch });
}

function updateCriterionInTrigger(criterion: Criterion) {
  if (props.readonly) return;
  updateTrigger({ criteria: updateCriterion(props.trigger.criteria, criterion) });
}

function updateCriterion(list: Criterion[], updated: Criterion): Criterion[] {
  return list.map((item) => {
    if (item.id === updated.id) return updated;
    if (item.type === 'duration' && item.duration) {
      const child = updateCriterion([item.duration.child], updated)[0]!;
      return { ...item, duration: { ...item.duration, child } };
    }
    if (item.type === 'kOfN' && item.kOfN) {
      const children = updateCriterion(item.kOfN.children, updated);
      return { ...item, kOfN: { ...item.kOfN, children } };
    }
    if (item.type === 'rollingAggregate' && item.rollingAggregate) {
      const child = updateCriterion([item.rollingAggregate.child], updated)[0]!;
      return { ...item, rollingAggregate: { ...item.rollingAggregate, child } };
    }
    if (item.type === 'frequency' && item.frequency) {
      const child = updateCriterion([item.frequency.child], updated)[0]!;
      return { ...item, frequency: { ...item.frequency, child } };
    }
    return item;
  });
}

function removeCriterionFromTrigger(criterionId: string) {
  if (props.readonly) return;
  updateTrigger({ criteria: removeCriterion(props.trigger.criteria, criterionId) });
}

function removeCriterion(list: Criterion[], criterionId: string): Criterion[] {
  return list
    .filter((item) => item.id !== criterionId)
    .map((item) => {
      if (item.type === 'duration' && item.duration) {
        const child = removeCriterion([item.duration.child], criterionId)[0]!;
        return { ...item, duration: { ...item.duration, child } };
      }
      if (item.type === 'kOfN' && item.kOfN) {
        const children = removeCriterion(item.kOfN.children, criterionId);
        return { ...item, kOfN: { ...item.kOfN, children } };
      }
      if (item.type === 'rollingAggregate' && item.rollingAggregate) {
        const child = removeCriterion([item.rollingAggregate.child], criterionId)[0]!;
        return { ...item, rollingAggregate: { ...item.rollingAggregate, child } };
      }
      if (item.type === 'frequency' && item.frequency) {
        const child = removeCriterion([item.frequency.child], criterionId)[0]!;
        return { ...item, frequency: { ...item.frequency, child } };
      }
      return item;
    });
}

function addCriterion(type: CriterionType) {
  if (props.readonly || isCriterionUnavailable(type)) return;
  updateTrigger({ criteria: [...props.trigger.criteria, createCriterion(type)] });
}

/** 判断当前物模型是否无法生成满足后端契约的判据默认值。 */
function isCriterionUnavailable(type: CriterionType): boolean {
  return !criterionTypeOptions.value.includes(type) || (type === 'rollingAggregate' && props.schema.metricFields.length === 0);
}

function addChildCriterion(parent: Criterion, type: CriterionType) {
  if (props.readonly) return;
  const child = createCriterion(type);
  let updated: Criterion;
  if (parent.type === 'plain' && parent.plain) {
    updated = { ...parent, plain: { ...parent.plain, leaves: [...parent.plain.leaves, createLeaf()] } };
    updateCriterionInTrigger(updated);
    return;
  }
  if (parent.type === 'duration' && parent.duration) {
    updated = { ...parent, duration: { ...parent.duration, child } };
  } else if (parent.type === 'kOfN' && parent.kOfN) {
    updated = { ...parent, kOfN: { ...parent.kOfN, children: [...parent.kOfN.children, child] } };
  } else if (parent.type === 'rollingAggregate' && parent.rollingAggregate) {
    updated = { ...parent, rollingAggregate: { ...parent.rollingAggregate, child } };
  } else if (parent.type === 'frequency' && parent.frequency) {
    updated = { ...parent, frequency: { ...parent.frequency, child } };
  } else {
    return;
  }
  updateCriterionInTrigger(updated);
}

/** 删除 K-of-N 的指定子判据；至少保留一个子判据以满足后端契约。 */
function removeKOfNChild(parent: Criterion, childId: string) {
  if (props.readonly || !parent.kOfN || parent.kOfN.children.length <= 1) return;
  const children = parent.kOfN.children.filter((child) => child.id !== childId);
  const threshold = Math.min(parent.kOfN.threshold, children.length);
  updateCriterionInTrigger({ ...parent, kOfN: { ...parent.kOfN, threshold, children } });
}

function moveCriterion(idx: number, dir: -1 | 1) {
  if (props.readonly) return;
  const target = idx + dir;
  if (target < 0 || target >= props.trigger.criteria.length) return;
  const copy = [...props.trigger.criteria];
  const tmp = copy[idx]!;
  copy[idx] = copy[target]!;
  copy[target] = tmp;
  updateTrigger({ criteria: copy });
}

function moveLeaf(plain: PlainCriterion, idx: number, dir: -1 | 1): LeafCondition[] {
  const list = plain.leaves ?? [];
  const target = idx + dir;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  const tmp = copy[idx]!;
  copy[idx] = copy[target]!;
  copy[target] = tmp;
  return copy;
}

function updateLeaf(criterion: Criterion, leafId: string, patch: Partial<LeafCondition>) {
  if (!criterion.plain || props.readonly) return;
  const leaves = criterion.plain.leaves.map((leaf) => (leaf.id === leafId ? { ...leaf, ...patch } : leaf));
  updateCriterionInTrigger({ ...criterion, plain: { ...criterion.plain, leaves } });
}

function removeLeaf(criterion: Criterion, leafId: string) {
  if (!criterion.plain || props.readonly) return;
  const leaves = criterion.plain.leaves.filter((leaf) => leaf.id !== leafId);
  updateCriterionInTrigger({ ...criterion, plain: { ...criterion.plain, leaves } });
}

function moveLeafInPlain(criterion: Criterion, idx: number, dir: -1 | 1) {
  if (!criterion.plain || props.readonly) return;
  const leaves = moveLeaf(criterion.plain, idx, dir);
  updateCriterionInTrigger({ ...criterion, plain: { ...criterion.plain, leaves } });
}

/** onDataIDChange 切换字段时一次性提交字段标识、名称和来源类型。 */
function onDataIDChange(criterion: Criterion, leaf: LeafCondition, dataID: string) {
  const field = findField(dataID);
  // 数组属性必须继续选择点位：dataID 置尾点占位，触发"尚未选择数组点位"必填校验
  const resolvedDataID = field?.valueType === 'array' ? `${dataID}.` : dataID;
  const sourceType = field?.sourceType ?? leaf.sourceType;
  const allowedAggregates = aggregateOptionsForField(sourceType, field?.valueType);
  const aggregateMethod = allowedAggregates.some((item) => item.value === leaf.aggregateMethod)
    ? leaf.aggregateMethod
    : defaultAggregateForField(sourceType, field?.valueType);
  updateLeaf(criterion, leaf.id, {
    dataID: resolvedDataID,
    dataName: field?.name,
    sourceType,
    compare: {
      termType: defaultCompareForField(sourceType, field?.valueType, aggregateMethod),
      terms: [],
      values: [''],
    },
    aggregateMethod,
  });
}

/** 切换数据源时同步选择第一个有效字段，并为在线状态设置后端支持的固定比较方式。 */
function onSourceTypeChange(criterion: Criterion, leaf: LeafCondition, sourceType: LeafCondition['sourceType']) {
  const field = schemaFields.value.find((item) => item.sourceType === sourceType);
  const aggregateMethod = defaultAggregateForField(sourceType, field?.valueType);
  updateLeaf(criterion, leaf.id, {
    sourceType,
    dataID: field?.dataID,
    dataName: field?.name,
    compare:
      sourceType === 'online'
        ? { termType: 'eq', values: ['offline'] }
        : {
            termType: defaultCompareForField(sourceType, field?.valueType, aggregateMethod),
            values: [''],
          },
    aggregateMethod,
  });
}

/** 切换窗口聚合时同步切换状态枚举或标量阈值比较模型。 */
function onAggregateChange(criterion: Criterion, leaf: LeafCondition, aggregateMethod: NonNullable<LeafCondition['aggregateMethod']>) {
  const wasScalar = requiresScalarCompareForLeaf(leaf);
  const nextUsesOnlineState = usesOnlineStateCompare(leaf.sourceType, aggregateMethod);
  const nextRequiresScalar = requiresScalarCompare(leaf.sourceType, aggregateMethod);
  const nextCompare = defaultCompareForField(leaf.sourceType, findField(leaf.dataID)?.valueType, aggregateMethod);
  const currentAllowed = compareOptionsForField(leaf.sourceType, findField(leaf.dataID)?.valueType, aggregateMethod).some(
    (item) => item.value === leaf.compare.termType,
  );
  updateLeaf(criterion, leaf.id, {
    aggregateMethod,
    compare: nextUsesOnlineState
      ? { termType: 'eq', values: ['offline'] }
      : (nextRequiresScalar && (!wasScalar || !currentAllowed)
        ? { termType: nextCompare, values: [''] }
        : leaf.compare),
  });
}

/** 切换比较符时重置值数量，确保介于和列表比较生成正确的接口结构。 */
function onCompareChange(criterion: Criterion, leaf: LeafCondition, termType: LeafCondition['compare']['termType']) {
  const firstValue = leaf.compare.values[0] ?? '';
  updateLeaf(criterion, leaf.id, {
    compare: {
      ...leaf.compare,
      termType,
      values: termType === 'btw' ? [firstValue, ''] : [firstValue],
    },
  });
}

/** 把中文或英文逗号分隔的输入转换为列表比较所需的值数组。 */
function onListValuesChange(criterion: Criterion, leaf: LeafCondition, value: string) {
  updateLeaf(criterion, leaf.id, {
    compare: {
      ...leaf.compare,
      values: value
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    },
  });
}
</script>

<template>
  <section class="border-border bg-background overflow-hidden rounded-md border">
    <!-- 触发条件头部 -->
    <div class="border-border bg-muted/20 flex items-center justify-between gap-4 border-b px-4 py-3">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm font-semibold">
          条件组
          <span class="text-destructive" aria-label="必填">*</span>
        </span>
        <span v-if="trigger.templateName" class="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs">
          条件来源：{{ trigger.templateName }}（预设）
        </span>
        <AlarmSelect
          v-if="showLevel"
          data-testid="alarm-trigger-level"
          :model-value="trigger.level"
          :disabled="readonly && !trigger.templateName"
          class="h-9 w-24"
          :class="controlIssueClass(trigger.id, 'level')"
          :aria-invalid="hasControlIssue(trigger.id, 'level')"
          :options="levelOptions"
          @update:model-value="updateTrigger({ level: $event as AlarmLevel })"
        />
        <AlarmSelect
          data-testid="alarm-trigger-logic"
          :model-value="trigger.type"
          :disabled="readonly"
          class="h-9 w-40"
          :class="controlIssueClass(trigger.id, 'logic')"
          :aria-invalid="hasControlIssue(trigger.id, 'logic')"
          :options="triggerLogicOptions"
          @update:model-value="updateTrigger({ type: $event as Trigger['type'] })"
        />
      </div>
      <div class="flex items-center gap-2">
        <Button v-if="readonly && trigger.templateName" size="xs" variant="outline" @click="$emit('convert')"> 转换为自定义条件 </Button>
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- 判据列表 -->
    <TransitionGroup name="condition-swap" tag="div" class="divide-border divide-y">
      <div
        v-for="(criterion, cIdx) in trigger.criteria"
        :key="criterion.id"
        class="relative py-4 pl-11 pr-4"
        data-testid="alarm-criterion"
        :data-criterion-type="criterion.type"
        :data-node-id="criterion.id"
      >
        <span aria-hidden="true" class="bg-border absolute bottom-0 left-5 top-0 w-px"></span>
        <span aria-hidden="true" class="bg-primary ring-background absolute left-[17px] top-6 size-2 rounded-full ring-4"></span>

        <!-- 普通条件 -->
        <template v-if="criterion.type === 'plain' && criterion.plain">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-sm font-medium">
              <span class="text-muted-foreground text-xs">判据 {{ String(cIdx + 1).padStart(2, '0') }}</span>
              <span>
                普通条件
                <span class="text-destructive" aria-label="必填">*</span>
              </span>
              <AlarmSelect
                data-testid="alarm-plain-logic"
                :model-value="criterion.plain.logic"
                :disabled="readonly"
                class="h-9 w-20"
                :options="plainLogicOptions"
                @update:model-value="updateCriterionInTrigger({ ...criterion, plain: { ...criterion.plain, logic: $event as 'and' | 'or' } })"
              />
            </div>
            <div v-if="!readonly" class="flex items-center gap-2">
              <Button size="xs" variant="outline" :disabled="cIdx === 0" @click="moveCriterion(cIdx, -1)">↑</Button>
              <Button size="xs" variant="outline" :disabled="cIdx === trigger.criteria.length - 1" @click="moveCriterion(cIdx, 1)"> ↓ </Button>
              <Button class="text-destructive" size="xs" variant="ghost" @click="removeCriterionFromTrigger(criterion.id)"> 删除 </Button>
            </div>
          </div>

          <TransitionGroup name="condition-swap" tag="div" class="divide-border/60 divide-y">
            <div v-for="(leaf, lIdx) in criterion.plain.leaves" :key="leaf.id" class="flex flex-wrap items-center gap-2 py-3">
              <span class="text-muted-foreground w-14 shrink-0 text-xs">
                条件 {{ String(lIdx + 1).padStart(2, '0') }}
                <span class="text-destructive" aria-label="必填">*</span>
              </span>
              <AlarmSelect
                data-testid="alarm-leaf-source"
                :data-node-id="leaf.id"
                :model-value="leaf.sourceType"
                :disabled="readonly"
                class="h-9 w-24"
                :options="sourceTypeOptions"
                @update:model-value="onSourceTypeChange(criterion, leaf, $event as LeafCondition['sourceType'])"
              />

              <AlarmSelect
                data-testid="alarm-leaf-field"
                :data-node-id="leaf.id"
                :model-value="leaf.dataID"
                :disabled="readonly"
                :required="leaf.sourceType !== 'online'"
                class="h-9 w-[240px]"
                :class="controlIssueClass(leaf.id, 'dataID')"
                :aria-invalid="hasControlIssue(leaf.id, 'dataID')"
                :options="fieldOptions(leaf)"
                @update:model-value="onDataIDChange(criterion, leaf, String($event))"
              />

              <template v-if="arrayCtxOf(leaf)">
                <AlarmSelect
                  data-testid="alarm-leaf-point"
                  :model-value="arrayCtxOf(leaf)?.point === undefined ? '' : String(arrayCtxOf(leaf)?.point)"
                  :disabled="readonly"
                  class="h-9 w-32"
                  :class="controlIssueClass(leaf.id, 'dataID')"
                  :options="arrayPointOptions(arrayCtxOf(leaf)!.field)"
                  placeholder="点位"
                  @update:model-value="onArrayPointChange(criterion, leaf, String($event))"
                />
                <AlarmSelect
                  v-if="arrayCtxOf(leaf)!.field.arrayMeta?.struct"
                  data-testid="alarm-leaf-member"
                  :model-value="arrayCtxOf(leaf)?.member ?? ''"
                  :disabled="readonly"
                  class="h-9 w-32"
                  :class="controlIssueClass(leaf.id, 'dataID')"
                  :options="arrayMemberOptions(arrayCtxOf(leaf)!.field)"
                  placeholder="成员"
                  @update:model-value="onArrayMemberChange(criterion, leaf, String($event))"
                />
              </template>

              <AlarmSelect
                v-if="requiresScalarCompareForLeaf(leaf)"
                data-testid="alarm-leaf-compare"
                :data-node-id="leaf.id"
                :model-value="leaf.compare.termType"
                :disabled="readonly"
                class="h-9 w-24"
                :options="compareOptions(leaf)"
                @update:model-value="onCompareChange(criterion, leaf, $event as LeafCondition['compare']['termType'])"
              />

              <span
                v-if="usesOnlineStateCompareForLeaf(leaf) || requiresScalarCompareForLeaf(leaf)"
                class="text-destructive text-xs"
                title="比较值必填"
                aria-hidden="true"
                >*</span
              >

              <AlarmSelect
                v-if="usesOnlineStateCompareForLeaf(leaf)"
                data-testid="alarm-leaf-online-value"
                :data-node-id="leaf.id"
                :model-value="leaf.compare.values[0]"
                :disabled="readonly"
                required
                class="h-9 w-24"
                :class="controlIssueClass(leaf.id, 'compareValue')"
                :aria-invalid="hasControlIssue(leaf.id, 'compareValue')"
                :options="onlineValueOptions"
                @update:model-value="updateLeaf(criterion, leaf.id, { compare: { ...leaf.compare, values: [String($event)] } })"
              />

              <Input
                v-else-if="requiresScalarCompareForLeaf(leaf) && leaf.compare.termType === 'in'"
                data-testid="alarm-leaf-compare-value"
                :data-node-id="leaf.id"
                :model-value="leaf.compare.values.join('，')"
                :disabled="readonly"
                required
                class="h-9 min-w-40"
                :class="controlIssueClass(leaf.id, 'compareValue')"
                :aria-invalid="hasControlIssue(leaf.id, 'compareValue')"
                placeholder="多个值用逗号分隔"
                @update:model-value="onListValuesChange(criterion, leaf, String($event))"
              />

              <Input
                v-else-if="requiresScalarCompareForLeaf(leaf)"
                data-testid="alarm-leaf-compare-value"
                :data-node-id="leaf.id"
                :model-value="leaf.compare.values[0]"
                :disabled="readonly"
                required
                class="h-9 w-24"
                :class="controlIssueClass(leaf.id, 'compareValue')"
                :aria-invalid="hasControlIssue(leaf.id, 'compareValue')"
                :placeholder="leaf.compare.termType === 'btw' ? '起始值' : '比较值'"
                @update:model-value="
                  updateLeaf(criterion, leaf.id, {
                    compare: { ...leaf.compare, values: [String($event), ...(leaf.compare.termType === 'btw' ? [leaf.compare.values[1] ?? ''] : [])] },
                  })
                "
              />

              <span v-if="requiresScalarCompareForLeaf(leaf) && leaf.compare.termType === 'btw'" class="text-muted-foreground text-xs">至</span>
              <Input
                v-if="requiresScalarCompareForLeaf(leaf) && leaf.compare.termType === 'btw'"
                data-testid="alarm-leaf-compare-end"
                :data-node-id="leaf.id"
                :model-value="leaf.compare.values[1]"
                :disabled="readonly"
                required
                class="h-9 w-24"
                :class="controlIssueClass(leaf.id, 'compareValue')"
                :aria-invalid="hasControlIssue(leaf.id, 'compareValue')"
                placeholder="结束值"
                @update:model-value="updateLeaf(criterion, leaf.id, { compare: { ...leaf.compare, values: [leaf.compare.values[0] ?? '', String($event)] } })"
              />

              <span class="text-muted-foreground text-xs">
                {{ findField(leaf.dataID)?.unit ?? '' }}
              </span>

              <div v-if="advanced" class="bg-border mx-2 h-4 w-px"></div>

              <span v-if="advanced" class="text-muted-foreground text-xs">统计周期</span>
              <Input
                v-if="advanced"
                data-testid="alarm-leaf-period"
                :data-node-id="leaf.id"
                :model-value="leaf.period"
                :disabled="readonly"
                type="number"
                min="1"
                class="h-9 w-20"
                :class="controlIssueClass(leaf.id, 'period')"
                :aria-invalid="hasControlIssue(leaf.id, 'period')"
                placeholder="秒"
                @update:model-value="updateLeaf(criterion, leaf.id, { period: Number($event) })"
              />
              <span v-if="advanced" class="text-muted-foreground text-xs">秒</span>

              <AlarmSelect
                v-if="advanced"
                data-testid="alarm-leaf-aggregate"
                :data-node-id="leaf.id"
                :model-value="leaf.aggregateMethod"
                :disabled="readonly"
                class="h-9 w-24"
                :options="aggregateOptions(leaf)"
                @update:model-value="onAggregateChange(criterion, leaf, $event as NonNullable<LeafCondition['aggregateMethod']>)"
              />

              <span v-if="advanced" class="text-muted-foreground text-xs">持续</span>
              <Input
                v-if="advanced"
                data-testid="alarm-leaf-continue-period"
                :data-node-id="leaf.id"
                :model-value="leaf.continuePeriod"
                :disabled="readonly"
                type="number"
                min="1"
                class="h-9 w-16"
                :class="controlIssueClass(leaf.id, 'continuePeriod')"
                :aria-invalid="hasControlIssue(leaf.id, 'continuePeriod')"
                placeholder="周期数"
                @update:model-value="updateLeaf(criterion, leaf.id, { continuePeriod: Number($event) })"
              />
              <span v-if="advanced" class="text-muted-foreground text-xs">个周期</span>

              <LeafFilterEditor
                v-if="leaf.sourceType === 'event' || leaf.sourceType === 'action'"
                :fields="findField(leaf.dataID)?.children"
                :invalid="hasControlIssue(leaf.id, 'filter')"
                :readonly="readonly"
                :terms="leaf.compare.terms"
                @update:terms="updateLeaf(criterion, leaf.id, { compare: { ...leaf.compare, terms: $event } })"
              />

              <div v-if="!readonly" class="ml-auto flex items-center gap-1">
                <Button size="xs" variant="ghost" :disabled="lIdx === 0" @click="moveLeafInPlain(criterion, lIdx, -1)">↑</Button>
                <Button size="xs" variant="ghost" :disabled="lIdx === criterion.plain.leaves.length - 1" @click="moveLeafInPlain(criterion, lIdx, 1)">
                  ↓
                </Button>
                <Button class="text-destructive" size="xs" variant="ghost" @click="removeLeaf(criterion, leaf.id)">×</Button>
              </div>
            </div>
          </TransitionGroup>

          <Button v-if="!readonly" class="mt-2 h-auto px-1 py-1" size="xs" variant="link" @click="addChildCriterion(criterion, 'plain')">
            ＋ 添加同级条件
          </Button>
        </template>

        <!-- 持续时长 -->
        <template v-else-if="criterion.type === 'duration' && criterion.duration">
          <div class="mb-3 flex items-center justify-between text-sm font-medium">
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground text-xs">判据 {{ String(cIdx + 1).padStart(2, '0') }}</span>
              <span>持续时长</span>
            </div>
            <div v-if="!readonly" class="flex items-center gap-2">
              <Button size="xs" variant="outline" :disabled="cIdx === 0" @click="moveCriterion(cIdx, -1)">↑</Button>
              <Button size="xs" variant="outline" :disabled="cIdx === trigger.criteria.length - 1" @click="moveCriterion(cIdx, 1)"> ↓ </Button>
              <Button class="text-destructive" size="xs" variant="ghost" @click="removeCriterionFromTrigger(criterion.id)"> 删除 </Button>
            </div>
          </div>
          <div class="mb-2 flex items-center gap-2 text-sm">
            <span>
              持续
              <span class="text-destructive" aria-label="必填">*</span>
            </span>
            <Input
              data-testid="alarm-duration-seconds"
              :model-value="criterion.duration.windowSeconds"
              :disabled="readonly"
              type="number"
              min="1"
              class="h-9 w-24"
              :class="controlIssueClass(criterion.id, 'windowSeconds')"
              :aria-invalid="hasControlIssue(criterion.id, 'windowSeconds')"
              @update:model-value="updateCriterionInTrigger({ ...criterion, duration: { ...criterion.duration, windowSeconds: Number($event) } })"
            />
            <span>秒</span>
          </div>
          <div class="border-border mt-3 border-l-2 py-1 pl-4">
            <div class="text-muted-foreground mb-1 text-xs">子判据</div>
            <StepConditionNode
              :criterion="criterion.duration.child"
              :trigger="trigger"
              :schema="schema"
              :readonly="readonly"
              :advanced="advanced"
              :issues="issues"
              :allowed-types="allowedCriterionChildren('duration')"
              @update="updateCriterionInTrigger"
            />
          </div>
        </template>

        <!-- k-of-n -->
        <template v-else-if="criterion.type === 'kOfN' && criterion.kOfN">
          <div class="mb-3 flex items-center justify-between text-sm font-medium">
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground text-xs">判据 {{ String(cIdx + 1).padStart(2, '0') }}</span>
              <span>K-of-N</span>
            </div>
            <div v-if="!readonly" class="flex items-center gap-2">
              <Button size="xs" variant="outline" :disabled="cIdx === 0" @click="moveCriterion(cIdx, -1)">↑</Button>
              <Button size="xs" variant="outline" :disabled="cIdx === trigger.criteria.length - 1" @click="moveCriterion(cIdx, 1)"> ↓ </Button>
              <Button class="text-destructive" size="xs" variant="ghost" @click="removeCriterionFromTrigger(criterion.id)"> 删除 </Button>
            </div>
          </div>
          <div class="mb-2 flex items-center gap-2 text-sm">
            <span>
              最近
              <span class="text-destructive" aria-label="必填">*</span>
            </span>
            <Input
              data-testid="alarm-kofn-threshold"
              :model-value="criterion.kOfN.threshold"
              :disabled="readonly"
              type="number"
              min="1"
              :max="criterion.kOfN.children.length"
              class="h-9 w-16"
              :class="controlIssueClass(criterion.id, 'threshold')"
              :aria-invalid="hasControlIssue(criterion.id, 'threshold')"
              @update:model-value="updateCriterionInTrigger({ ...criterion, kOfN: { ...criterion.kOfN, threshold: Number($event) } })"
            />
            <span>次满足，共</span>
            <Input :model-value="criterion.kOfN.children.length" readonly class="h-9 w-16" />
            <span>个条件</span>
          </div>
          <div class="border-border mt-3 divide-y border-l-2 pl-4">
            <div v-for="(child, childIdx) in criterion.kOfN.children" :key="child.id" class="py-2">
              <div class="mb-1 flex items-center justify-between gap-2">
                <span class="text-muted-foreground text-xs">子判据 {{ childIdx + 1 }}</span>
                <Button
                  v-if="!readonly"
                  class="text-destructive"
                  size="xs"
                  variant="ghost"
                  :disabled="criterion.kOfN.children.length <= 1"
                  @click="removeKOfNChild(criterion, child.id)"
                >
                  删除子判据
                </Button>
              </div>
              <StepConditionNode
                :criterion="child"
                :trigger="trigger"
                :schema="schema"
                :readonly="readonly"
                :advanced="advanced"
                :issues="issues"
                :allowed-types="allowedCriterionChildren('kOfN')"
                @update="updateCriterionInTrigger"
              />
            </div>
          </div>
          <Button v-if="!readonly" class="mt-2 h-auto px-1 py-1" size="xs" variant="link" @click="addChildCriterion(criterion, 'plain')">
            ＋ 添加子判据
          </Button>
        </template>

        <!-- 滚动聚合 -->
        <template v-else-if="criterion.type === 'rollingAggregate' && criterion.rollingAggregate">
          <div class="mb-3 flex items-center justify-between text-sm font-medium">
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground text-xs">判据 {{ String(cIdx + 1).padStart(2, '0') }}</span>
              <span>滚动聚合</span>
            </div>
            <div v-if="!readonly" class="flex items-center gap-2">
              <Button size="xs" variant="outline" :disabled="cIdx === 0" @click="moveCriterion(cIdx, -1)">↑</Button>
              <Button size="xs" variant="outline" :disabled="cIdx === trigger.criteria.length - 1" @click="moveCriterion(cIdx, 1)"> ↓ </Button>
              <Button class="text-destructive" size="xs" variant="ghost" @click="removeCriterionFromTrigger(criterion.id)"> 删除 </Button>
            </div>
          </div>
          <div class="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span>
              窗口
              <span class="text-destructive" aria-label="必填">*</span>
            </span>
            <Input
              data-testid="alarm-rolling-window"
              :model-value="criterion.rollingAggregate.windowSeconds"
              :disabled="readonly"
              type="number"
              min="1"
              class="h-9 w-20"
              :class="controlIssueClass(criterion.id, 'windowSeconds')"
              :aria-invalid="hasControlIssue(criterion.id, 'windowSeconds')"
              @update:model-value="
                updateCriterionInTrigger({ ...criterion, rollingAggregate: { ...criterion.rollingAggregate, windowSeconds: Number($event) } })
              "
            />
            <span>秒</span>
            <AlarmSelect
              data-testid="alarm-rolling-aggregate"
              :model-value="criterion.rollingAggregate.aggregate"
              :disabled="readonly"
              class="h-9 w-24"
              :class="controlIssueClass(criterion.id, 'aggregate')"
              :aria-invalid="hasControlIssue(criterion.id, 'aggregate')"
              :options="rollingAggregateOptions"
              @update:model-value="
                updateCriterionInTrigger({ ...criterion, rollingAggregate: { ...criterion.rollingAggregate, aggregate: $event as 'avg' | 'max' | 'min' } })
              "
            />
            <span>
              阈值
              <span class="text-destructive" aria-label="必填">*</span>
            </span>
            <Input
              data-testid="alarm-rolling-threshold"
              :model-value="criterion.rollingAggregate.threshold"
              :disabled="readonly"
              type="number"
              class="h-9 w-20"
              @update:model-value="updateCriterionInTrigger({ ...criterion, rollingAggregate: { ...criterion.rollingAggregate, threshold: Number($event) } })"
            />
            <AlarmSelect
              data-testid="alarm-rolling-compare"
              :model-value="criterion.rollingAggregate.cmp"
              :disabled="readonly"
              class="h-9 w-24"
              :options="rollingCompareOptions"
              @update:model-value="
                updateCriterionInTrigger({
                  ...criterion,
                  rollingAggregate: { ...criterion.rollingAggregate, cmp: $event as LeafCondition['compare']['termType'] },
                })
              "
            />
          </div>
          <div class="border-border mt-3 border-l-2 py-1 pl-4">
            <div class="text-muted-foreground mb-1 text-xs">子判据</div>
            <StepConditionNode
              :criterion="criterion.rollingAggregate.child"
              :trigger="trigger"
              :schema="schema"
              :readonly="readonly"
              :advanced="advanced"
              selector-only
              :issues="issues"
              :allowed-types="allowedCriterionChildren('rollingAggregate')"
              @update="updateCriterionInTrigger"
            />
          </div>
        </template>

        <!-- 频率 -->
        <template v-else-if="criterion.type === 'frequency' && criterion.frequency">
          <div class="mb-3 flex items-center justify-between text-sm font-medium">
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground text-xs">判据 {{ String(cIdx + 1).padStart(2, '0') }}</span>
              <span>持续次数</span>
            </div>
            <div v-if="!readonly" class="flex items-center gap-2">
              <Button size="xs" variant="outline" :disabled="cIdx === 0" @click="moveCriterion(cIdx, -1)">↑</Button>
              <Button size="xs" variant="outline" :disabled="cIdx === trigger.criteria.length - 1" @click="moveCriterion(cIdx, 1)"> ↓ </Button>
              <Button class="text-destructive" size="xs" variant="ghost" @click="removeCriterionFromTrigger(criterion.id)"> 删除 </Button>
            </div>
          </div>
          <div class="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span>
              窗口
              <span class="text-destructive" aria-label="必填">*</span>
            </span>
            <Input
              data-testid="alarm-frequency-window"
              :model-value="criterion.frequency.windowSeconds"
              :disabled="readonly"
              type="number"
              min="1"
              class="h-9 w-20"
              :class="controlIssueClass(criterion.id, 'windowSeconds')"
              :aria-invalid="hasControlIssue(criterion.id, 'windowSeconds')"
              @update:model-value="updateCriterionInTrigger({ ...criterion, frequency: { ...criterion.frequency, windowSeconds: Number($event) } })"
            />
            <span>
              秒内满足
              <span class="text-destructive" aria-label="必填">*</span>
            </span>
            <Input
              data-testid="alarm-frequency-times"
              :model-value="criterion.frequency.times"
              :disabled="readonly"
              type="number"
              min="1"
              class="h-9 w-16"
              :class="controlIssueClass(criterion.id, 'times')"
              :aria-invalid="hasControlIssue(criterion.id, 'times')"
              @update:model-value="updateCriterionInTrigger({ ...criterion, frequency: { ...criterion.frequency, times: Number($event) } })"
            />
            <span>次</span>
          </div>
          <div class="border-border mt-3 border-l-2 py-1 pl-4">
            <div class="text-muted-foreground mb-1 text-xs">子判据</div>
            <StepConditionNode
              :criterion="criterion.frequency.child"
              :trigger="trigger"
              :schema="schema"
              :readonly="readonly"
              :advanced="advanced"
              :issues="issues"
              :allowed-types="allowedCriterionChildren('frequency')"
              @update="updateCriterionInTrigger"
            />
          </div>
        </template>
      </div>
    </TransitionGroup>

    <!-- 添加判据工具栏 -->
    <div v-if="!readonly" class="border-border bg-muted/10 flex flex-wrap items-center gap-2 border-t px-4 py-3">
      <span class="text-muted-foreground text-xs">添加判据：</span>
      <Button
        v-for="type in advanced ? criterionTypeOptions : criterionTypeOptions.filter((item) => item === 'plain')"
        :key="type"
        size="xs"
        variant="outline"
        :class="isCriterionUnavailable(type) ? 'cursor-not-allowed opacity-40' : ''"
        :disabled="isCriterionUnavailable(type)"
        :data-testid="`alarm-add-criterion-${type}`"
        :title="isCriterionUnavailable(type) ? '当前告警来源没有可用于滚动聚合的属性字段' : ''"
        @click="addCriterion(type)"
      >
        {{ { plain: '普通条件', duration: '持续时长', kOfN: 'k-of-n', rollingAggregate: '滚动聚合', frequency: '持续次数' }[type] }}
      </Button>
    </div>
  </section>
</template>

<style scoped>
/* 排序时由 TransitionGroup 使用 FLIP 同步移动交换双方，并以主色侧边线提示参与交换的项目。 */
.condition-swap-move {
  position: relative;
  z-index: 1;
  box-shadow: inset 2px 0 0 var(--primary);
  transition:
    transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 160ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .condition-swap-move {
    box-shadow: none;
    transition-duration: 0.01ms;
  }
}
</style>
