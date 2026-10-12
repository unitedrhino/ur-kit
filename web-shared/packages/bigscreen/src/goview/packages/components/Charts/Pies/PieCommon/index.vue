<template>
  <v-chart
    ref="vChartRef"
    autoresize
    :init-options="initOptions"
    :theme="themeColor"
    :option="option"
    :manual-update="isPreview()"
    @mouseover="handleHighlight"
    @mouseout="handleDownplay"
    :update-options="{ replaceMerge: ['series'] }"
  ></v-chart>
</template>

<script setup lang="ts">
import { computed, type PropType, onMounted, watch } from 'vue'
import VChart from 'vue-echarts'
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { mergeTheme } from '@/packages/public/chart'
import config, { includes } from './config'
import { useChartDataFetch } from '@/hooks'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { isPreview } from '@/utils'
import { DatasetComponent, GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import dataJson from './data.json'

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
let seriesDataNum = -1
let seriesDataMaxLength = 0
let intervalInstance: any = null

use([DatasetComponent, CanvasRenderer, PieChart, GridComponent, TooltipComponent, LegendComponent])

// ==================== ✨ 核心修复：多维饼图数据映射与拦截 ====================
const option = computed(() => {
  // 深拷贝合并主题
  const opt = mergeTheme(props.chartConfig.option, props.themeSetting, includes)

  const dataset = opt.dataset
  if (dataset && Array.isArray(dataset.dimensions) && dataset.dimensions.length >= 2) {
    if (opt.series && opt.series.length > 0) {
      // 1. 动态注入 encode 映射，告诉饼图 X 轴是名字，Y 轴是数值
      opt.series[0].encode = {
        itemName: dataset.dimensions[0],
        value: dataset.dimensions[1]
      }
      // 2. 🚨 极其重要：彻底删除原有的 data 属性！强迫 ECharts 只能去读 dataset
      delete opt.series[0].data
    }
  }
  return opt
})

// 会重新选择需要选中和展示的数据
const handleSeriesData = () => {
  if (seriesDataNum > -1) {
    vChartRef.value?.dispatchAction({
      type: 'downplay',
      dataIndex: seriesDataNum
    })
  }
  seriesDataNum = seriesDataNum >= seriesDataMaxLength - 1 ? 0 : seriesDataNum + 1
  vChartRef.value?.dispatchAction({
    type: 'highlight',
    dataIndex: seriesDataNum
  })
}

// 新增轮播
const addPieInterval = (newData?: typeof dataJson, skipPre = false) => {
  if (!skipPre && !Array.isArray(newData?.source)) return
  if (!skipPre) seriesDataMaxLength = newData?.source.length || 0
  clearInterval(intervalInstance)
  intervalInstance = setInterval(() => {
    handleSeriesData()
  }, 1000)
}

// 取消轮播
const clearPieInterval = () => {
  vChartRef.value?.dispatchAction({
    type: 'downplay',
    dataIndex: seriesDataNum
  })
  clearInterval(intervalInstance)
  intervalInstance = null
}

// 处理鼠标聚焦高亮内容
const handleHighlight = () => {
  clearPieInterval()
}

// 处理鼠标取消悬浮
const handleDownplay = () => {
  if (props.chartConfig.option.isCarousel && !intervalInstance) {
    // 恢复轮播
    addPieInterval(undefined, true)
  }
}

watch(
  () => props.chartConfig.option.type,
  newData => {
    try {
      // 防止初始化时触发修改，导致部分参数丢失
      if (isPreview()) {
        return
      }
      if (newData === 'nomal') {
        props.chartConfig.option.series[0].radius = '70%'
        props.chartConfig.option.series[0].roseType = false
      } else if (newData === 'ring') {
        props.chartConfig.option.series[0].radius = ['40%', '65%']
        props.chartConfig.option.series[0].roseType = false
      } else {
        props.chartConfig.option.series[0].radius = '70%'
        props.chartConfig.option.series[0].roseType = true
      }
    } catch (error) {
      console.log(error)
    }
  },
  { deep: false, immediate: true }
)

watch(
  () => props.chartConfig.option.isCarousel,
  newData => {
    if (newData) {
      addPieInterval(undefined, true)
      props.chartConfig.option.legend.show = false
    } else {
      props.chartConfig.option.legend.show = true
      clearPieInterval()
    }
  }
)


// // 监听面板传来的维度变化，告诉饼图哪列是分类(name)，哪列是数值(value)
// watch(
//   () => props.chartConfig.option.dataset?.dimensions,
//   (newDimensions: any) => {
//     try {
//       if (!Array.isArray(newDimensions) || newDimensions.length < 2) return
//       const series = props.chartConfig.option.series
//       if (series && series.length > 0) {
//         series[0].encode = {
//           itemName: newDimensions[0], // 维度字段（分类名 X 轴）
//           value: newDimensions[1],    // 指标字段（数值 Y 轴）
//         }
//         // 强行清空可能引发冲突的静态假数据，把舞台完全交给 dataset
//         series[0].data = []
//       }
//     } catch (error) {
//       console.warn('[PieCommon] 动态计算 encode 失败:', error)
//     }
//   },
//   { deep: true, immediate: true }
// )

// 正确接收二维数据 
const { vChartRef } = useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  // 🚨 确保控制台传来的数据被正确挂载
  props.chartConfig.option.dataset = newData
  
  clearPieInterval()
  if (props.chartConfig.option.isCarousel) {
    addPieInterval(newData)
  }
})

onMounted(() => {
  seriesDataMaxLength = dataJson.source.length
  if (props.chartConfig.option.isCarousel) {
    addPieInterval(undefined, true)
  }
})
</script>
