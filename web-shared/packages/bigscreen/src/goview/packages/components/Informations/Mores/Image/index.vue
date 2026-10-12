<template>
  <div :style="getStyle(borderRadius)">
    <n-image
      v-if="!isCad"
      :object-fit="fit"
      preview-disabled
      :src="option.dataset"
      :fallback-src="requireErrorImg()"
      :width="w"
      :height="h"
      lazy
    />
    <CadViewer
      v-else
      :url="option.dataset"
      :filename="fileName"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, type PropType, shallowReactive, watch, toRefs } from 'vue'
import { requireErrorImg, isCadUrl } from '@/utils'
import { useChartDataFetch } from '@/hooks'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'

// CAD 图纸懒加载渲染（file-viewer + renderer-cad，仅在 dataset 为 CAD 文件时加载）
const CadViewer = defineAsyncComponent(() => import('./CadViewer.vue'))

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})

const { w, h } = toRefs(props.chartConfig.attr)
const { dataset, fit, borderRadius } = toRefs(props.chartConfig.option)

const option = shallowReactive({
  dataset: ''
})

const getStyle = (radius: number) => {
  return {
    borderRadius: `${radius}px`,
    overflow: 'hidden'
  }
}

/** 判断 dataset 是否为 CAD 图纸文件（忽略 URL query/hash，按末段后缀判定） */
const isCad = computed(() => isCadUrl(option.dataset || ''))

/** 取文件名（供 file-viewer 推断格式），无则取 URL 末段 */
const fileName = computed(() => {
  const raw = option.dataset || ''
  // split 结果至少含一个元素，兜底空串仅为满足类型
  const clean = (raw.split('?')[0] ?? '').split('#')[0] ?? ''
  const seg = clean.split('/').pop() || ''
  return seg || 'preview.dwg'
})

// 编辑更新
watch(
  () => props.chartConfig.option.dataset,
  (newData: any) => {
    option.dataset = newData
  },
  {
    immediate: true
  }
)

// 预览更新
useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  option.dataset = newData
})
</script>
