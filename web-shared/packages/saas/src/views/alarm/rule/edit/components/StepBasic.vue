<script setup lang="ts">
import type { AlarmRuleIssue } from '../../../composables/useAlarmRuleValidation';
import type { AlarmObjectNode, AlarmRule, SelectType, TargetKind } from '../../../types/alarm-v2.types';

/**
 * 文件说明：告警规则监控范围步骤
 * 引导用户依次填写规则名称、告警来源和设备范围，并在字段旁展示可操作的校验提示。
 */
import { computed, onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle } from '@unitedrhino/saas-ui/ui/field';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@unitedrhino/saas-ui/ui/input-group';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@unitedrhino/saas-ui/ui/toggle-group';
import { Search } from 'lucide-vue-next';

import { targetTypeOptionsFromCapabilities } from '../../../composables/useAlarmCapabilities';
import { selectTypeText } from '../../../types/alarm-v2.types';
import {
  buildAreaSelectionTree,
  buildDeviceSelectionTree,
  buildGroupSelectionTree,
  filterDeviceSelectionTree,
  findAlarmObjectNodeById,
  useAlarmObjectTree,
} from '../../../composables/useAlarmObjectTree';
import AlarmSourceTree from './AlarmSourceTree.vue';
import RecursiveTree from './RecursiveTree.vue';
import StepOverview from './StepOverview.vue';

const props = defineProps<{
  /** 当前步骤需要展示的校验问题。 */
  issues?: AlarmRuleIssue[];
  modelValue: AlarmRule;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: AlarmRule): void;
}>();

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

/** deviceKeyword 用于在指定设备模式下按名称或设备标识筛选。 */
const deviceKeyword = ref('');

// 从后端加载真实告警对象树；失败或数据为空时保持空列表。
const { treeData, load: loadObjectTree } = useAlarmObjectTree();

onMounted(() => {
  loadObjectTree();
});

/** 当前选中的告警来源节点，从 form.target 实时派生，保证编辑回填时能正确高亮 */
const selectedSource = computed(() => {
  const t = form.value.target;
  if (t.targetKind === 'product' && t.productID) {
    return { id: t.productID, level: 'product' as const };
  }
  if (t.targetKind === 'category' && t.categoryID) {
    return { id: t.categoryID, level: 'category' as const };
  }
  return null;
});

/** 对象树加载完成后补齐编辑回填所需的来源名称。 */
watch(
  [treeData, selectedSource],
  ([nodes, source]) => {
    if (!source) return;
    const node = findAlarmObjectNodeById(nodes, source.id, source.level);
    if (!node) return;
    if (source.level === 'category') {
      form.value.target.categoryName = node.name;
    } else {
      form.value.target.productName = node.name;
    }
  },
  { immediate: true },
);
/** 对象树过滤维度必须跟随选择方式，避免界面选择“区域”却写入设备列表。 */
const filterType = computed<'area' | 'device' | 'group'>(() => {
  if (form.value.target.selectType === 'fixed') return 'device';
  if (form.value.target.selectType === 'group') return 'group';
  return 'area';
});

/** targetTypeOptions 仅展示后端能力接口允许的目标选择方式，label 按 i18n 键翻译。 */
const targetTypeOptions = computed(() =>
  targetTypeOptionsFromCapabilities().map((item) => ({ value: item.value, label: selectTypeText(item.value) })),
);

/** 当前告警来源的可读名称。 */
const sourceSummary = computed(() => {
  const target = form.value.target;
  return target.targetKind === 'product' ? target.productName || $t('iotApp.alarmRule.noProductSelected') : target.categoryName || $t('iotApp.alarmRule.noCategorySelected');
});

/** 当前选择对象的数量和单位。 */
const targetSummary = computed(() => {
  const target = form.value.target;
  if (target.selectType === 'all') return $t('iotApp.alarmRule.allDevicesUnderSource');
  if (target.selectType === 'fixed') return $t('iotApp.alarmRule.selectedDevices', { count: target.devices?.length ?? 0 });
  if (target.selectType === 'group') return $t('iotApp.alarmRule.selectedGroups', { count: target.groups?.length ?? 0 });
  return $t('iotApp.alarmRule.selectedAreas', { count: target.areas?.length ?? 0 });
});

/** 当前选择方式的用途说明，避免相近范围产生歧义。 */
const selectionHint = computed(() => {
  const selectType = form.value.target.selectType;
  if (selectType === 'fixed') {
    return $t('iotApp.alarmRule.hintFixed');
  }
  if (selectType === 'area') {
    return $t('iotApp.alarmRule.hintArea');
  }
  if (selectType === 'areaWithChildren') {
    return $t('iotApp.alarmRule.hintAreaWithChildren');
  }
  if (selectType === 'group') {
    return $t('iotApp.alarmRule.hintGroup');
  }
  return $t('iotApp.alarmRule.scopeAllDevicesDesc');
});

/** 当前选择方式无可选数据时的明确提示。 */
const selectionEmptyText = computed(() => {
  const selectType = form.value.target.selectType;
  if (selectType === 'fixed') {
    return deviceKeyword.value.trim() ? $t('iotApp.alarmRule.noMatchedDevices') : $t('iotApp.alarmRule.noDevicesAvailable');
  }
  if (selectType === 'group') {
    return $t('iotApp.alarmRule.noGroupsAvailable');
  }
  return $t('iotApp.alarmRule.noAreasAvailable');
});

/** 汇总当前监控来源与告警对象，供步骤概览突出展示。 */
const basicSummary = computed(() => `${sourceSummary.value}；${targetSummary.value}`);

/** 返回某个字段的第一条错误文案。 */
function issueFor(field: string): string {
  return props.issues?.find((issue) => issue.field === field)?.message ?? '';
}

/** 按告警来源过滤后的对象树根节点 */
const filteredTree = computed(() => {
  const src = selectedSource.value;
  if (!src) return [];
  const sourceNode = findAlarmObjectNodeById(treeData.value, src.id, src.level);
  if (!sourceNode) return [];
  if (form.value.target.selectType === 'fixed') {
    return filterDeviceSelectionTree(buildDeviceSelectionTree(sourceNode), deviceKeyword.value);
  }
  if (form.value.target.selectType === 'area' || form.value.target.selectType === 'areaWithChildren') {
    return buildAreaSelectionTree(sourceNode);
  }
  if (form.value.target.selectType === 'group') {
    return buildGroupSelectionTree(sourceNode);
  }
  return [];
});

/** 在对象树中查找节点对应的产品 ID */
function findProductIDForNode(node: AlarmObjectNode): string {
  const src = selectedSource.value;
  if (src?.level === 'product') {
    return src.id;
  }
  function dfs(list: AlarmObjectNode[], parentProductID: string): string {
    for (const item of list) {
      const prodID = item.level === 'product' ? item.id : parentProductID;
      if (item.id === node.id) return prodID;
      if (item.children) {
        const found = dfs(item.children, prodID);
        if (found) return found;
      }
    }
    return parentProductID;
  }
  return dfs(treeData.value, src?.id ?? '');
}

function clearTargetSelection() {
  form.value.target.devices = [];
  form.value.target.areas = [];
  form.value.target.groups = [];
}

function onSourceSelect(node: AlarmObjectNode) {
  const target = form.value.target;
  if (node.level === 'product') {
    target.targetKind = 'product' as TargetKind;
    target.productID = node.id;
    target.productName = node.name;
    target.categoryID = undefined;
    target.categoryName = undefined;
  } else {
    target.targetKind = 'category' as TargetKind;
    target.categoryID = node.id;
    target.categoryName = node.name;
    target.productID = undefined;
    target.productName = undefined;
  }
  clearTargetSelection();
  deviceKeyword.value = '';
}

function onSelectTypeChange(type: SelectType) {
  form.value.target.selectType = type;
  clearTargetSelection();
  deviceKeyword.value = '';
}

/** handleSelectTypeChange 忽略单选按钮组的空值，只接收已定义的范围类型。 */
function handleSelectTypeChange(type: unknown) {
  if (typeof type === 'string' && targetTypeOptions.value.some((item) => item.value === type)) {
    onSelectTypeChange(type as SelectType);
  }
}

/** handleStatusChange 将 shadcn 单选值映射为后端状态枚举。 */
function handleStatusChange(status: unknown) {
  if (status === '1' || status === '2') {
    form.value.status = Number(status);
  }
}

function toggleCheck(node: AlarmObjectNode, checked: boolean) {
  const target = form.value.target;
  const productID = findProductIDForNode(node);
  switch (target.selectType) {
    case 'area':
    case 'areaWithChildren': {
      const areas = target.areas ?? [];
      const idNum = Number(node.id);
      if (checked) {
        if (!areas.includes(idNum)) areas.push(idNum);
      } else {
        target.areas = areas.filter((id) => id !== idNum);
      }

      break;
    }
    case 'fixed': {
      const devices = target.devices ?? [];
      if (checked) {
        if (!devices.find((d) => d.name === node.id)) {
          devices.push({ productID, name: node.id, alias: node.name });
        }
      } else {
        target.devices = devices.filter((d) => d.name !== node.id);
      }

      break;
    }
    case 'group': {
      const groups = target.groups ?? [];
      const idNum = Number(node.id);
      if (checked) {
        if (!groups.includes(idNum)) groups.push(idNum);
      } else {
        target.groups = groups.filter((id) => id !== idNum);
      }

      break;
    }
    // No default
  }
}

function isChecked(node: AlarmObjectNode): boolean {
  if (form.value.target.selectType === 'all') return false;
  if (form.value.target.selectType === 'fixed') {
    return !!form.value.target.devices?.find((d) => d.name === node.id);
  }
  if (form.value.target.selectType === 'area' || form.value.target.selectType === 'areaWithChildren') {
    return form.value.target.areas?.includes(Number(node.id)) ?? false;
  }
  if (form.value.target.selectType === 'group') {
    return form.value.target.groups?.includes(Number(node.id)) ?? false;
  }
  return false;
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <StepOverview :title="$t('iotApp.alarmRule.scopeConfigTitle')" :description="$t('iotApp.alarmRule.scopeConfigDesc')" :summary-label="$t('iotApp.alarmRule.currentScope')" :summary="basicSummary" />

    <FieldGroup class="gap-5">
      <!-- 规则名称 -->
      <Field class="grid grid-cols-[120px_1fr] items-start gap-4" :data-invalid="Boolean(issueFor('name'))">
        <FieldLabel for="alarm-rule-name" class="pt-2">
          {{ $t('iotApp.alarmCommon.ruleName') }}
          <span class="text-destructive">*</span>
        </FieldLabel>
        <FieldContent class="max-w-md">
          <Input
            id="alarm-rule-name"
            data-testid="alarm-rule-name"
            v-model="form.name"
            :placeholder="$t('iotApp.alarmRule.namePh')"
            maxlength="128"
            :aria-invalid="Boolean(issueFor('name'))"
          />
          <FieldError v-if="issueFor('name')">{{ issueFor('name') }}</FieldError>
          <FieldDescription v-else>{{ $t('iotApp.alarmRule.nameHint') }}</FieldDescription>
        </FieldContent>
      </Field>

      <!-- 告警来源 -->
      <Field class="grid grid-cols-[120px_1fr] items-start gap-4" :data-invalid="Boolean(issueFor('source'))">
        <FieldTitle class="pt-2">
          {{ $t('iotApp.alarmRule.sourceLabel') }}
          <span class="text-destructive">*</span>
        </FieldTitle>
        <FieldContent class="w-full max-w-2xl">
          <div
            class="bg-muted/20 max-h-72 overflow-y-auto rounded-lg border p-3"
            :class="issueFor('source') ? 'border-destructive' : ''"
            data-testid="alarm-source-tree"
          >
            <AlarmSourceTree :nodes="treeData" :selected-id="selectedSource?.id" :selected-level="selectedSource?.level" @select="onSourceSelect" />
          </div>
          <FieldError v-if="issueFor('source')">{{ issueFor('source') }}</FieldError>
          <FieldDescription v-else>{{ $t('iotApp.alarmRule.sourceHint') }}</FieldDescription>
        </FieldContent>
      </Field>

      <!-- 告警对象 -->
      <Field class="grid grid-cols-[120px_1fr] items-start gap-4" :data-invalid="Boolean(issueFor('target'))">
        <FieldTitle class="pt-2">
          {{ $t('iotApp.alarmRule.objectLabel') }}
          <span class="text-destructive">*</span>
        </FieldTitle>
        <FieldContent class="w-full max-w-2xl gap-3">
          <!-- 选择方式 -->
          <ToggleGroup
            type="single"
            variant="outline"
            :model-value="form.target.selectType"
            class="flex flex-wrap justify-start gap-3"
            :aria-label="$t('iotApp.alarmRule.objectScope')"
            data-testid="alarm-target-select-type"
            @update:model-value="handleSelectTypeChange"
          >
            <ToggleGroupItem
              v-for="st in targetTypeOptions"
              :key="st.value"
              :value="st.value"
              :data-testid="`alarm-target-${st.value}`"
              class="data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-primary px-3"
            >
              {{ st.label }}
            </ToggleGroupItem>
          </ToggleGroup>
          <FieldDescription>{{ selectionHint }}</FieldDescription>

          <!-- 对象选择器 -->
          <div v-if="form.target.selectType !== 'all'" class="flex flex-col gap-2">
            <div class="bg-background overflow-hidden rounded-lg border" :class="issueFor('target') ? 'border-destructive' : ''">
              <div v-if="form.target.selectType === 'fixed'" class="bg-muted/20 border-b p-2">
                <InputGroup class="bg-background">
                  <InputGroupInput
                    v-model.trim="deviceKeyword"
                    type="search"
                    :aria-label="$t('iotApp.alarmRule.deviceFilter')"
                    data-testid="alarm-target-device-search"
                    :placeholder="$t('iotApp.alarmRule.deviceFilter')"
                  />
                  <InputGroupAddon>
                    <Search aria-hidden="true" />
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <div class="max-h-64 overflow-y-auto p-2">
                <RecursiveTree
                  v-if="filteredTree.length > 0"
                  :nodes="filteredTree"
                  :filter-type="filterType"
                  :is-checked="isChecked"
                  :disable-check-levels="['product']"
                  @toggle="toggleCheck"
                />
                <div v-else class="text-muted-foreground flex min-h-20 items-center justify-center px-3 py-4 text-center text-sm">
                  {{ selectionEmptyText }}
                </div>
              </div>
            </div>
            <FieldError v-if="issueFor('target')">{{ issueFor('target') }}</FieldError>
          </div>
          <FieldDescription v-if="form.target.selectType !== 'all'">{{ targetSummary }}</FieldDescription>
        </FieldContent>
      </Field>

      <!-- 评估周期 -->
      <Field class="grid grid-cols-[120px_1fr] items-center gap-4" :data-invalid="Boolean(issueFor('evalPeriod'))">
        <FieldLabel for="alarm-eval-period">
          {{ $t('iotApp.alarmRule.evalPeriod') }}
          <span class="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <div class="flex items-center gap-2">
            <Input
              id="alarm-eval-period"
              data-testid="alarm-eval-period"
              :model-value="form.evalPeriod"
              type="number"
              min="1"
              class="w-24"
              :aria-invalid="Boolean(issueFor('evalPeriod'))"
              @update:model-value="form.evalPeriod = Number($event)"
            />
            <span class="text-muted-foreground text-sm">{{ $t('iotApp.alarmRule.minutesMin1') }}</span>
          </div>
          <FieldError v-if="issueFor('evalPeriod')">{{ issueFor('evalPeriod') }}</FieldError>
        </FieldContent>
      </Field>

      <!-- 启用状态 -->
      <Field class="grid grid-cols-[120px_1fr] items-center gap-4">
        <FieldTitle>{{ $t('iotApp.alarmCommon.enableStatus') }}</FieldTitle>
        <ToggleGroup
          type="single"
          variant="outline"
          :model-value="String(form.status)"
          class="justify-start"
          :aria-label="$t('iotApp.alarmCommon.enableStatus')"
          data-testid="alarm-rule-status"
          @update:model-value="handleStatusChange"
        >
          <ToggleGroupItem value="1">{{ $t('iotApp.common.enable') }}</ToggleGroupItem>
          <ToggleGroupItem value="2">{{ $t('iotApp.common.disable') }}</ToggleGroupItem>
        </ToggleGroup>
      </Field>

      <!-- 描述 -->
      <Field class="grid grid-cols-[120px_1fr] items-start gap-4">
        <FieldLabel for="alarm-rule-description" class="pt-2">{{ $t('iotApp.alarmCommon.desc') }}</FieldLabel>
        <FieldContent>
          <Textarea
            id="alarm-rule-description"
            v-model="form.desc"
            :placeholder="$t('iotApp.alarmRule.descPh')"
            rows="3"
            class="max-w-md"
          />
        </FieldContent>
      </Field>
    </FieldGroup>
  </div>
</template>
