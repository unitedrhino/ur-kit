<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { SimplifiedDataType, TableColumnDef } from '@/packages/custom/types';
import type { CreateComponentType } from '@/packages/index.type';

import type { SimplifiedDataState } from '../../adapters/types';

import { computed } from 'vue';

import { SettingItemBox } from '@/components/Pages/ChartItemSetting';

import { getAdapter } from '../../adapters';
import { isMultiGroup, normalizeToGroups } from '../../adapters/helpers';

const props = withDefaults(
  defineProps<{
    allowOpenEditor?: boolean;
    columnSource?: TableColumnDef[];
    simplifiedData?: SimplifiedDataType;
    stateOverride?: SimplifiedDataState;
    targetData: CreateComponentType;
  }>(),
  {
    allowOpenEditor: true,
    columnSource: () => [],
    simplifiedData: undefined,
    stateOverride: undefined,
  },
);

const emit = defineEmits<{
  (e: 'openEditor'): void;
}>();

const MAX_VISIBLE_COLUMNS = 4;

const resolvedSimplifiedData = computed(() => {
  return props.simplifiedData ?? props.targetData.option?._simplifiedData;
});

const normalizedState = computed<SimplifiedDataState>(() => {
  if (props.stateOverride) {
    return {
      columns: props.stateOverride.columns ?? [],
      rows: props.stateOverride.rows ?? [],
      groups: props.stateOverride.groups ?? [],
      mappings: props.stateOverride.mappings ?? resolvedSimplifiedData.value?.mappings,
    };
  }

  return {
    columns: resolvedSimplifiedData.value?.columns ?? [],
    rows: resolvedSimplifiedData.value?.rows ?? [],
    groups: resolvedSimplifiedData.value?.groups ?? [],
    mappings: resolvedSimplifiedData.value?.mappings,
  };
});

const adapter = computed(() => {
  return getAdapter(props.targetData.chartConfig.chartKey, resolvedSimplifiedData.value?.adapterType);
});

const normalizedGroups = computed(() => normalizeToGroups(normalizedState.value));
const showGroupDetails = computed(() => isMultiGroup(normalizedGroups.value));

const allColumns = computed(() => {
  if (props.columnSource.length > 0) {
    return props.columnSource.map((column) => ({
      key: column.key,
      // TableColumnDef 必填 label；展示名优先 title，回落 label/key
      label: column.title || column.label || column.key,
      title: column.title || column.key,
      type: column.type,
    }));
  }

  const seen = new Set<string>();
  const result: TableColumnDef[] = [];
  normalizedGroups.value.forEach((group) => {
    group.columns.forEach((column) => {
      if (!column?.key || seen.has(column.key)) return;
      seen.add(column.key);
      result.push({
        key: column.key,
        // TableColumnDef 必填 label；SimplifiedDataColumn 仅带 title，展示名回落 key
        label: column.title || column.key,
        title: column.title || column.key,
        type: column.type,
      });
    });
  });
  return result;
});

const visibleColumns = computed(() => allColumns.value.slice(0, MAX_VISIBLE_COLUMNS));
const hiddenColumnCount = computed(() => Math.max(0, allColumns.value.length - MAX_VISIBLE_COLUMNS));

const summaryText = computed(() => {
  const customText = adapter.value.getSummaryText?.(normalizedState.value);
  if (customText) return customText;
  const rowCount = normalizedGroups.value.reduce((sum, group) => sum + group.rows.length, 0);
  return editorT('bigscreenEditor.dynamic.message66', { rows: String(rowCount), dimensions: String(allColumns.value.length) });
});

const openEditor = () => emit('openEditor');
</script>

<template>
  <SettingItemBox :name="editorT('bigscreenEditor.ui.dataOverview')">
    <n-space vertical :size="6">
      <n-text depth="3" style="font-size: 13px">{{ summaryText }}</n-text>

      <n-space :size="4" v-if="allColumns.length > 0">
        <n-tag v-for="col in visibleColumns" :key="col.key" size="small" :bordered="false">
          {{ col.title }}
        </n-tag>
        <n-tag
          v-if="hiddenColumnCount > 0"
          size="small"
          type="info"
          :style="{ cursor: allowOpenEditor ? 'pointer' : 'default' }"
          :bordered="false"
          @click="allowOpenEditor && openEditor()"
        >
          + {{ hiddenColumnCount }} {{ editorT('bigscreenEditor.ui.hiddenFields') }}
        </n-tag>
      </n-space>

      <div v-if="showGroupDetails" class="overview-groups">
        <n-text v-for="group in normalizedGroups" :key="group.key" depth="3" style="display: block; font-size: 12px">
          {{ group.title }}：{{ group.rows.length }} {{ editorT('bigscreenEditor.ui.records') }}
        </n-text>
      </div>
    </n-space>
  </SettingItemBox>
</template>

<style scoped lang="scss">
.overview-groups {
  padding: 6px 8px;
  margin-top: 2px;
  border: 1px dashed rgb(255 255 255 / 12%);
  border-radius: 4px;
}
</style>
