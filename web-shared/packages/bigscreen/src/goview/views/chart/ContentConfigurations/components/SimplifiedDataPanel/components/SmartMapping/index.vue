<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { SimplifiedDataType, TableColumnDef } from '@/packages/custom/types';
import type { CreateComponentType } from '@/packages/index.type';

import type { MappingFieldDef, MappingSchema, SimplifiedDataState } from '../../adapters/types';

import { computed, ref, watch } from 'vue';

import { SettingItemBox } from '@/components/Pages/ChartItemSetting';

import { getAdapter } from '../../adapters';
import { normalizeToGroups } from '../../adapters/helpers';
import { resolveMappingComponent } from './mappings';

type MappingValue = string | string[] | undefined;

const props = withDefaults(
  defineProps<{
    columnSource?: TableColumnDef[];
    readonly?: boolean;
    simplifiedData?: SimplifiedDataType;
    stateOverride?: SimplifiedDataState;
    targetData: CreateComponentType;
  }>(),
  {
    columnSource: () => [],
    readonly: false,
    simplifiedData: undefined,
    stateOverride: undefined,
  },
);

const resolvedSimplifiedData = computed(() => props.simplifiedData ?? props.targetData.option?._simplifiedData);

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

const schema = computed<MappingSchema>(() => {
  return adapter.value.getMappingSchema?.() ?? { mode: 'none' };
});

const mappingComponent = computed(() => {
  return resolveMappingComponent(props.targetData.chartConfig.chartKey, resolvedSimplifiedData.value?.adapterType);
});

const normalizedGroups = computed(() => normalizeToGroups(normalizedState.value));
const mappingState = ref<Record<string, string | string[]>>({});
const activeGroupNames = ref<string[]>([]);

const buildMappingKey = (fieldKey: string, groupKey?: string) => (groupKey ? `${groupKey}.${fieldKey}` : fieldKey);

// 列定义兼容 TableColumnDef（label）与 SimplifiedDataColumn（title）两种来源，取结构化最小面
const normalizeColumn = (column: { key: string; label?: string; title?: string; type: 'number' | 'string' }) => {
  return {
    key: column.key,
    title: column.title || column.label || column.key,
    type: column.type,
  };
};

const getColumnsByGroup = (groupKey?: string) => {
  if (!groupKey && props.columnSource.length > 0) {
    return props.columnSource.map((col) => normalizeColumn(col));
  }

  if (groupKey) {
    const group = normalizedGroups.value.find((item) => item.key === groupKey);
    if (group) return group.columns.map((col) => normalizeColumn(col));
  }

  return normalizedGroups.value[0]?.columns.map((col) => normalizeColumn(col)) ?? [];
};

const getFilteredColumns = (field: MappingFieldDef, groupKey?: string) => {
  const columns = getColumnsByGroup(groupKey);
  if (!field.acceptTypes?.length) return columns;
  return columns.filter((column) => field.acceptTypes?.includes(column.type));
};

const getSelectOptions = (field: MappingFieldDef, groupKey?: string) => {
  return getFilteredColumns(field, groupKey).map((column) => ({
    label: column.title,
    value: column.key,
  }));
};

const getFieldValue = (field: MappingFieldDef, groupKey?: string): MappingValue => {
  const key = buildMappingKey(field.key, groupKey);
  return mappingState.value[key];
};

const setFieldValue = (field: MappingFieldDef, value: null | string | string[], groupKey?: string) => {
  const key = buildMappingKey(field.key, groupKey);
  if (Array.isArray(value)) {
    mappingState.value[key] = value;
    return;
  }
  mappingState.value[key] = value || '';
};

const getSingleValue = (field: MappingFieldDef, groupKey?: string) => {
  const value = getFieldValue(field, groupKey);
  return typeof value === 'string' ? value : '';
};

const getMultiValue = (field: MappingFieldDef, groupKey?: string) => {
  const value = getFieldValue(field, groupKey);
  return Array.isArray(value) ? value : [];
};

const isFieldMatched = (field: MappingFieldDef, groupKey?: string) => {
  const value = getFieldValue(field, groupKey);
  if (field.multiple) {
    const arr = Array.isArray(value) ? value : [];
    return field.required ? arr.length > 0 : true;
  }
  const single = typeof value === 'string' ? value.trim() : '';
  return field.required ? Boolean(single) : true;
};

const getFieldStatusText = (field: MappingFieldDef, groupKey?: string) => {
  return isFieldMatched(field, groupKey) ? editorT('bigscreenEditor.ui.matchedSuccessfully') : editorT('bigscreenEditor.ui.notConfigured');
};

const getFieldStatusType = (field: MappingFieldDef, groupKey?: string) => {
  return isFieldMatched(field, groupKey) ? 'success' : 'warning';
};

const getGroupRowsCount = (groupKey: string) => {
  return normalizedGroups.value.find((group) => group.key === groupKey)?.rows.length ?? 0;
};

const inferDefaultValue = (field: MappingFieldDef, groupKey?: string): string | string[] => {
  const options = getSelectOptions(field, groupKey);
  if (field.multiple) {
    const result = options.map((item) => item.value);
    return field.required ? result.slice(0, Math.max(1, Math.min(2, result.length))) : result.slice(0, Math.min(2, result.length));
  }
  return options[0]?.value ?? '';
};

const buildDefaultMappings = () => {
  const defaults: Record<string, string | string[]> = {};
  if (schema.value.mode === 'flat') {
    schema.value.fields.forEach((field) => {
      defaults[buildMappingKey(field.key)] = inferDefaultValue(field);
    });
    return defaults;
  }
  if (schema.value.mode === 'grouped') {
    schema.value.groups.forEach((group) => {
      group.fields.forEach((field) => {
        defaults[buildMappingKey(field.key, group.key)] = inferDefaultValue(field, group.key);
      });
    });
  }
  return defaults;
};

watch(
  () => ({
    adapterType: resolvedSimplifiedData.value?.adapterType,
    columns: normalizedGroups.value.map((group) => `${group.key}:${group.columns.map((col) => col.key).join(',')}`).join('|'),
    mode: schema.value.mode,
  }),
  () => {
    const saved = resolvedSimplifiedData.value?.mappings ?? {};
    mappingState.value = {
      ...buildDefaultMappings(),
      ...saved,
    };

    // groups 数据从不携带 collapsed（恒 undefined，原过滤无实际效果），直接展开全部分组
    activeGroupNames.value = schema.value.mode === 'grouped' ? schema.value.groups.map((group) => group.key) : [];
  },
  { deep: true, immediate: true },
);

watch(
  mappingState,
  (nextState) => {
    if (!resolvedSimplifiedData.value) return;
    resolvedSimplifiedData.value.mappings = { ...nextState };
  },
  { deep: true },
);

const setActiveGroupNames = (names: string[]) => {
  activeGroupNames.value = names;
};
</script>

<template>
  <SettingItemBox :name="editorT('bigscreenEditor.ui.dataMapping')">
    <component
      :is="mappingComponent"
      :schema="schema"
      :readonly="readonly"
      :active-group-names="activeGroupNames"
      :set-active-group-names="setActiveGroupNames"
      :get-group-rows-count="getGroupRowsCount"
      :get-select-options="getSelectOptions"
      :get-field-status-text="getFieldStatusText"
      :get-field-status-type="getFieldStatusType"
      :get-single-value="getSingleValue"
      :get-multi-value="getMultiValue"
      :set-field-value="setFieldValue"
    />
  </SettingItemBox>
</template>
