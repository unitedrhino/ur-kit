<template>
  <div style="position: relative; width: 100%; height: 100%; overflow: hidden">
    <!-- 边框层：固定使用 Border04 -->
    <component
      v-if="borderComponent"
      :is="borderComponent"
      :chartConfig="fakeBorderConfig"
      style="position: absolute; inset: 0; pointer-events: none; z-index: 1"
    />
    <!-- 双图表内容层 -->
    <div
      class="go-dual-chart"
      :style="{
        position: 'absolute',
        inset: 0,
        padding: `${paddingTop}px ${padding}px ${padding}px`,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column'
      }"
    >
      <!-- 顶部图表容器 -->
      <div
        class="top-chart-container"
        :style="{ height: `${layoutOption.topHeightPercent}%`, position: 'relative' }"
      >
        <!-- 图表标题 -->
        <div
          v-if="layoutOption.showChartTitles && topChartOption.title"
          :style="{
            position: 'absolute',
            top: '0',
            left: '0',
            fontSize: `${layoutOption.titleOption.fontSize}px`,
            color: layoutOption.titleOption.fontColor,
            fontWeight: layoutOption.titleOption.fontWeight,
            letterSpacing: `${layoutOption.titleOption.letterSpacing}px`,
            textShadow: layoutOption.titleOption.showShadow
              ? `${layoutOption.titleOption.hShadow}px ${layoutOption.titleOption.vShadow}px ${layoutOption.titleOption.blurShadow}px ${layoutOption.titleOption.colorShadow}`
              : 'none',
            zIndex: 10
          }"
        >
          {{ topChartOption.title }}
        </div>
        <!-- ECharts 实例 -->
        <v-chart
          :option="mergedTopChartOption"
          :init-options="initOptions"
          :update-options="{ replaceMerge: ['series'] }"
          autoresize
          style="width: 100%; height: 100%"
        />
      </div>

      <!-- 间距 -->
      <div :style="{ height: `${layoutOption.verticalGap}px` }"></div>

      <!-- 底部图表容器 -->
      <div
        class="bottom-chart-container"
        :style="{ height: `${layoutOption.bottomHeightPercent}%`, position: 'relative' }"
      >
        <!-- 图表标题 -->
        <div
          v-if="layoutOption.showChartTitles && bottomChartOption.title"
          :style="{
            position: 'absolute',
            top: '0',
            left: '0',
            fontSize: `${layoutOption.titleOption.fontSize}px`,
            color: layoutOption.titleOption.fontColor,
            fontWeight: layoutOption.titleOption.fontWeight,
            letterSpacing: `${layoutOption.titleOption.letterSpacing}px`,
            textShadow: layoutOption.titleOption.showShadow
              ? `${layoutOption.titleOption.hShadow}px ${layoutOption.titleOption.vShadow}px ${layoutOption.titleOption.blurShadow}px ${layoutOption.titleOption.colorShadow}`
              : 'none',
            zIndex: 10
          }"
        >
          {{ bottomChartOption.title }}
        </div>
        <!-- ECharts 实例 -->
        <v-chart
          :option="mergedBottomChartOption"
          :init-options="initOptions"
          :update-options="{ replaceMerge: ['series'] }"
          autoresize
          style="width: 100%; height: 100%"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType, computed, shallowRef, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  DatasetComponent,
  GridComponent,
  TooltipComponent,
} from 'echarts/components'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { useChartDataFetch } from '@/hooks'
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook'
import type { SingleChartOptionType, DualChartLayoutOptionType, Border04OptionType } from './config'

use([CanvasRenderer, BarChart, LineChart, DatasetComponent, GridComponent, TooltipComponent])

// 用 import.meta.glob 预声明所有边框模块
const borderModules = import.meta.glob('../../Borders/*/index.vue')

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})

// 动态加载边框 Vue 组件（固定 Border04）
const borderComponent = shallowRef<any>(null)

const loadBorderComponent = async () => {
  const path = '../../Borders/Border04/index.vue'
  const loader = borderModules[path]
  if (!loader) {
    console.warn(`[BorderDualChart] 未找到边框模块: ${path}`)
    return
  }
  const mod = (await loader()) as any
  borderComponent.value = mod.default
}

// 组件加载时立即加载边框
loadBorderComponent()

// 内边距
const padding = computed(() => props.chartConfig.option.padding ?? 20)

// 顶部内边距（考虑边框标题栏高度，Border04 标题栏约占用 32-53px）
const paddingTop = computed(() => {
  const basePadding = props.chartConfig.option.padding ?? 20
  const borderTitleHeight = props.chartConfig.option.borderOption?.borderTitleHeight ?? 32
  return basePadding + borderTitleHeight + 10 // 额外 10px 间距
})

// 边框子配置
const fakeBorderConfig = computed(() => ({
  ...props.chartConfig,
  option: props.chartConfig.option.borderOption as Border04OptionType,
}))

// 配置引用
const topChartOption = computed(() => props.chartConfig.option.topChartOption as SingleChartOptionType)
const bottomChartOption = computed(() => props.chartConfig.option.bottomChartOption as SingleChartOptionType)
const layoutOption = computed(() => props.chartConfig.option.layoutOption as DualChartLayoutOptionType)

// 合并顶部图表 option
const mergedTopChartOption = computed(() => ({
  dataset: topChartOption.value.dataset,
  series: topChartOption.value.series,
  xAxis: topChartOption.value.xAxis,
  yAxis: topChartOption.value.yAxis,
  grid: topChartOption.value.grid,
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderColor: '#333',
    textStyle: { color: '#fff' }
  }
}))

// 合并底部图表 option
const mergedBottomChartOption = computed(() => ({
  dataset: bottomChartOption.value.dataset,
  series: bottomChartOption.value.series,
  xAxis: bottomChartOption.value.xAxis,
  yAxis: bottomChartOption.value.yAxis,
  grid: bottomChartOption.value.grid,
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderColor: '#333',
    textStyle: { color: '#fff' }
  }
}))

// ECharts 初始化选项
const initOptions = useCanvasInitOptions(
  { dataset: topChartOption.value.dataset, series: topChartOption.value.series },
  {}
)

// name-value 格式下的时序累积缓冲（每次 poll 追加一个时间点，形成折线）
const topBuffer = ref<{ _timestamp: number; value: number | string }[]>([])
const bottomBuffer = ref<{ _timestamp: number; value: number | string }[]>([])
let lastTopField = ''
let lastBottomField = ''
const MAX_BUFFER = 200

// 缓存最后一次收到的原始数据，供 fieldMapping 变化时立即重新处理
const lastRawData = ref<any>(null)

// 数据处理核心逻辑（抽出来，便于 fieldMapping 变化时复用）
const processData = (newData: any) => {
  // 支持分离数据集（向后兼容）
  if (newData.topDataset && newData.bottomDataset) {
    props.chartConfig.option.topChartOption.dataset = newData.topDataset
    props.chartConfig.option.bottomChartOption.dataset = newData.bottomDataset
    return
  }

  // 单数据集模式
  if (newData.dimensions && newData.source) {
    // 存储原始 dataset 供映射器读取字段列表
    props.chartConfig.option.dataset = {
      dimensions: [...newData.dimensions],
      source: newData.source,
    }

    const mapping = props.chartConfig.option.fieldMapping
    const dims = newData.dimensions
    const isNameValue = dims.includes('name') && dims.includes('value')

    if (isNameValue) {
      // name-value 格式（prop+latest）：_timestamp 在顶层，source 是当次所有属性快照
      // 将每次 poll 的值追加到缓冲，形成时序折线
      const ts: number = (newData as any)._timestamp ?? Date.now()

      // 映射变更时清空旧缓冲，避免混用不同属性的数据
      if (mapping?.topField !== lastTopField) {
        topBuffer.value = []
        lastTopField = mapping?.topField ?? ''
      }
      if (mapping?.bottomField !== lastBottomField) {
        bottomBuffer.value = []
        lastBottomField = mapping?.bottomField ?? ''
      }

      if (mapping?.topField) {
        const row = newData.source.find((r: any) => r.name === mapping.topField)
        if (row !== undefined) {
          topBuffer.value.push({ _timestamp: ts, value: row.value })
          if (topBuffer.value.length > MAX_BUFFER) topBuffer.value.shift()
          props.chartConfig.option.topChartOption.dataset = {
            dimensions: ['_timestamp', 'value'],
            source: [...topBuffer.value],
          }
          props.chartConfig.option.topChartOption.series.forEach((s: any) => {
            s.encode = { x: '_timestamp', y: 'value' }
          })
          props.chartConfig.option.topChartOption.xAxis.type = 'time'
        }
      }
      if (mapping?.bottomField) {
        const row = newData.source.find((r: any) => r.name === mapping.bottomField)
        if (row !== undefined) {
          bottomBuffer.value.push({ _timestamp: ts, value: row.value })
          if (bottomBuffer.value.length > MAX_BUFFER) bottomBuffer.value.shift()
          props.chartConfig.option.bottomChartOption.dataset = {
            dimensions: ['_timestamp', 'value'],
            source: [...bottomBuffer.value],
          }
          props.chartConfig.option.bottomChartOption.series.forEach((s: any) => {
            s.encode = { x: '_timestamp', y: 'value' }
          })
          props.chartConfig.option.bottomChartOption.xAxis.type = 'time'
        }
      }
    } else {
      // 多列格式：按 dimension key 拆分
      const xField = dims[0]
      const isTimestamp = xField === '_timestamp' || xField === 'timestamp'
      const xAxisType = isTimestamp ? 'time' : 'category'

      const topField = mapping?.topField || dims[1]
      if (topField) {
        props.chartConfig.option.topChartOption.dataset = {
          dimensions: [xField, topField],
          source: newData.source,
        }
        props.chartConfig.option.topChartOption.series.forEach((s: any) => {
          s.encode = { x: xField, y: topField }
        })
        props.chartConfig.option.topChartOption.xAxis.type = xAxisType
      }
      const bottomField = mapping?.bottomField || dims[2] || topField
      if (bottomField) {
        props.chartConfig.option.bottomChartOption.dataset = {
          dimensions: [xField, bottomField],
          source: newData.source,
        }
        props.chartConfig.option.bottomChartOption.series.forEach((s: any) => {
          s.encode = { x: xField, y: bottomField }
        })
        props.chartConfig.option.bottomChartOption.xAxis.type = xAxisType
      }
    }
  }
}

// 数据获取：收到新数据时缓存并处理
useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  lastRawData.value = newData
  processData(newData)
})

// fieldMapping 变化时用缓存数据立即重新处理，无需等下一次轮询
watch(
  () => props.chartConfig.option.fieldMapping,
  () => {
    if (lastRawData.value) processData(lastRawData.value)
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
@include go('dual-chart') {
  width: 100%;
  height: 100%;
}
</style>
