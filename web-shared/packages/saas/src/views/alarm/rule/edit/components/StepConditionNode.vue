<script setup lang="ts">
/**
 * 文件说明：嵌套子判据编辑器。
 * 负责持续时长、K-of-N、滚动聚合和持续次数内部普通条件的字段、比较值与统计参数编辑。
 */
import type { AlarmRuleIssue } from '../../../composables/useAlarmRuleValidation';
import type {
  AlarmObjectSchema,
  Criterion,
  CriterionType,
  LeafCondition,
  SchemaField,
  Trigger,
} from '../../../types/alarm-v2.types';

import { computed } from 'vue';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Input } from '@unitedrhino/saas-ui/ui/input';

import AlarmSelect from '../../../components/AlarmSelect.vue';
import {
  arrayContextOf,
  arrayMemberOptions,
  arrayPointOptions,
  buildArrayLeafPatch,
} from '../../../composables/useAlarmArrayLeaf';
import LeafFilterEditor from '../../../components/LeafFilterEditor.vue';
import {
  aggregateOptionsForField,
  allowedCriterionChildren,
  compareOptionsForField,
  compareOptionsForSource,
  defaultAggregateForField,
  defaultCompareForField,
  isNumericPropertyField,
  requiresScalarCompare,
  sourceTypeOptionsFromCapabilities,
  usesOnlineStateCompare,
} from '../../../composables/useAlarmCapabilities';

/** logicOptions 定义普通条件内部的逻辑关系。 */
const logicOptions = [
  { label: 'AND', value: 'and' },
  { label: 'OR', value: 'or' },
];

/** onlineValueOptions 定义在线状态的可比较值。 */
const onlineValueOptions = [
  { label: '离线', value: 'offline' },
  { label: '在线', value: 'online' },
];

const props = defineProps<{
  /** 当前父判据允许选择的直接子判据类型；未提供时不展示类型切换。 */
  allowedTypes?: CriterionType[];
  /** 是否展示统计周期、聚合方式和持续周期数。 */
  advanced?: boolean;
  /** 当前嵌套子判据；复杂判据当前只允许包含普通条件。 */
  criterion: Criterion;
  /** 当前表单校验问题，用于标识具体的嵌套控件。 */
  issues?: AlarmRuleIssue[];
  /** 是否禁止编辑。 */
  readonly?: boolean;
  /** 滚动聚合内部只允许选择一个原始数值属性，不展示叶子自己的判断参数。 */
  selectorOnly?: boolean;
  /** 告警来源提供的真实物模型字段及内置在线状态字段。 */
  schema: AlarmObjectSchema;
  /** 子判据所属的触发条件。 */
  trigger: Trigger;
}>();

const emit = defineEmits<{
  /** 子判据任一字段变化时提交完整的新判据，避免直接修改父组件状态。 */
  (e: 'update', value: Criterion): void;
}>();

/** 汇总当前告警来源允许选择的全部字段。 */
const schemaFields = computed<SchemaField[]>(() => [
  ...(props.selectorOnly
    ? props.schema.metricFields.filter((field) => isNumericPropertyField(field))
    : [
        ...props.schema.metricFields,
        ...props.schema.eventFields,
        ...props.schema.actionFields,
        ...props.schema.onlineFields,
      ]),
]);

/** 判断当前子判据是否与同一 K-of-N 内的其他子判据重复。 */
const hasDuplicateIssue = computed(() => props.issues?.some((issue) => issue.nodeId === props.criterion.id && issue.control === 'duplicate') ?? false);

/** 根据物模型标识查找字段展示信息。 */
function findField(dataID?: string): SchemaField | undefined {
  return schemaFields.value.find((field) => field.dataID === dataID);
}

/** 判断指定数据源类型是否没有真实可选字段。 */
function isSourceTypeUnavailable(sourceType: LeafCondition['sourceType']): boolean {
  return !schemaFields.value.some((field) => field.sourceType === sourceType);
}

/** sourceTypeOptions 标识当前来源没有真实字段的禁用数据源类型。 */
const sourceTypeOptions = computed(() =>
  sourceTypeOptionsFromCapabilities().map((item) => ({
    ...item,
    disabled: isSourceTypeUnavailable(item.value),
  })),
);

/** compareOptions 返回当前叶子数据源允许的比较符。 */
function compareOptions(leaf: LeafCondition) {
  const ctx = arrayCtxOf(leaf);
  const memberValueType = ctx?.memberValueType as SchemaField['valueType'] | undefined;
  if (memberValueType) {
    return compareOptionsForField(leaf.sourceType, memberValueType, leaf.aggregateMethod);
  }
  return compareOptionsForField(
    leaf.sourceType,
    findField(leaf.dataID)?.valueType,
    leaf.aggregateMethod,
  );
}

/** arrayFieldOf 按字段路径前缀匹配叶子对应的数组属性字段（dataID 点分路径）。 */
function arrayFieldOf(leaf: LeafCondition): SchemaField | undefined {
  return arrayContextOf(schemaFields.value, leaf)?.field;
}

/** fieldOptions 返回当前叶子可选字段，并保留历史失效字段用于展示。 */
function fieldOptions(leaf: LeafCondition) {
  const options = schemaFields.value
    .filter((item) => item.sourceType === leaf.sourceType)
    .map((field) => ({ label: field.name, value: field.dataID }));
  // 数组属性选完点位后 dataID 为拼接路径（属性.点位[.成员]），可前缀匹配回字段，不算失效
  if (leaf.dataID && !findField(leaf.dataID)) {
    // 数组属性拼接路径（属性.点位[.成员]）：显示原字段名（含点位信息），不算失效
    const arrayField = arrayFieldOf(leaf);
    options.unshift({
      label: arrayField ? (leaf.dataName || arrayField.name) : `${leaf.dataName || leaf.dataID}（已失效）`,
      value: leaf.dataID,
    });
  }
  return options;
}

/** 判断叶子条件的指定控件是否存在阻断性问题。 */
function hasControlIssue(nodeId: string, control: AlarmRuleIssue['control']): boolean {
  return props.issues?.some((issue) => issue.nodeId === nodeId && issue.control === control) ?? false;
}

/** 为校验失败的输入控件提供一致的错误边框。 */
function controlIssueClass(nodeId: string, control: AlarmRuleIssue['control']): string {
  return hasControlIssue(nodeId, control) ? '!border-destructive ring-destructive/20 ring-1 focus:ring-destructive/30' : '';
}

/** 向父组件提交普通子判据的新值。 */
function updatePlain(patch: NonNullable<Criterion['plain']>): void {
  emit('update', { ...props.criterion, plain: patch });
}

/** 更新一条叶子条件并提交完整子判据。 */
function updateLeaf(leafId: string, patch: Partial<LeafCondition>): void {
  if (!props.criterion.plain || props.readonly) return;
  const leaves = props.criterion.plain.leaves.map((leaf) => (leaf.id === leafId ? { ...leaf, ...patch } : leaf));
  updatePlain({ ...props.criterion.plain, leaves });
}

/** 切换数据源时选择该来源的第一个字段，并重置为适配的比较方式。 */
function onSourceTypeChange(leaf: LeafCondition, sourceType: LeafCondition['sourceType']): void {
  const field = schemaFields.value.find((item) => item.sourceType === sourceType);
  const aggregateMethod = defaultAggregateForField(sourceType, field?.valueType);
  updateLeaf(leaf.id, {
    sourceType,
    dataID: field?.dataID,
    dataName: field?.name,
    compare: sourceType === 'online'
      ? { termType: 'eq', values: ['offline'] }
      : {
          termType: defaultCompareForField(sourceType, field?.valueType, aggregateMethod),
          values: [''],
        },
    aggregateMethod,
  });
}

/** 切换监控字段时同步字段名称和来源类型。 */
function onFieldChange(leaf: LeafCondition, dataID: string): void {
  const field = findField(dataID);
  // 数组属性必须继续选择点位：dataID 置尾点占位（属性.），触发"尚未选择数组点位"必填校验
  const resolvedDataID = field?.valueType === 'array' ? `${dataID}.` : dataID;
  const allowedAggregates = aggregateOptionsForField(
    field?.sourceType ?? leaf.sourceType,
    field?.valueType,
  );
  const aggregateMethod = allowedAggregates.some((item) => item.value === leaf.aggregateMethod)
    ? leaf.aggregateMethod
    : defaultAggregateForField(field?.sourceType ?? leaf.sourceType, field?.valueType);
  const sourceType = field?.sourceType ?? leaf.sourceType;
  updateLeaf(leaf.id, {
    dataID: resolvedDataID,
    dataName: field?.name,
    sourceType,
    compare: {
      termType: defaultCompareForField(sourceType, field?.valueType, aggregateMethod),
      terms: [],
      values: [''],
    },
    aggregateMethod: props.selectorOnly ? undefined : aggregateMethod,
    continuePeriod: props.selectorOnly ? undefined : leaf.continuePeriod,
    period: props.selectorOnly ? undefined : leaf.period,
  });
}

/** arrayCtxOf 返回当前叶子若为数组属性时的级联上下文（含点位/成员反解）。 */
function arrayCtxOf(leaf: LeafCondition) {
  return arrayContextOf(schemaFields.value, leaf);
}

/** onArrayPointChange 点位切换：拼 dataID 并按元素/成员类型重置比较与聚合。 */
function onArrayPointChange(leaf: LeafCondition, pointStr: string) {
  const ctx = arrayCtxOf(leaf);
  if (!ctx) return;
  const patch = buildArrayLeafPatch(ctx, Number(pointStr));
  updateLeaf(leaf.id, {
    ...patch,
    compare: {
      termType: defaultCompareForField('property', patch.memberValueType as SchemaField["valueType"], defaultAggregateForField("property", patch.memberValueType as SchemaField["valueType"])),
      terms: [],
      values: [''],
    },
    aggregateMethod: props.selectorOnly ? undefined : defaultAggregateForField("property", patch.memberValueType as SchemaField["valueType"]),
  } as Partial<LeafCondition>);
}

/** onArrayMemberChange 成员切换（结构体数组）：保留点位，按成员类型重置比较与聚合。 */
function onArrayMemberChange(leaf: LeafCondition, member: string) {
  const ctx = arrayCtxOf(leaf);
  if (!ctx?.hasPoint) return;
  const patch = buildArrayLeafPatch(ctx, ctx.point!, member || undefined);
  updateLeaf(leaf.id, {
    ...patch,
    compare: {
      termType: defaultCompareForField('property', patch.memberValueType as SchemaField["valueType"], defaultAggregateForField("property", patch.memberValueType as SchemaField["valueType"])),
      terms: [],
      values: [''],
    },
    aggregateMethod: props.selectorOnly ? undefined : defaultAggregateForField("property", patch.memberValueType as SchemaField["valueType"]),
  } as Partial<LeafCondition>);
}

/** aggregateOptions 返回当前嵌套叶子与后端一致的聚合选项。 */
function aggregateOptions(leaf: LeafCondition) {
  const ctx = arrayCtxOf(leaf);
  const memberValueType = ctx?.memberValueType as SchemaField['valueType'] | undefined;
  if (memberValueType) {
    return aggregateOptionsForField(leaf.sourceType, memberValueType);
  }
  return aggregateOptionsForField(leaf.sourceType, findField(leaf.dataID)?.valueType);
}

/** requiresScalarCompareForLeaf 判断当前窗口结果是否需要标量阈值。 */
function requiresScalarCompareForLeaf(leaf: LeafCondition): boolean {
  return requiresScalarCompare(leaf.sourceType, leaf.aggregateMethod);
}

/** usesOnlineStateCompareForLeaf 判断当前叶子是否比较窗口末在线状态。 */
function usesOnlineStateCompareForLeaf(leaf: LeafCondition): boolean {
  return usesOnlineStateCompare(leaf.sourceType, leaf.aggregateMethod);
}

/** onAggregateChange 切换聚合时重置为匹配的状态枚举或标量比较。 */
function onAggregateChange(
  leaf: LeafCondition,
  aggregateMethod: NonNullable<LeafCondition['aggregateMethod']>,
): void {
  const wasScalar = requiresScalarCompareForLeaf(leaf);
  const nextUsesOnlineState = usesOnlineStateCompare(
    leaf.sourceType,
    aggregateMethod,
  );
  const nextRequiresScalar = requiresScalarCompare(
    leaf.sourceType,
    aggregateMethod,
  );
  const nextCompare = defaultCompareForField(
    leaf.sourceType,
    findField(leaf.dataID)?.valueType,
    aggregateMethod,
  );
  const currentAllowed = compareOptionsForField(
    leaf.sourceType,
    findField(leaf.dataID)?.valueType,
    aggregateMethod,
  ).some((item) => item.value === leaf.compare.termType);
  updateLeaf(leaf.id, {
    aggregateMethod,
    compare: nextUsesOnlineState
      ? { termType: 'eq', values: ['offline'] }
      : nextRequiresScalar && (!wasScalar || !currentAllowed)
        ? { termType: nextCompare, values: [''] }
        : leaf.compare,
  });
}

/** 切换比较方式时同步比较值数量。 */
function onCompareChange(leaf: LeafCondition, termType: LeafCondition['compare']['termType']): void {
  const firstValue = leaf.compare.values[0] ?? '';
  updateLeaf(leaf.id, {
    compare: {
      ...leaf.compare,
      termType,
      values: termType === 'btw' ? [firstValue, ''] : [firstValue],
    },
  });
}

/** 更新单值或区间比较中的指定值。 */
function onCompareValueChange(leaf: LeafCondition, value: string, index = 0): void {
  const values = [...leaf.compare.values];
  values[index] = value;
  updateLeaf(leaf.id, { compare: { ...leaf.compare, values } });
}

/** 把逗号分隔输入转换成列表比较值。 */
function onListValuesChange(leaf: LeafCondition, value: string): void {
  updateLeaf(leaf.id, {
    compare: {
      ...leaf.compare,
      values: value
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    },
  });
}

/** 创建当前告警来源下可立即编辑的默认叶子条件。 */
function createLeaf(): LeafCondition {
  const field = schemaFields.value[0];
  const sourceType = field?.sourceType ?? 'property';
  const aggregateMethod = defaultAggregateForField(
    sourceType,
    field?.valueType,
  );
  return {
    id: `leaf-${Date.now()}-${props.criterion.plain?.leaves.length ?? 0}`,
    sourceType,
    dataID: field?.dataID,
    dataName: field?.name,
    compare: field?.sourceType === 'online'
      ? { termType: 'eq', values: ['offline'] }
      : {
          termType: defaultCompareForField(
            sourceType,
            field?.valueType,
            aggregateMethod,
          ),
          values: [''],
        },
    period: props.selectorOnly ? undefined : 60,
    aggregateMethod: props.selectorOnly
      ? undefined
      : aggregateMethod,
    continuePeriod: props.selectorOnly ? undefined : 1,
  };
}

/** 在当前普通子判据中新增一条同级叶子条件。 */
function addLeaf(): void {
  if (!props.criterion.plain || props.readonly) return;
  updatePlain({ ...props.criterion.plain, leaves: [...props.criterion.plain.leaves, createLeaf()] });
}

/** 删除一条叶子条件；至少保留一条以满足后端判据契约。 */
function removeLeaf(leafId: string): void {
  if (!props.criterion.plain || props.readonly || props.criterion.plain.leaves.length <= 1) return;
  updatePlain({ ...props.criterion.plain, leaves: props.criterion.plain.leaves.filter((leaf) => leaf.id !== leafId) });
}

let criterionIDCounter = 1;

/** createCriterion 创建与当前物模型和后端能力匹配的嵌套判据。 */
function createCriterion(type: CriterionType, id?: string): Criterion {
  const criterionID = id ?? `nested-${Date.now()}-${criterionIDCounter++}`;
  if (type === 'plain') {
    return {
      id: criterionID,
      type,
      plain: { logic: 'and', leaves: [createLeaf()] },
    };
  }
  if (type === 'duration') {
    return {
      id: criterionID,
      type,
      duration: { windowSeconds: 300, child: createCriterion('plain') },
    };
  }
  if (type === 'kOfN') {
    return {
      id: criterionID,
      type,
      kOfN: { threshold: 1, children: [createCriterion('plain')] },
    };
  }
  if (type === 'rollingAggregate') {
    const propertyField = props.schema.metricFields.find((field) =>
      isNumericPropertyField(field),
    );
    return {
      id: criterionID,
      type,
      rollingAggregate: {
        windowSeconds: 300,
        aggregate: 'avg',
        threshold: 0,
        cmp: 'gt',
        child: {
          id: `nested-${Date.now()}-${criterionIDCounter++}`,
          type: 'plain',
          plain: {
            logic: 'and',
            leaves: [createLeafForField(propertyField)],
          },
        },
      },
    };
  }
  return {
    id: criterionID,
    type,
    frequency: {
      windowSeconds: 300,
      times: 3,
      child: createCriterion('plain'),
    },
  };
}

/** createLeafForField 创建指定字段的默认叶子，供滚动聚合限制数值属性。 */
function createLeafForField(field?: SchemaField): LeafCondition {
  const fallback = createLeaf();
  if (!field) return fallback;
  return {
    ...fallback,
    sourceType: field.sourceType,
    dataID: field.dataID,
    dataName: field.name,
    aggregateMethod: defaultAggregateForField(field.sourceType, field.valueType),
  };
}

/** changeCriterionType 在保留节点标识的前提下切换嵌套判据类型。 */
function changeCriterionType(type: CriterionType): void {
  if (props.readonly || type === props.criterion.type) return;
  emit('update', createCriterion(type, props.criterion.id));
}

/** updateDuration 更新持续时长判据。 */
function updateDuration(patch: Partial<NonNullable<Criterion['duration']>>): void {
  if (!props.criterion.duration || props.readonly) return;
  emit('update', {
    ...props.criterion,
    duration: { ...props.criterion.duration, ...patch },
  });
}

/** updateKOfN 更新 K-of-N 判据并保持阈值不超过子判据数量。 */
function updateKOfN(patch: Partial<NonNullable<Criterion['kOfN']>>): void {
  if (!props.criterion.kOfN || props.readonly) return;
  const next = { ...props.criterion.kOfN, ...patch };
  next.threshold = Math.min(Math.max(1, next.threshold), next.children.length);
  emit('update', { ...props.criterion, kOfN: next });
}

/** updateKOfNChild 更新 K-of-N 中的一条直接子判据。 */
function updateKOfNChild(child: Criterion): void {
  if (!props.criterion.kOfN) return;
  updateKOfN({
    children: props.criterion.kOfN.children.map((item) =>
      item.id === child.id ? child : item),
  });
}

/** addKOfNChild 按后端嵌套能力增加默认子判据。 */
function addKOfNChild(): void {
  if (!props.criterion.kOfN || props.readonly) return;
  const type = allowedCriterionChildren('kOfN')[0] ?? 'plain';
  updateKOfN({
    children: [...props.criterion.kOfN.children, createCriterion(type)],
  });
}

/** removeKOfNChild 删除 K-of-N 子判据并至少保留一条。 */
function removeKOfNChild(childID: string): void {
  if (!props.criterion.kOfN || props.criterion.kOfN.children.length <= 1) return;
  updateKOfN({
    children: props.criterion.kOfN.children.filter((item) => item.id !== childID),
  });
}

/** updateRolling 更新滚动聚合判据。 */
function updateRolling(
  patch: Partial<NonNullable<Criterion['rollingAggregate']>>,
): void {
  if (!props.criterion.rollingAggregate || props.readonly) return;
  emit('update', {
    ...props.criterion,
    rollingAggregate: { ...props.criterion.rollingAggregate, ...patch },
  });
}

/** updateFrequency 更新持续次数判据。 */
function updateFrequency(patch: Partial<NonNullable<Criterion['frequency']>>): void {
  if (!props.criterion.frequency || props.readonly) return;
  emit('update', {
    ...props.criterion,
    frequency: { ...props.criterion.frequency, ...patch },
  });
}
</script>

<template>
  <div v-if="allowedTypes?.length" class="mb-2 flex items-center gap-2 text-xs">
    <span class="text-muted-foreground">子判据类型</span>
    <AlarmSelect
      data-testid="nested-criterion-type"
      :model-value="criterion.type"
      :disabled="readonly"
      class="h-8 w-28 text-xs"
      :options="allowedTypes.map((value) => ({
        label: {
          duration: '持续时长',
          frequency: '持续次数',
          kOfN: 'K-of-N',
          plain: '普通条件',
          rollingAggregate: '滚动聚合',
        }[value],
        value,
        disabled: value === 'rollingAggregate' && !schema.metricFields.some((field) => isNumericPropertyField(field)),
      }))"
      @update:model-value="changeCriterionType($event as CriterionType)"
    />
  </div>
  <div
    v-if="criterion.type === 'plain' && criterion.plain"
    class="flex flex-col gap-2 rounded-md border p-3"
    :class="hasDuplicateIssue ? 'border-destructive bg-destructive/5' : 'border-border'"
    data-testid="nested-condition-editor"
  >
    <div class="flex items-center gap-2 text-xs font-medium">
      <span>{{ selectorOnly ? '数值属性' : '普通条件' }}</span>
      <AlarmSelect
        v-if="!selectorOnly"
        :model-value="criterion.plain.logic ?? 'and'"
        :disabled="readonly"
        class="h-7 w-20 text-xs"
        :options="logicOptions"
        @update:model-value="updatePlain({ ...criterion.plain, logic: $event as 'and' | 'or' })"
      />
      <span v-if="hasDuplicateIssue" class="text-destructive">与其他子判据重复</span>
    </div>

    <div
      v-for="(leaf, leafIdx) in criterion.plain.leaves"
      :key="leaf.id"
      class="border-border flex flex-wrap items-center gap-2"
      :class="leafIdx > 0 ? 'border-t pt-2' : ''"
    >
      <AlarmSelect
        v-if="!selectorOnly"
        data-testid="nested-leaf-source"
        :model-value="leaf.sourceType"
        :disabled="readonly"
        class="h-8 w-24 text-xs"
        :options="sourceTypeOptions"
        @update:model-value="onSourceTypeChange(leaf, $event as LeafCondition['sourceType'])"
      />

      <AlarmSelect
        data-testid="nested-leaf-field"
        :model-value="leaf.dataID"
        :disabled="readonly"
        class="h-8 min-w-28 text-xs"
        :class="controlIssueClass(leaf.id, 'dataID')"
        :options="fieldOptions(leaf)"
        @update:model-value="onFieldChange(leaf, String($event))"
      />

      <template v-if="arrayCtxOf(leaf)">
        <AlarmSelect
          data-testid="nested-leaf-point"
          :model-value="arrayCtxOf(leaf)?.point === undefined ? '' : String(arrayCtxOf(leaf)?.point)"
          :disabled="readonly"
          class="h-8 w-28 text-xs"
          :class="controlIssueClass(leaf.id, 'dataID')"
          :options="arrayPointOptions(arrayCtxOf(leaf)!.field)"
          placeholder="点位"
          @update:model-value="onArrayPointChange(leaf, String($event))"
        />
        <AlarmSelect
          v-if="arrayCtxOf(leaf)!.field.arrayMeta?.struct"
          data-testid="nested-leaf-member"
          :model-value="arrayCtxOf(leaf)?.member ?? ''"
          :disabled="readonly"
          class="h-8 w-28 text-xs"
          :class="controlIssueClass(leaf.id, 'dataID')"
          :options="arrayMemberOptions(arrayCtxOf(leaf)!.field)"
          placeholder="成员"
          @update:model-value="onArrayMemberChange(leaf, String($event))"
        />
      </template>

      <AlarmSelect
        v-if="!selectorOnly && requiresScalarCompareForLeaf(leaf)"
        data-testid="nested-leaf-compare"
        :model-value="leaf.compare.termType"
        :disabled="readonly"
        class="h-8 w-24 text-xs"
        :options="compareOptions(leaf)"
        @update:model-value="onCompareChange(leaf, $event as LeafCondition['compare']['termType'])"
      />

      <AlarmSelect
        v-if="!selectorOnly && usesOnlineStateCompareForLeaf(leaf)"
        :model-value="leaf.compare.values[0]"
        :disabled="readonly"
        class="h-8 w-24 text-xs"
        :class="controlIssueClass(leaf.id, 'compareValue')"
        data-testid="nested-online-value"
        :options="onlineValueOptions"
        @update:model-value="onCompareValueChange(leaf, String($event))"
      />

      <Input
        v-else-if="!selectorOnly && requiresScalarCompareForLeaf(leaf) && leaf.compare.termType === 'in'"
        data-testid="nested-leaf-compare-value"
        :model-value="leaf.compare.values.join('，')"
        :disabled="readonly"
        class="h-8 min-w-36 text-xs"
        :class="controlIssueClass(leaf.id, 'compareValue')"
        placeholder="多个值用逗号分隔"
        @update:model-value="onListValuesChange(leaf, String($event))"
      />

      <Input
        v-else-if="!selectorOnly && requiresScalarCompareForLeaf(leaf)"
        data-testid="nested-leaf-compare-value"
        :model-value="leaf.compare.values[0]"
        :disabled="readonly"
        class="h-8 w-24 text-xs"
        :class="controlIssueClass(leaf.id, 'compareValue')"
        :placeholder="leaf.compare.termType === 'btw' ? '起始值' : '比较值'"
        @update:model-value="onCompareValueChange(leaf, String($event))"
      />

      <template v-if="!selectorOnly && requiresScalarCompareForLeaf(leaf) && leaf.compare.termType === 'btw'">
        <span class="text-muted-foreground text-xs">至</span>
        <Input
          data-testid="nested-leaf-compare-end"
          :model-value="leaf.compare.values[1]"
          :disabled="readonly"
          class="h-8 w-24 text-xs"
          :class="controlIssueClass(leaf.id, 'compareValue')"
          placeholder="结束值"
          @update:model-value="onCompareValueChange(leaf, String($event), 1)"
        />
      </template>

      <span class="text-muted-foreground text-xs">{{ findField(leaf.dataID)?.unit ?? '' }}</span>

      <template v-if="advanced && !selectorOnly">
        <span class="text-muted-foreground text-xs">统计周期</span>
        <Input
          data-testid="nested-leaf-period"
          :model-value="leaf.period"
          :disabled="readonly"
          type="number"
          min="1"
          class="h-8 w-20 text-xs"
          :class="controlIssueClass(leaf.id, 'period')"
          @update:model-value="updateLeaf(leaf.id, { period: Number($event) })"
        />
        <span class="text-muted-foreground text-xs">秒</span>
        <AlarmSelect
          data-testid="nested-leaf-aggregate"
          :model-value="leaf.aggregateMethod ?? 'last'"
          :disabled="readonly"
          class="h-8 w-24 text-xs"
          :options="aggregateOptions(leaf)"
          @update:model-value="onAggregateChange(leaf, $event as NonNullable<LeafCondition['aggregateMethod']>)"
        />
        <span class="text-muted-foreground text-xs">持续</span>
        <Input
          data-testid="nested-leaf-continue-period"
          :model-value="leaf.continuePeriod"
          :disabled="readonly"
          type="number"
          min="1"
          class="h-8 w-16 text-xs"
          :class="controlIssueClass(leaf.id, 'continuePeriod')"
          @update:model-value="updateLeaf(leaf.id, { continuePeriod: Number($event) })"
        />
        <span class="text-muted-foreground text-xs">个周期</span>
      </template>

      <LeafFilterEditor
        v-if="!selectorOnly && (leaf.sourceType === 'event' || leaf.sourceType === 'action')"
        :fields="findField(leaf.dataID)?.children"
        :invalid="hasControlIssue(leaf.id, 'filter')"
        :readonly="readonly"
        :terms="leaf.compare.terms"
        @update:terms="updateLeaf(leaf.id, { compare: { ...leaf.compare, terms: $event } })"
      />

      <Button
        v-if="!readonly && !selectorOnly"
        class="text-destructive ml-auto"
        size="xs"
        variant="ghost"
        :disabled="criterion.plain.leaves.length <= 1"
        @click="removeLeaf(leaf.id)"
      >
        删除条件
      </Button>
    </div>

    <Button v-if="!readonly && !selectorOnly" class="h-auto px-1 py-1" size="xs" variant="link" @click="addLeaf">
      ＋ 添加同级条件
    </Button>
  </div>
  <div
    v-else-if="criterion.type === 'duration' && criterion.duration"
    class="flex flex-col gap-3 rounded-md border p-3"
    data-testid="nested-duration-editor"
  >
    <div class="flex items-center gap-2 text-xs">
      <span>持续</span>
      <Input
        data-testid="nested-duration-seconds"
        :model-value="criterion.duration.windowSeconds"
        :disabled="readonly"
        type="number"
        min="1"
        class="h-8 w-24 text-xs"
        @update:model-value="updateDuration({ windowSeconds: Number($event) })"
      />
      <span>秒</span>
    </div>
    <StepConditionNode
      :criterion="criterion.duration.child"
      :trigger="trigger"
      :schema="schema"
      :readonly="readonly"
      :advanced="advanced"
      :issues="issues"
      :allowed-types="allowedCriterionChildren('duration')"
      @update="updateDuration({ child: $event })"
    />
  </div>

  <div
    v-else-if="criterion.type === 'kOfN' && criterion.kOfN"
    class="flex flex-col gap-3 rounded-md border p-3"
    data-testid="nested-kofn-editor"
  >
    <div class="flex items-center gap-2 text-xs">
      <span>满足</span>
      <Input
        data-testid="nested-kofn-threshold"
        :model-value="criterion.kOfN.threshold"
        :disabled="readonly"
        type="number"
        min="1"
        :max="criterion.kOfN.children.length"
        class="h-8 w-16 text-xs"
        @update:model-value="updateKOfN({ threshold: Number($event) })"
      />
      <span>/ {{ criterion.kOfN.children.length }} 个子判据</span>
    </div>
    <div
      v-for="child in criterion.kOfN.children"
      :key="child.id"
      class="border-border flex flex-col gap-2 border-l-2 pl-3"
    >
      <div class="flex justify-end">
        <Button
          v-if="!readonly"
          size="xs"
          variant="ghost"
          class="text-destructive"
          :disabled="criterion.kOfN.children.length <= 1"
          @click="removeKOfNChild(child.id)"
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
        @update="updateKOfNChild"
      />
    </div>
    <Button
      v-if="!readonly"
      size="xs"
      variant="link"
      class="self-start"
      @click="addKOfNChild"
    >
      ＋ 添加子判据
    </Button>
  </div>

  <div
    v-else-if="criterion.type === 'rollingAggregate' && criterion.rollingAggregate"
    class="flex flex-col gap-3 rounded-md border p-3"
    data-testid="nested-rolling-editor"
  >
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <span>窗口</span>
      <Input
        data-testid="nested-rolling-window"
        :model-value="criterion.rollingAggregate.windowSeconds"
        :disabled="readonly"
        type="number"
        min="1"
        class="h-8 w-20 text-xs"
        @update:model-value="updateRolling({ windowSeconds: Number($event) })"
      />
      <span>秒</span>
      <AlarmSelect
        data-testid="nested-rolling-aggregate"
        :model-value="criterion.rollingAggregate.aggregate"
        :disabled="readonly"
        class="h-8 w-24 text-xs"
        :options="[
          { label: '最大值', value: 'max' },
          { label: '最小值', value: 'min' },
          { label: '平均值', value: 'avg' },
        ]"
        @update:model-value="updateRolling({ aggregate: $event as 'avg' | 'max' | 'min' })"
      />
      <AlarmSelect
        data-testid="nested-rolling-compare"
        :model-value="criterion.rollingAggregate.cmp"
        :disabled="readonly"
        class="h-8 w-20 text-xs"
        :options="compareOptionsForSource('property').filter((item) => ['gt', 'gte', 'lt', 'lte'].includes(item.value))"
        @update:model-value="updateRolling({ cmp: $event as LeafCondition['compare']['termType'] })"
      />
      <span>阈值</span>
      <Input
        data-testid="nested-rolling-threshold"
        :model-value="criterion.rollingAggregate.threshold"
        :disabled="readonly"
        type="number"
        class="h-8 w-20 text-xs"
        @update:model-value="updateRolling({ threshold: Number($event) })"
      />
    </div>
    <StepConditionNode
      :criterion="criterion.rollingAggregate.child"
      :trigger="trigger"
      :schema="schema"
      :readonly="readonly"
      :advanced="advanced"
      selector-only
      :issues="issues"
      :allowed-types="allowedCriterionChildren('rollingAggregate')"
      @update="updateRolling({ child: $event })"
    />
  </div>

  <div
    v-else-if="criterion.type === 'frequency' && criterion.frequency"
    class="flex flex-col gap-3 rounded-md border p-3"
    data-testid="nested-frequency-editor"
  >
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <span>窗口</span>
      <Input
        data-testid="nested-frequency-window"
        :model-value="criterion.frequency.windowSeconds"
        :disabled="readonly"
        type="number"
        min="1"
        class="h-8 w-20 text-xs"
        @update:model-value="updateFrequency({ windowSeconds: Number($event) })"
      />
      <span>秒内满足</span>
      <Input
        data-testid="nested-frequency-times"
        :model-value="criterion.frequency.times"
        :disabled="readonly"
        type="number"
        min="1"
        class="h-8 w-16 text-xs"
        @update:model-value="updateFrequency({ times: Number($event) })"
      />
      <span>次</span>
    </div>
    <StepConditionNode
      :criterion="criterion.frequency.child"
      :trigger="trigger"
      :schema="schema"
      :readonly="readonly"
      :advanced="advanced"
      :issues="issues"
      :allowed-types="allowedCriterionChildren('frequency')"
      @update="updateFrequency({ child: $event })"
    />
  </div>
  <div v-else class="text-destructive text-xs">当前嵌套判据类型暂不支持编辑：{{ criterion.type }}</div>
</template>
