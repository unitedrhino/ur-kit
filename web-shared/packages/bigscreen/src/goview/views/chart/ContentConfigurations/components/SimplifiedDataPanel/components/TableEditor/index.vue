<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { SimplifiedDataType } from '@/packages/custom/types';
import type { CreateComponentType } from '@/packages/index.type';

import { computed, h } from 'vue';

import { NInput, NInputNumber } from 'naive-ui';

import { getAdapter } from '../../adapters';

const props = defineProps<{
  simplifiedData: SimplifiedDataType | undefined;
  targetData: CreateComponentType;
}>();

const rows = computed(() => props.simplifiedData?.rows ?? []);

const columns = computed(() => {
  const cols = props.simplifiedData?.columns ?? [];
  return cols.map((col) => ({
    title: col.label,
    key: col.key,
    render(row: Record<string, any>, _rowIndex: number) {
      // NInputNumber 与 NInput 的 props 类型不同，拆开调用以匹配各自的重载
      if (col.type === 'number') {
        return h(NInputNumber, {
          value: row[col.key],
          size: 'small',
          onUpdateValue: (val: number | null) => {
            row[col.key] = val;
            syncToOption();
          },
        });
      }
      return h(NInput, {
        value: row[col.key],
        size: 'small',
        onUpdateValue: (val: string) => {
          row[col.key] = val;
          syncToOption();
        },
      });
    },
  }));
});

/** 将扁平行数据通过 adapter 写回 option */
const syncToOption = () => {
  const adapter = getAdapter(props.targetData.chartConfig.chartKey, props.targetData.option._simplifiedData?.adapterType);
  const newOption = adapter.toOption(rows.value, props.targetData.option);
  Object.assign(props.targetData.option, newOption);
  // 冗余双写
  if (props.targetData.option._simplifiedData) {
    props.targetData.option._simplifiedData.rows = [...rows.value];
  }
};

const addRow = () => {
  const cols = props.simplifiedData?.columns ?? [];
  const emptyRow: Record<string, any> = {};
  cols.forEach((col) => {
    emptyRow[col.key] = col.type === 'number' ? 0 : '';
  });
  rows.value.push(emptyRow);
  syncToOption();
};

const removeRow = (index: number) => {
  rows.value.splice(index, 1);
  syncToOption();
};
</script>

<template>
  <div class="table-editor">
    <n-data-table :columns="columns" :data="rows" :bordered="false" size="small" :max-height="360" />
    <n-space justify="center" style="margin-top: 8px">
      <n-button size="small" dashed @click="addRow">{{ editorT('bigscreenEditor.ui.addRow') }}</n-button>
    </n-space>
  </div>
</template>
