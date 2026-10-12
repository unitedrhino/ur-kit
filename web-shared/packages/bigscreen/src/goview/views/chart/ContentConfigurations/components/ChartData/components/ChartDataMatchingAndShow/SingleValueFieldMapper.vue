<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <n-table striped>
    <thead>
      <tr>
        <th>{{ editorT('orgManage.user.role') }}</th>
        <th>{{ editorT('orgManage.flow.fieldCol') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ editorT('bigscreenEditor.ui.valueField') }}</td>
        <td>
          <n-select v-model:value="singleValueField" :options="fieldOptions" size="small" :placeholder="editorT('orgManage.cloneGroup.selectField')" @update:value="onSingleValueChange" />
        </td>
      </tr>
    </tbody>
  </n-table>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, ref, watch } from 'vue';

import { RequestDataTypeEnum } from '@/enums/httpEnum';

import { readSingleValueField, writeSingleValueField } from './singleValueFieldMapping';

const props = defineProps({
  chartOption: {
    type: Object,
    required: true,
  },
  iotDeviceConfig: {
    type: Object,
    default: undefined,
  },
  requestDataType: {
    type: Number,
    default: undefined,
  },
});

const singleValueField = ref('');

const fieldOptions = computed(() => {
  const dimensions = Array.isArray(props.chartOption?.dataset?.dimensions) ? props.chartOption.dataset.dimensions : [];
  const source = Array.isArray(props.chartOption?.dataset?.source) ? props.chartOption.dataset.source : [];
  const firstRow = source.find((item: any) => item && typeof item === 'object') ?? {};

  const ignoreKeys = new Set(['_timestamp', 'agg', 'date', 'datetime', 'device', 'key', 'metric', 'name', 'status', 'time', 'timestamp', 'timeWindow', editorT('orgManage.pointLog.time')]);
  const keys = dimensions.length > 0 ? dimensions : Object.keys(firstRow);

  return keys.filter((key: string) => !ignoreKeys.has(key)).map((key: string) => ({ label: key, value: key }));
});

watch(
  [fieldOptions, () => (props.iotDeviceConfig as any)?.mapping, () => (props.chartOption as any)?._simplifiedData?.mappings],
  () => {
    singleValueField.value = readSingleValueField({
      chartOption: props.chartOption,
      fieldOptions: fieldOptions.value.map((item) => item.value),
      iotDeviceConfig: props.iotDeviceConfig,
      requestDataType: props.requestDataType,
    });
  },
  { immediate: true, deep: true },
);

const onSingleValueChange = () => {
  writeSingleValueField({
    chartOption: props.chartOption,
    iotDeviceConfig: props.iotDeviceConfig,
    requestDataType: props.requestDataType,
    value: singleValueField.value || '',
  });
};
</script>
