<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <DecoratedTableView :chart-config="chartConfig">
    <div class="go-tables-basic">
      <n-input
        v-model:value="inputData"
        :placeholder="editorT('bigscreenEditor.ui.componentEnterInformation')"
        :style="`display: ${inputShow}`"
        style="margin-bottom: 5px; float: right; width: 240px"
      >
        <template #prefix>
          <n-icon :component="SearchIcon" />
        </template>
      </n-input>
      <n-data-table
        :style="`
        width: 100%;
        height: 100%;
        font-size: ${option.style.fontSize}px;
        border-width: ${option.style.border === 'on' ? option.style.borderWidth : 0}px;
        border-color: ${option.style.borderColor};
        border-style: ${option.style.borderStyle}`"
        :bordered="option.style.border === 'on'"
        :single-column="option.style.singleColumn === 'on'"
        :single-line="option.style.singleLine === 'on'"
        :bottom-bordered="option.style.bottomBordered === 'on'"
        :striped="option.style.striped === 'on'"
        :max-height="h"
        size="small"
        :columns="tableColumns"
        :data="filterData"
        :pagination="pagination"
      />
    </div>
  </DecoratedTableView>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { CreateComponentType } from '@/packages/index.type'

import { computed, reactive, ref, toRefs, type PropType, watch } from 'vue'

import { useChartDataFetch } from '@/hooks'
import { icon } from '@/plugins'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'

import DecoratedTableView from '../../shared/DecoratedTableView.vue'
import { normalizeDatasetForTablesBasic } from '../../shared/iotDataset'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true,
  },
})

const { SearchIcon } = icon.ionicons5

const formatCellValue = (value: unknown, digits: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number(value.toFixed(digits))
  }
  return value
}

const inputData = ref('')
const filterData = computed(() => {
  return option?.dataset?.source?.filter((item: any) => {
    return Object.values(item).some(val => {
      return String(val).toLowerCase().includes(inputData.value.toLowerCase())
    })
  })
})

const { align, pagination, inputShow, displayDecimals } = toRefs(props.chartConfig.option as any)

// toRefs 对索引签名类型解构出的 ref 可能为 undefined，使用前逐个收窄
if (pagination) {
  pagination.value.onChange = (page: number) => {
    pagination.value.page = page
  }
}

const { h } = toRefs(props.chartConfig.attr)

const option = reactive({
  dataset: props.chartConfig.option.dataset,
  style: props.chartConfig.option.style,
})

const tableColumns = computed(() => {
  const digits = Math.max(0, Number(displayDecimals?.value ?? 0))
  return (option?.dataset?.dimensions ?? []).map((header: any) => ({
    ...header,
    align: align?.value,
    render: (row: Record<string, any>) => formatCellValue(row[header.key], digits),
  }))
})

watch(
  () => props.chartConfig.option.dataset,
  (newData: any) => {
    option.dataset = newData
  },
  {
    immediate: true,
    deep: true,
  },
)

useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  props.chartConfig.option.dataset = normalizeDatasetForTablesBasic(newData, props.chartConfig.option.dataset)
})
</script>

<style lang="scss" scoped>
@include go('tables-basic') {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: flex-end;
  width: 100%;
  height: 100%;
}
</style>
