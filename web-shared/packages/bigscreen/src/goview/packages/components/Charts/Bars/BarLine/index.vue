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
import { ref, computed, watch, type PropType, nextTick } from 'vue'
import VChart from 'vue-echarts'
import { isObject, cloneDeep } from 'lodash'
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
//引入柱状图 折线图
import { BarChart, LineChart } from 'echarts/charts'
import config, { includes, barSeriesItem, lineSeriesItem } from './config'
import { mergeTheme } from '@/packages/public/chart'
import { useChartDataFetch } from '@/hooks'
import { hasIoTDatasetMeta } from '@/packages/components/Charts/utils/iotDataset'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { isPreview } from '@/utils'
import { DatasetComponent, GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'

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

use([DatasetComponent, CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent])

const replaceMergeArr = ref<string[]>()

const option = computed(() => {
  return mergeTheme(props.chartConfig.option, props.themeSetting, includes)
})

const createSeriesByIndex = (index: number) => cloneDeep(index % 2 === 0 ? barSeriesItem : lineSeriesItem)

watch(
  () => props.chartConfig.option.dataset,
  (newData: any, oldData) => {
    try {
      if (!isObject(newData) || !('dimensions' in newData)) return
      if (Array.isArray((newData as any)?.dimensions)) {
        const expectedCount = (newData as any).dimensions.length - 1;
        const currentSeries = props.chartConfig.option.series;
        // 如果 series 已有 encode（适配器/映射器设置的）且数量匹配，跳过重建
        if (Array.isArray(currentSeries) && currentSeries.length === expectedCount && currentSeries[0]?.encode) {
          replaceMergeArr.value = ['series'];
          nextTick(() => { replaceMergeArr.value = []; });
          return;
        }
        const seriesArr: Array<Record<string, any>> = []
        // 对oldData进行判断，防止传入错误数据之后对旧维度判断产生干扰
        // 此处计算的是dimensions的Y轴维度，，若是dimensions.length为0或1，则默认为1，排除X轴维度干扰
        const oldDimensions =
          Array.isArray(oldData?.dimensions) && oldData.dimensions.length >= 1 ? oldData.dimensions.length : 1
        const newDimensions = (newData as any).dimensions.length >= 1 ? (newData as any).dimensions.length : 1
        const dimensionsGap = newDimensions - oldDimensions
        if (dimensionsGap < 0) {
          props.chartConfig.option.series.splice(newDimensions - 1)
        } else if (dimensionsGap > 0) {
          if (!oldData || !oldData?.dimensions || !Array.isArray(oldData?.dimensions) || !oldData?.dimensions.length) {
            props.chartConfig.option.series = []
          }
          for (let i = 0; i < dimensionsGap; i++) {
            seriesArr.push(createSeriesByIndex(props.chartConfig.option.series.length + i))
          }
          props.chartConfig.option.series.push(...seriesArr)
        }
        // 补充 encode（原逻辑缺失）
        if ((newData as any).dimensions.length >= 2) {
          props.chartConfig.option.series.forEach((s: any, idx: number) => {
            s.encode = (newData as any).dimensions[idx + 1] !== undefined
              ? { x: (newData as any).dimensions[0], y: (newData as any).dimensions[idx + 1] }
              : { x: (newData as any).dimensions[0], y: '' }
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
