<template>
  <v-chart
    ref="vChartRef"
    :init-options="initOptions"
    :theme="themeColor"
    :option="option"
    :update-options="{
      replaceMerge: replaceMergeArr
    }"
    autoresize
  ></v-chart>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch, type PropType } from 'vue'
import VChart from 'vue-echarts'
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import config, { includes, seriesItem } from './config'
import { mergeTheme } from '@/packages/public/chart'
import { useChartDataFetch } from '@/hooks'
import type { CreateComponentType } from '@/packages/index.type'
import { hasIoTDatasetMeta } from '@/packages/components/Charts/utils/iotDataset'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { isPreview } from '@/utils'
import { DatasetComponent, GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import isObject from 'lodash/isObject'
import cloneDeep from 'lodash/cloneDeep'

const props = defineProps({
  themeSetting: {
    type: Object,
    required: true
  },
  themeColor: {
    type: Object,
    required: true
  },
  chartConfig: {
    type: Object as PropType<config>,
    required: true
  }
})

const initOptions = useCanvasInitOptions(props.chartConfig.option, props.themeSetting)

use([DatasetComponent, CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

const replaceMergeArr = ref<string[]>()

const option = computed(() => {
  return mergeTheme(props.chartConfig.option, props.themeSetting, includes)
})

// dataset 无法变更条数的补丁
watch(
  () => props.chartConfig.option.dataset,
  (newData: { dimensions: any }, oldData) => {
    try {
      if (!isObject(newData) || !('dimensions' in newData)) return
      if (Array.isArray(newData?.dimensions)) {
        const newDims: string[] = Array.isArray(newData.dimensions) ? newData.dimensions : []
        const expectedCount = Math.max(newDims.length - 1, 0)
        const currentSeries = props.chartConfig.option.series

        // 如果 series 已有 encode（适配器/映射器设置的）且数量匹配，跳过重建
        if (Array.isArray(currentSeries) && currentSeries.length === expectedCount && currentSeries[0]?.encode) {
          replaceMergeArr.value = ['series']
          nextTick(() => { replaceMergeArr.value = [] })
          return
        }

        const seriesArr: any[] = []
        // 对oldData进行判断，防止传入错误数据之后对旧维度判断产生干扰
        // 此处计算的是dimensions的Y轴维度，若是dimensions.length为0或1，则默认为1，排除X轴维度干扰
        const oldDimensions = Array.isArray(oldData?.dimensions)&&oldData.dimensions.length >= 1 ? oldData.dimensions.length : 1;
        const newDimensions = newData.dimensions.length >= 1 ? newData.dimensions.length : 1;
        const dimensionsGap = newDimensions - oldDimensions;
        if (dimensionsGap < 0) {
          props.chartConfig.option.series.splice(newDimensions - 1)
        } else if (dimensionsGap > 0) {
          if(!oldData || !oldData?.dimensions || !Array.isArray(oldData?.dimensions) || !oldData?.dimensions.length ) {
              props.chartConfig.option.series=[]
          }
          for (let i = 0; i < dimensionsGap; i++) {
            seriesArr.push(cloneDeep(seriesItem))
          }
          props.chartConfig.option.series.push(...seriesArr)
        }
        // 当维度名称发生变化时同步 series.encode，避免 ECharts 用旧列名找不到新列而空图
        // 用维度值比对（非仅数量），兜底覆盖 mapper 原地修改 oldData 导致 dimensionsGap=0 的场景
        const oldDims: string[] = Array.isArray(oldData?.dimensions) ? oldData.dimensions : []
        const dimsChanged = oldDims.join(',') !== newDims.join(',')
        if (dimsChanged && newDims.length >= 2) {
          props.chartConfig.option.series.forEach((s: any, idx: number) => {
            s.encode = newDims[idx + 1] !== undefined
              ? { x: newDims[0], y: newDims[idx + 1] }
              : { x: newDims[0], y: '' }
          })
        }
        replaceMergeArr.value = ['series']
        nextTick(() => {
          replaceMergeArr.value = []
        })
      }
    } catch (error) {
      console.log(error)
    }
  },
  {
    deep: false
  }
)

const { vChartRef } = useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  if (hasIoTDatasetMeta(newData)) return
  props.chartConfig.option.dataset = newData
})
</script>
