<template>
  <div style="position: relative; width: 100%; height: 100%; overflow: hidden">
    <!-- 边框层：固定使用 Border04 -->
    <component
      v-if="borderComponent"
      :is="borderComponent"
      :chartConfig="fakeBorderConfig"
      style="position: absolute; inset: 0; pointer-events: none; z-index: 1"
    />
    <!-- 指标翻牌器内容层 -->
    <div
      class="go-metric-flipper"
      :style="{
        position: 'absolute',
        inset: 0,
        padding: `${padding}px`,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }"
    >
      <!-- 主数字区域 -->
      <div class="metric-main-value" style="display: flex; align-items: baseline; gap: 8px">
        <n-space :size="mainValueOption.flipperGap" align="center" justify="center">
          <flipper
            :count="item"
            :width="mainValueOption.flipperWidth"
            :height="mainValueOption.flipperHeight"
            :front-color="mainValueOption.flipperTextColor"
            :back-color="mainValueOption.flipperBgColor"
            :radius="mainValueOption.flipperRadius"
            :flip-type="mainValueOption.flipperType"
            :duration="mainValueOption.flipperSpeed"
            :border-width="mainValueOption.flipperBorderWidth"
            v-for="(item, index) in flipperData"
            :key="index"
            class="go-d-block"
          />
        </n-space>
        <!-- 单位（完整文字属性） -->
        <span
          v-if="unitOption.text"
          :style="{
            fontSize: `${unitOption.fontSize}px`,
            color: unitOption.fontColor,
            fontWeight: unitOption.fontWeight,
            letterSpacing: `${unitOption.letterSpacing}px`,
            textShadow: unitOption.showShadow
              ? `${unitOption.hShadow}px ${unitOption.vShadow}px ${unitOption.blurShadow}px ${unitOption.colorShadow}`
              : 'none'
          }"
        >
          {{ unitOption.text }}
        </span>
      </div>

      <!-- 子指标区域 -->
      <div
        v-if="subMetrics && subMetrics.length > 0"
        class="metric-sub-metrics"
        :style="{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          marginTop: '16px'
        }"
      >
        <div v-for="(metric, index) in subMetrics" :key="index" class="sub-metric-item" style="text-align: center; flex: 1">
          <!-- 子指标标签（完整文字属性） -->
          <div
            :style="{
              fontSize: `${subMetricLabelOption.fontSize}px`,
              color: subMetricLabelOption.fontColor,
              fontWeight: subMetricLabelOption.fontWeight,
              letterSpacing: `${subMetricLabelOption.letterSpacing}px`,
              textShadow: subMetricLabelOption.showShadow
                ? `${subMetricLabelOption.hShadow}px ${subMetricLabelOption.vShadow}px ${subMetricLabelOption.blurShadow}px ${subMetricLabelOption.colorShadow}`
                : 'none',
              marginBottom: '4px',
              opacity: 0.8
            }"
          >
            {{ metric.label }}
          </div>
          <!-- 子指标数值（完整文字属性） -->
          <div
            :style="{
              fontSize: `${subMetricValueOption.fontSize}px`,
              color: subMetricValueOption.fontColor,
              fontWeight: subMetricValueOption.fontWeight,
              letterSpacing: `${subMetricValueOption.letterSpacing}px`,
              textShadow: subMetricValueOption.showShadow
                ? `${subMetricValueOption.hShadow}px ${subMetricValueOption.vShadow}px ${subMetricValueOption.blurShadow}px ${subMetricValueOption.colorShadow}`
                : 'none'
            }"
          >
            {{ metric.value }}{{ metric.unit || '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType, watch, ref, shallowRef, computed, onUnmounted } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { useChartDataFetch } from '@/hooks'
import { Flipper } from '@/components/Pages/Flipper'
import { getPropertyLogAgg, getPropertyLogList } from '@/api/thingsDevice'
import type { MainValueOptionType, UnitOptionType, SubMetricType, FontStyleOption, Border04OptionType } from './config'

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
    console.warn(`[BorderMetricFlipper] 未找到边框模块: ${path}`)
    return
  }
  const mod = (await loader()) as any
  borderComponent.value = mod.default
}

// 组件加载时立即加载边框
loadBorderComponent()

// 内边距
const padding = computed(() => props.chartConfig.option.padding ?? 20)

// 边框子配置
const fakeBorderConfig = computed(() => ({
  ...props.chartConfig,
  option: props.chartConfig.option.borderOption as Border04OptionType,
}))

// 配置引用
const mainValueOption = computed(() => props.chartConfig.option.mainValueOption as MainValueOptionType)
const unitOption = computed(() => props.chartConfig.option.unitOption as UnitOptionType)
const subMetrics = computed(() => props.chartConfig.option.subMetrics as SubMetricType[])
const subMetricLabelOption = computed(() => props.chartConfig.option.subMetricLabelOption as FontStyleOption)
const subMetricValueOption = computed(() => props.chartConfig.option.subMetricValueOption as FontStyleOption)

// 翻牌器数据
const flipperData = ref<string[] | number[]>([])

const getFlipperData = (val: string | number) => {
  return val
    .toString()
    .padStart(mainValueOption.value.flipperLength, '0')
    .split('')
    .slice(mainValueOption.value.flipperLength * -1)
}

const updateDatasetHandler = (newVal: string | number) => {
  flipperData.value = getFlipperData(newVal)
}

// 监听主数字配置变化
watch(
  () => props.chartConfig.option.mainValueOption,
  newVal => {
    try {
      updateDatasetHandler((newVal as MainValueOptionType).dataset)
    } catch (error) {
      console.log(error)
    }
  },
  {
    immediate: true,
    deep: true
  }
)

// ===================== 内置聚合数据获取 =====================

let aggPollingTimer: any = null

const updateMetrics = (converted: { main: number; max: number; min: number; avg: number }) => {
  updateDatasetHandler(converted.main)
  const subs = props.chartConfig.option.subMetrics
  if (subs[0]) subs[0].value = converted.max
  if (subs[1]) subs[1].value = converted.min
  if (subs[2]) subs[2].value = converted.avg
}

const fetchAggData = async () => {
  const cfg = props.chartConfig.option.aggDataSource
  if (!cfg?.dataID) return

  const now = Date.now()
  const rangeMap: Record<string, number> = { '1d': 86400000, '7d': 604800000, '30d': 2592000000 }
  const timeStart = now - (rangeMap[cfg.timeRange] ?? 86400000)
  const timeEnd = now

  try {
    const res: any = await getPropertyLogAgg({
      productID: cfg.productID || undefined,
      productCategoryID: !cfg.productID ? (cfg.productCategoryID || undefined) : undefined,
      areaIDs: cfg.areaIDs?.length ? cfg.areaIDs.map((id: string) => Number(id)) : undefined,
      interval: cfg.interval,
      intervalUnit: cfg.intervalUnit,
      timeStart,
      timeEnd,
      aggs: [{
        dataID: cfg.dataID,
        argFuncs: cfg.aggFuncs ?? ['avg', 'min', 'max', 'last'],
        noFirstTs: true,
      }],
    })

    // 解析响应：res = { code: 200, data: { list: [...] } }
    const data = res?.data ?? res
    const valuesMap = data?.list?.[0]?.values?.[0]?.values ?? {}
    const converted = {
      main: parseFloat(valuesMap.last?.value ?? valuesMap.avg?.value ?? '0'),
      max: parseFloat(valuesMap.max?.value ?? '0'),
      min: parseFloat(valuesMap.min?.value ?? '0'),
      avg: parseFloat(valuesMap.avg?.value ?? '0'),
    }
    updateMetrics(converted)
  } catch (error) {
    console.warn('[BorderMetricFlipper] 聚合数据获取失败:', error)
  }
}

const startAggPolling = () => {
  stopAggPolling()
  const cfg = props.chartConfig.option.aggDataSource
  if (!cfg?.enabled) return
  fetchAggData()
  const interval = (cfg.pollingInterval ?? 60) * 1000
  aggPollingTimer = setInterval(fetchAggData, interval)
}

const stopAggPolling = () => {
  if (aggPollingTimer) { clearInterval(aggPollingTimer); aggPollingTimer = null }
}

watch(() => props.chartConfig.option.aggDataSource, startAggPolling, { deep: true, immediate: true })
onUnmounted(stopAggPolling)

// ===================== 标准数据获取（静态/AJAX/公共接口） =====================

useChartDataFetch(props.chartConfig, useChartEditStore, (newVal: any) => {
  // 内置数据源启用时跳过标准模式
  if (props.chartConfig.option.aggDataSource?.enabled) return

  // IoT agg+latest 格式：{ dimensions: ['agg', 'Ps'], source: [{ agg: 'avg', Ps: 1234 }, ...] }
  if (newVal && newVal.dimensions && Array.isArray(newVal.source)) {
    const dataID = newVal.dimensions[1]
    const sourceMap: Record<string, number> = {}
    ;(newVal.source as any[]).forEach((row: any) => {
      if (row.agg) sourceMap[row.agg] = Number(row[dataID] ?? 0)
    })
    updateDatasetHandler(sourceMap['last'] ?? sourceMap['avg'] ?? 0)
    if (props.chartConfig.option.subMetrics[0]) props.chartConfig.option.subMetrics[0].value = sourceMap['max'] ?? 0
    if (props.chartConfig.option.subMetrics[1]) props.chartConfig.option.subMetrics[1].value = sourceMap['min'] ?? 0
    if (props.chartConfig.option.subMetrics[2]) props.chartConfig.option.subMetrics[2].value = sourceMap['avg'] ?? 0
    return
  }

  // 对象格式：{ main, max, min, avg }
  if (typeof newVal === 'object' && newVal !== null) {
    if (newVal.main !== undefined) {
      updateDatasetHandler(newVal.main)
    }
    if (newVal.max !== undefined && props.chartConfig.option.subMetrics[0]) {
      props.chartConfig.option.subMetrics[0].value = newVal.max
    }
    if (newVal.min !== undefined && props.chartConfig.option.subMetrics[1]) {
      props.chartConfig.option.subMetrics[1].value = newVal.min
    }
    if (newVal.avg !== undefined && props.chartConfig.option.subMetrics[2]) {
      props.chartConfig.option.subMetrics[2].value = newVal.avg
    }
  } else {
    // 简单数字格式
    updateDatasetHandler(newVal)
  }
})
</script>

<style lang="scss" scoped>
@include go('metric-flipper') {
  width: 100%;
  height: 100%;

  .sub-metric-item {
    flex: 1;
  }
}
</style>
