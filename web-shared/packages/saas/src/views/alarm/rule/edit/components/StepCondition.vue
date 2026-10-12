<script setup lang="ts">
/**
 * 文件说明：告警规则编辑页 Step 2 —— 触发条件可视化编辑器
 * 支持多 trigger，每个 trigger 内可嵌套普通条件、持续时长、k-of-n、滚动聚合、频率等判据。
 * 触发条件可从条件预设导入；导入后保留来源标识，用户可转换为自定义条件继续编辑。
 * 单个 Trigger 的编辑逻辑已下沉到 TriggerEditor，本文件只负责 trigger 列表管理与模板选择。
 */
import { computed, onMounted, ref, watch } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@unitedrhino/saas-ui/ui/alert';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { AlarmLevelList } from '../../../types/alarm-v2.types';
import type { AlarmLevel, AlarmTarget, ConditionTemplate, Criterion, CriterionType, LeafCondition, Trigger } from '../../../types/alarm-v2.types';
import { getConditionTemplateList } from '../../../api/alarm-condition-template.api';
import { fromConditionTemplate } from '../../../composables/useAlarmConvert';
import {
  defaultAggregateForField,
  defaultCompareForField,
} from '../../../composables/useAlarmCapabilities';
import { useAlarmSchema } from '../../../composables/useAlarmSchema';
import { summarizeTriggerConditions } from '../../../composables/useAlarmRuleValidation';
import type { AlarmRuleIssue } from '../../../composables/useAlarmRuleValidation';
import AlarmConfirmDialog from '../../../components/AlarmConfirmDialog.vue';
import AlarmSelect from '../../../components/AlarmSelect.vue';
import TriggerEditor from '../../../components/TriggerEditor.vue';
import StepOverview from './StepOverview.vue';

const props = defineProps<{
  triggers: Trigger[];
  target: AlarmTarget;
  /** 当前步骤需要展示的校验问题。 */
  issues?: AlarmRuleIssue[];
}>();

const emit = defineEmits<{
  (e: 'update:triggers', value: Trigger[]): void;
}>();

const templates = ref<ConditionTemplate[]>([]);
const loading = ref(false);
const templateToConvert = ref<Trigger | null>(null);
const { schema, loading: schemaLoading, error: schemaError, loadSchema } = useAlarmSchema();

/** 当前来源是否配置了可用于属性、事件或行为条件的真实物模型。 */
const hasModelFields = computed(() => {
  return schema.value.metricFields.length > 0 || schema.value.eventFields.length > 0 || schema.value.actionFields.length > 0;
});

async function loadTemplates() {
  loading.value = true;
  try {
    const res = await getConditionTemplateList({ page: { page: 1, size: 100 } });
    templates.value = (res.list || []).map(fromConditionTemplate);
  } finally {
    loading.value = false;
  }
}

// 目标变化时重新加载物模型
watch(
  () => ({ ...props.target }),
  () => loadSchema(props.target),
  { deep: true, immediate: true },
);

onMounted(() => {
  loadTemplates();
});

let idCounter = 1;
function newId(prefix = 'node'): string {
  return `${prefix}-${Date.now()}-${idCounter++}`;
}

function createLeaf(): LeafCondition {
  const field = schema.value.metricFields[0] ?? schema.value.eventFields[0] ?? schema.value.actionFields[0] ?? schema.value.onlineFields[0];
  const sourceType = field?.sourceType ?? 'property';
  const aggregateMethod = defaultAggregateForField(sourceType, field?.valueType);
  return {
    id: newId('leaf'),
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
    period: 60,
    aggregateMethod,
    continuePeriod: 1,
  };
}

function createCriterion(type: CriterionType): Criterion {
  const base: Criterion = { id: newId('crit'), type };
  if (type === 'plain') {
    base.plain = { logic: 'and', leaves: [createLeaf()] };
  } else if (type === 'duration') {
    base.duration = { windowSeconds: 300, child: createCriterion('plain') };
  } else if (type === 'kOfN') {
    base.kOfN = { threshold: 1, children: [createCriterion('plain')] };
  } else if (type === 'rollingAggregate') {
    base.rollingAggregate = {
      windowSeconds: 300,
      aggregate: 'avg',
      threshold: 0,
      cmp: 'gt',
      child: createCriterion('plain'),
    };
  } else if (type === 'frequency') {
    base.frequency = { windowSeconds: 300, times: 3, child: createCriterion('plain') };
  }
  return base;
}

const triggersModel = computed({
  get: () => props.triggers,
  set: (val) => emit('update:triggers', val),
});

/** 返回尚未被条件组占用的告警级别，新增入口和默认值共用这一事实来源。 */
const availableTriggerLevels = computed<AlarmLevel[]>(() => {
  const usedLevels = new Set(triggersModel.value.map((trigger) => trigger.level));
  return AlarmLevelList.map((level) => level.value).filter((level) => !usedLevels.has(level));
});

/** addConditionOptions 组合自定义条件和真实条件预设。 */
const addConditionOptions = computed(() => [
  { label: '自定义条件', value: 'custom' },
  ...templates.value.map((template) => ({
    label: `从条件预设导入：${template.name}`,
    value: template.id,
  })),
]);

/** 为新增条件组领取一个有效级别；首组优先使用重要级别，后续使用剩余级别。 */
function nextTriggerLevel(): AlarmLevel | undefined {
  if (availableTriggerLevels.value.includes('major')) return 'major';
  return availableTriggerLevels.value[0];
}

function createTrigger(level: AlarmLevel): Trigger {
  return {
    id: newId('trigger'),
    type: 'and',
    level,
    criteria: [createCriterion('plain')],
  };
}

/** 从条件预设复制触发条件并记录来源；预设不携带级别，规则中由用户自行填写。 */
function createTriggerFromTemplate(tpl: ConditionTemplate, level: AlarmLevel): Trigger {
  return {
    ...tpl.trigger,
    id: newId('trigger'),
    level,
    templateID: tpl.id,
    templateName: tpl.name,
  };
}

/** 判断触发条件是否来自模板并处于锁定状态 */
function isTemplateLocked(trigger: Trigger): boolean {
  return !!trigger.templateID;
}

/** requestTemplateConversion 打开解除条件模板关联的确认弹窗。 */
function requestTemplateConversion(trigger: Trigger) {
  if (trigger.templateID) templateToConvert.value = trigger;
}

/** onConversionDialogOpenChange 在取消确认时清理待转换条件。 */
function onConversionDialogOpenChange(open: boolean) {
  if (!open) templateToConvert.value = null;
}

/** confirmTemplateConversion 将已确认的模板条件转换为普通自定义条件。 */
function confirmTemplateConversion() {
  const trigger = templateToConvert.value;
  if (!trigger) return;
  templateToConvert.value = null;
  const converted: Trigger = {
    ...trigger,
    templateID: undefined,
    templateName: undefined,
  };
  updateTrigger(converted);
}

function addCustomTrigger() {
  const level = nextTriggerLevel();
  if (!level) return;
  triggersModel.value = [...triggersModel.value, createTrigger(level)];
}

/** 来源和物模型加载完成后为新规则准备一条最小条件，减少空白页学习成本。 */
watch(
  () => [
    schemaLoading.value,
    schema.value.metricFields.length,
    schema.value.eventFields.length,
    schema.value.actionFields.length,
    schema.value.onlineFields.length,
  ],
  () => {
    if (schemaLoading.value || schemaError.value) return;
    const hasSource = props.target.targetKind === 'product' ? !!props.target.productID : !!props.target.categoryID;
    if (hasSource && !triggersModel.value.length) addCustomTrigger();
  },
  { immediate: true },
);

function addTriggerFromTemplate(tpl: ConditionTemplate) {
  const level = nextTriggerLevel();
  if (!level) return;
  triggersModel.value = [...triggersModel.value, createTriggerFromTemplate(tpl, level)];
}

/** onAddCondition 根据 shadcn 选择器结果新增自定义条件或导入预设。 */
function onAddCondition(value: number | string) {
  if (value === 'custom') {
    addCustomTrigger();
    return;
  }
  const template = templates.value.find((item) => item.id === value);
  if (template) addTriggerFromTemplate(template);
}

function removeTrigger(idx: number) {
  const list = [...triggersModel.value];
  list.splice(idx, 1);
  triggersModel.value = list;
}

function moveTrigger(idx: number, dir: -1 | 1) {
  const list = [...triggersModel.value];
  const target = idx + dir;
  if (target < 0 || target >= list.length) return;
  const tmp = list[idx]!;
  list[idx] = list[target]!;
  list[target] = tmp;
  triggersModel.value = list;
}

function updateTrigger(trigger: Trigger) {
  triggersModel.value = triggersModel.value.map((t) => (t.id === trigger.id ? trigger : t));
}

/** 返回其他条件组已经占用的告警级别，避免前端创建后端必然拒绝的重复绑定。 */
function unavailableTriggerLevels(triggerId: string): Trigger['level'][] {
  return triggersModel.value.filter((trigger) => trigger.id !== triggerId).map((trigger) => trigger.level);
}

/** 把当前条件组合成一句可读说明（共享 summarizeTriggerConditions），帮助用户即时核对含义。 */
const conditionSummary = computed(() => summarizeTriggerConditions(triggersModel.value));
</script>

<template>
  <div class="flex flex-col gap-5">
    <StepOverview
      title="配置告警触发条件"
      description="选择监控字段、判断方式和阈值；需要时再配置统计窗口、K/N 或复杂组合。"
      summary-label="当前规则"
      :summary="conditionSummary"
      data-testid="condition-overview"
    >
      <template #status>
        <Alert v-if="schemaLoading">
          <AlertTitle>正在加载物模型</AlertTitle>
          <AlertDescription>正在读取当前告警来源可用的属性、事件和行为。</AlertDescription>
        </Alert>
        <Alert v-else-if="schemaError" variant="destructive">
          <AlertTitle>无法读取物模型</AlertTitle>
          <AlertDescription>物模型加载失败：{{ schemaError }}</AlertDescription>
        </Alert>
        <Alert v-else-if="!hasModelFields">
          <AlertTitle>当前告警来源未配置属性、事件或行为物模型</AlertTitle>
          <AlertDescription>仅可使用在线状态条件；如需属性、事件或行为条件，请先完善产品物模型。</AlertDescription>
        </Alert>
      </template>
    </StepOverview>

    <!-- Trigger 列表 -->
    <TransitionGroup name="trigger-swap" tag="div" class="flex flex-col gap-4">
      <div v-for="(trigger, tIdx) in triggersModel" :key="trigger.id" :class="isTemplateLocked(trigger) ? 'bg-muted/30 border-dashed' : ''">
        <TriggerEditor
          :trigger="trigger"
          :schema="schema"
          :readonly="isTemplateLocked(trigger)"
          :advanced="true"
          :show-level="true"
          :issues="issues"
          :unavailable-levels="unavailableTriggerLevels(trigger.id)"
          @update:trigger="updateTrigger"
          @convert="requestTemplateConversion(trigger)"
        >
          <template #actions>
            <Button size="xs" variant="outline" :disabled="tIdx === 0" @click="moveTrigger(tIdx, -1)">↑</Button>
            <Button size="xs" variant="outline" :disabled="tIdx === triggersModel.length - 1" @click="moveTrigger(tIdx, 1)"> ↓ </Button>
            <Button class="text-destructive" size="xs" variant="ghost" @click="removeTrigger(tIdx)">删除</Button>
          </template>
        </TriggerEditor>
      </div>
    </TransitionGroup>

    <!-- 新增触发条件 -->
    <div v-if="availableTriggerLevels.length" class="flex items-center gap-3">
      <AlarmSelect
        :model-value="''"
        data-testid="alarm-add-trigger"
        :disabled="loading || schemaLoading || !!schemaError"
        class="w-[260px]"
        :options="addConditionOptions"
        placeholder="+ 添加一组触发条件"
        @update:model-value="onAddCondition"
      />
      <span v-if="loading" class="text-muted-foreground text-xs">模板加载中...</span>
      <span v-else class="text-muted-foreground text-xs">不同条件组分别产生对应级别的告警。</span>
    </div>

    <AlarmConfirmDialog
      :open="!!templateToConvert"
      title="转换为自定义条件"
      description="转换后将解除与原条件模板的关联，后续模板变更不会同步到当前规则。确定继续吗？"
      confirm-text="继续转换"
      @update:open="onConversionDialogOpenChange"
      @confirm="confirmTemplateConversion"
    />
  </div>
</template>

<style scoped>
/* 条件组排序时保持旧位置到新位置的连续运动，避免瞬间跳换。 */
.trigger-swap-move {
  position: relative;
  z-index: 1;
  box-shadow: inset 2px 0 0 var(--primary);
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 160ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .trigger-swap-move {
    box-shadow: none;
    transition-duration: 0.01ms;
  }
}
</style>
