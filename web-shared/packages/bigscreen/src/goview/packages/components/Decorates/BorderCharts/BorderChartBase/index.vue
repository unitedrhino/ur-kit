<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div class="border-chart-container" style="position: relative; width: 100%; height: 100%; overflow: hidden">
    <!-- 边框层：动态加载对应边框模块，pointer-events:none 不拦截图表交互 -->
    <component
      v-if="borderComponent"
      :is="borderComponent"
      :chartConfig="fakeBorderConfig"
      style="position: absolute; inset: 0; pointer-events: none; z-index: 1"
    />
    <!-- 标题层：absolute 定位，叠加在边框上方，不占用图表空间 -->
    <div
      v-if="titleConfig.show && titleConfig.text"
      class="border-title-layer"
      :style="titleStyle"
    >
      {{ titleConfig.text }}
    </div>
    <!-- ECharts 图表层（柱状图/折线图/饼图） -->
    <v-chart
      v-if="!isCapsuleChart"
      :key="props.chartConfig.option.chartKey"
      ref="vChartRef"
      :init-options="initOptions"
      :theme="themeColor"
      :option="mergedChartOption"
      :update-options="{ replaceMerge: replaceMergeArr }"
      autoresize
      :style="chartStyle"
    />

    <!-- 胶囊条形图 HTML 层（CapsuleCommon） -->
    <div
      v-if="isCapsuleChart && capsuleState.mergedConfig"
      ref="capsuleChartRef"
      class="go-dv-capsule-chart"
      :style="capsuleChartStyle"
    >
      <!-- 滚动容器 -->
      <div
        class="scroll-wrapper"
        :style="{
          transform: `translateY(-${scrollOffset}px)`,
          transition: isScrollingState ? 'transform 0.5s ease-in-out' : 'none'
        }"
      >
        <div class="label-column">
          <div
            v-for="(item, index) in (capsuleState.mergedConfig.dataset?.source || [])"
            :key="capsuleItemKey(item, index)"
            :style="{ height: capsuleState.capsuleItemHeight, lineHeight: capsuleState.capsuleItemHeight }"
          >
            <!-- dimensions[0] 缺失时按空索引兜底（正常数据必然存在） -->
            {{ item[capsuleState.mergedConfig.dataset.dimensions[0] ?? ''] }}
          </div>
          <div class="laset">&nbsp;</div>
        </div>

        <div class="capsule-container">
          <div
            v-for="(capsule, index) in capsuleState.capsuleLength"
            :key="index"
            class="capsule-item"
            :style="{ height: capsuleState.capsuleItemHeight }"
          >
            <div
              class="capsule-item-column"
              :style="capsuleBarStyle(capsule, index)"
            >
              <div v-if="capsuleState.mergedConfig.showValue" class="capsule-item-value">
                {{ capsuleState.capsuleValue[index] }}
              </div>
            </div>
          </div>

          <div class="unit-label">
            <div v-for="(label, index) in capsuleState.labelData" :key="label + index">
              {{ label }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="capsuleState.mergedConfig.unit" class="unit-text">
        {{ capsuleState.mergedConfig.unit }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, ref, reactive, shallowRef, watch, nextTick, onUnmounted, type CSSProperties, type PropType } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  DatasetComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import isObject from 'lodash/isObject'
import cloneDeep from 'lodash/cloneDeep'
import dayjs from 'dayjs'

import type { CreateComponentType } from '@/packages/index.type'
import { mergeTheme } from '@/packages/public/chart'
import { useChartDataFetch } from '@/hooks'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { isPreview } from '@/utils'
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook'
import { useBorderLoader } from '@/composables/useBorderLoader'

use([CanvasRenderer, BarChart, LineChart, PieChart, DatasetComponent, GridComponent, TooltipComponent, LegendComponent])

const props = defineProps({
  themeSetting: {
    type: Object,
    required: true,
  },
  themeColor: {
    type: Object,
    required: true,
  },
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true,
  },
})

// 使用 useBorderLoader 加载边框组件
const borderKeyRef = computed(() => props.chartConfig.option.borderKey || 'Border01')
const { borderComponent, createFakeBorderConfig } = useBorderLoader(borderKeyRef)

// 内边距
const padding = computed(() => props.chartConfig.option.padding ?? 16)

// 标题配置（确保 borderTitle 对象存在）
const titleConfig = computed(() => {
  const borderOpt = props.chartConfig.option.borderOption || {}
  // 兼容 Border04 的旧配置格式
  if (typeof borderOpt.borderTitle === 'string') {
    // Border04 旧格式：borderTitle 是字符串
    return {
      show: !!borderOpt.borderTitle,
      text: borderOpt.borderTitle || '',
      position: 'center',
      fontSize: borderOpt.borderTitleSize || 18,
      fontColor: borderOpt.borderTitleColor || '#fff',
      fontWeight: 'normal',
      letterSpacing: 0,
      top: (borderOpt.borderTitleHeight || 32) - 5,
      sideOffset: 20,
    }
  }
  // 新配置格式：borderTitle 是对象
  if (!borderOpt.borderTitle || typeof borderOpt.borderTitle !== 'object') {
    // 初始化默认配置
    borderOpt.borderTitle = {
      show: false,
      text: '',
      position: 'center',
      fontSize: 18,
      fontColor: '#fff',
      fontWeight: 'normal',
      letterSpacing: 0,
      top: 20,
      sideOffset: 20,
    }
  }
  return borderOpt.borderTitle
})

// 标题样式（absolute 定位，叠加在边框上方）
const titleStyle = computed(() => {
  const cfg = titleConfig.value
  let left = '50%'
  let transform = 'translateX(-50%)'

  if (cfg.position === 'left') {
    left = `${cfg.sideOffset}px`
    transform = 'none'
  } else if (cfg.position === 'right') {
    left = `calc(100% - ${cfg.sideOffset}px)`
    transform = 'translateX(-100%)'
  }

  // 字面量（如 pointerEvents: 'none'）会拓宽为 string，按 CSSProperties 收窄以满足 :style 类型
  return {
    position: 'absolute',
    top: `${cfg.top}px`,
    left,
    transform,
    fontSize: `${cfg.fontSize}px`,
    color: cfg.fontColor,
    fontWeight: cfg.fontWeight,
    letterSpacing: `${cfg.letterSpacing}px`,
    zIndex: 2,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  } as CSSProperties
})

// 图表样式（优化后的动态边距计算）
const chartStyle = computed(() => {
  const basePadding = padding.value
  let paddingTop = basePadding
  
  // 重点优化 1：给底部增加一个固定的安全缓冲高度（如 15px 或 20px）
  // 这样无论 basePadding 调得多小，X 轴文字都不会撞到底部边框图案
  let paddingBottom = basePadding + 15 

  if (titleConfig.value.show && titleConfig.value.text) {
    // 重点优化 2：适当减小顶部缓冲间距（把之前的 +15 改为 +5 或 +8）
    // 因为图例和标题之间本身就会有自然的行距，不需要刻意压得太狠
    const titleSpace = titleConfig.value.top + titleConfig.value.fontSize + 5
    paddingTop = Math.max(basePadding, titleSpace)
  }

  return {
    position: 'absolute' as const,
    inset: 0,
    // 依次为：上 右 下 左 (Top, Right, Bottom, Left)
    padding: `${paddingTop}px ${basePadding}px ${paddingBottom}px ${basePadding}px`,
    zIndex: 3
  }
})

// 边框子配置：把 borderOption 作为 option 传入边框组件
const fakeBorderConfig = computed(() => ({
  ...props.chartConfig,
  option: props.chartConfig.option.borderOption,
}))

// ECharts 合并主题后的 option
// 同时将饼图 type（nomal/ring/rose）直接映射为 series[0].radius + roseType，
// 避免依赖独立 watch 的两步更新链路（watch 先改 radius，computed 再感知）。
const mergedChartOption = computed(() => {
  const chartOpt = props.chartConfig.option.chartOption
  const opt = mergeTheme(chartOpt, props.themeSetting, [])

  // 标题使用 absolute 定位，不占用图表空间
  // 图表保持原有配置，用户需要手动增加组件高度以容纳标题

  // 饼图类型映射：直接读 chartOpt.type 以建立响应式依赖
  const pieType = chartOpt?.type
  if (pieType && opt.series?.[0]) {
    const s = opt.series[0]
    if (pieType === 'nomal') { s.radius = '70%'; s.roseType = false }
    else if (pieType === 'ring') { s.radius = ['40%', '65%']; s.roseType = false }
    else if (pieType === 'rose') { s.radius = '70%'; s.roseType = true }
  }
  return opt
})

const initOptions = useCanvasInitOptions(props.chartConfig.option.chartOption, props.themeSetting)

// dataset 维度变化时同步 series 数量
const replaceMergeArr = ref<string[]>()

/*
watch(
  () => props.chartConfig.option.chartOption?.dataset,
  (newData: any, oldData: any) => {
    try {
      if (!isObject(newData) || !('dimensions' in newData)) return
      if (Array.isArray(newData?.dimensions) && Array.isArray(props.chartConfig.option.chartOption?.series)) {
        const newDims: string[] = Array.isArray(newData.dimensions) ? newData.dimensions : []
        const seriesArr = props.chartConfig.option.chartOption.series
        const neededSeries = Math.max(1, newDims.length - 1)
        // 用绝对数量对齐，避免与 updateCallback 的 series 调整产生叠加
        if (seriesArr.length > neededSeries) {
          seriesArr.splice(neededSeries)
        } else if (seriesArr.length < neededSeries) {
          const sample = cloneDeep(seriesArr[0] ?? { type: 'bar' })
          while (seriesArr.length < neededSeries) seriesArr.push(cloneDeep(sample))
        }
        // 维度名称变化时同步 series.encode 和 series.name，避免 ECharts 用旧列名渲染空图
        const oldDims: string[] = Array.isArray(oldData?.dimensions) ? oldData.dimensions : []
        const isPieWatcher = seriesArr?.[0]?.type === 'pie'
        if (oldDims.join(',') !== newDims.join(',') && newDims.length >= 2) {
          seriesArr.forEach((s: any, idx: number) => {
            if (isPieWatcher) {
              s.encode = { itemName: newDims[0], value: newDims[1] ?? '' }
            } else {
              s.encode = newDims[idx + 1] !== undefined
                ? { x: newDims[0], y: newDims[idx + 1] }
                : { x: newDims[0], y: '' }
              // 设置 series.name 用于图例显示
              s.name = newDims[idx + 1] ?? ''
            }
          })
        }
        replaceMergeArr.value = ['series']
        nextTick(() => { replaceMergeArr.value = [] })
      }
    } catch { /* ignore */ /* }
  },
  { deep: false },
)

*/

// dataset 变更时同步 series 数量和 encode，与 BarCommon/LineCommon 保持一致
watch(
  () => props.chartConfig.option.chartOption?.dataset,
  (newData: any, oldData: any) => {
    try {
      if (!isObject(newData) || !('dimensions' in newData)) return
      const newDims: string[] = Array.isArray(newData.dimensions) ? newData.dimensions : []
      if (newDims.length < 2) return

      const series = props.chartConfig.option.chartOption?.series
      if (!Array.isArray(series)) return

      const oldDims: string[] = Array.isArray(oldData?.dimensions) ? oldData.dimensions : []
      const neededSeries = Math.max(1, newDims.length - 1)

      // 对齐 series 数量（复用首项样式，保留 type/barWidth/smooth 等）
      if (series.length > neededSeries) {
        series.splice(neededSeries)
      } else if (series.length < neededSeries) {
        const sample = cloneDeep(series[0] ?? { type: 'bar' })
        while (series.length < neededSeries) series.push(cloneDeep(sample))
      }

      // 维度变化时同步 series.encode（与 BarCommon 的 dimsChanged 逻辑一致）
      if (oldDims.join(',') !== newDims.join(',')) {
        const isPie = series[0]?.type === 'pie'
        series.forEach((s: any, idx: number) => {
          if (isPie) {
            s.encode = { itemName: newDims[0], value: newDims[1] ?? '' }
          } else {
            s.encode = newDims[idx + 1] !== undefined
              ? { x: newDims[0], y: newDims[idx + 1] }
              : { x: newDims[0], y: '' }
            s.name = newDims[idx + 1] ?? ''
          }
        })
      }

      replaceMergeArr.value = ['series']
      nextTick(() => { replaceMergeArr.value = [] })
    } catch { /* ignore */ }
  },
  { deep: false }
)

// 数据获取：callback 处理长表→宽表转换后写 dataset，由上方 watch 负责 series 同步
const { vChartRef } = useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  if (!props.chartConfig.option.chartOption) return
  const chartOption = props.chartConfig.option.chartOption
  const series = chartOption?.series
  if (!Array.isArray(series)) {
    chartOption.dataset = newData
    // 胶囊条形图：同步更新渲染状态
    if (isCapsuleChart.value) {
      calcCapsuleData(newData, 'preview')
    }
    return
  }

  const isPie = series[0]?.type === 'pie'

  // 饼图：直接使用长表 ['name','value']，name=分类，value=数值
  if (isPie) {
    chartOption.dataset = newData
    return
  }

  // 柱状图/折线图：检测 ['name','value'] 长表 → 转为宽表
  // 宽表格式：{ dimensions: ['时间', ...属性名], source: [{ 时间: 'HH:mm:ss', 属性A: val, 属性B: val }] }
  const dims = newData?.dimensions
  if (
    Array.isArray(dims) && dims.length === 2 && dims[0] === 'name' && dims[1] === 'value' &&
    Array.isArray(newData.source) && newData.source.length > 0
  ) {
    const src: any[] = newData.source
    const attrNames = src.map((r: any) => String(r.name))
    // 优先使用 API 返回的时间戳，无则取本地时间
    const ts = newData._timestamp ?? Date.now()
    const timeLabel = dayjs(ts).format('HH:mm:ss')

    const wideRow: Record<string, any> = { 时间: timeLabel }
    src.forEach((r: any) => { wideRow[String(r.name)] = Number(r.value) })

    chartOption.dataset = {
      dimensions: [editorT('orgManage.pointLog.time'), ...attrNames],
      source: [wideRow],
    }
    return
  }

  // 其他格式直接透传
  chartOption.dataset = newData
})

// ========== 胶囊条形图（CapsuleCommon）专用逻辑 ==========

// 判断当前是否为胶囊条形图
const isCapsuleChart = computed(() => props.chartConfig.option.chartKey === 'CapsuleCommon')

// 胶囊图渲染状态
interface CapsuleStateProps {
  mergedConfig: {
    dataset: { dimensions: string[]; source: any[] }
    colors: string[]
    unit: string
    itemHeight: number
    valueFontSize: number
    paddingRight: number
    paddingLeft: number
    showValue: boolean
    autoScroll: boolean
    scrollInterval: number
    scrollStep: number
  } | null
  capsuleLength: number[]
  capsuleValue: (string | number)[]
  labelData: number[]
  capsuleItemHeight: string
}

const capsuleState = reactive<CapsuleStateProps>({
  mergedConfig: null,
  capsuleLength: [],
  capsuleValue: [],
  labelData: [],
  capsuleItemHeight: '',
})

const capsuleChartRef = ref<HTMLElement | null>(null)
const scrollOffset = ref(0)
const isScrollingState = ref(false)
let scrollTimer: ReturnType<typeof setInterval> | null = null

// 胶囊图样式（复用标题 padding 逻辑）
const capsuleChartStyle = computed(() => {
  const basePadding = padding.value
  let paddingTop = basePadding
  let paddingBottom = basePadding + 15

  if (titleConfig.value.show && titleConfig.value.text) {
    const titleSpace = titleConfig.value.top + titleConfig.value.fontSize + 5
    paddingTop = Math.max(basePadding, titleSpace)
  }

  return {
    position: 'absolute' as const,
    inset: 0,
    padding: `${paddingTop}px ${basePadding}px ${paddingBottom}px ${basePadding}px`,
    zIndex: 3,
  }
})

// 计算单行高度
const capsuleItemTotalHeight = computed(() => {
  if (!capsuleState.mergedConfig) return 0
  return (Number(capsuleState.mergedConfig.itemHeight) || 10) + 10 // 10px margin
})

// 自动计算可见条目数
const autoVisibleItems = computed(() => {
  if (!capsuleChartRef.value || !capsuleState.mergedConfig) return 0
  const containerHeight = capsuleChartRef.value.clientHeight
  const availableHeight = containerHeight - 20 - 40 // 减去 unit-label(20) 和上下 padding(40)
  return Math.floor(availableHeight / capsuleItemTotalHeight.value)
})

// 是否需要滚动
const needCapsuleScroll = computed(() => {
  if (!isPreview() || !capsuleState.mergedConfig?.autoScroll) return false
  if (!capsuleState.mergedConfig?.dataset?.source?.length) return false
  return capsuleState.mergedConfig.dataset.source.length > autoVisibleItems.value
})

// 启动滚动
const startCapsuleScroll = () => {
  if (!needCapsuleScroll.value || !capsuleState.mergedConfig) return
  stopCapsuleScroll()
  const { scrollInterval, scrollStep, dataset } = capsuleState.mergedConfig
  const totalItems = dataset.source.length
  const maxOffset = (totalItems - autoVisibleItems.value) * capsuleItemTotalHeight.value

  scrollTimer = setInterval(() => {
    isScrollingState.value = true
    scrollOffset.value += (scrollStep || 1) * capsuleItemTotalHeight.value

    if (scrollOffset.value >= maxOffset) {
      setTimeout(() => {
        isScrollingState.value = false
        scrollOffset.value = 0
      }, (scrollInterval || 3000) / 2)
    }
  }, scrollInterval || 3000)
}

// 停止滚动
const stopCapsuleScroll = () => {
  if (scrollTimer) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }
}

// 胶囊图数据处理
const calcCapsuleLengthAndLabelData = (dataset: any) => {
  try {
    const { source } = dataset
    if (!source || source.length === 0) {
      capsuleState.capsuleLength = []
      capsuleState.labelData = []
      return
    }

    capsuleState.capsuleItemHeight = (capsuleState.mergedConfig?.itemHeight ?? 10) + 'px'
    const capsuleValue = source.map((item: any) =>
      // dimensions[1] 缺失时按空索引兜底（正常数据必然存在）
      item[capsuleState.mergedConfig!.dataset.dimensions[1] ?? '']
    )
    const maxValue = Math.max(...capsuleValue)

    capsuleState.capsuleValue = capsuleValue
    capsuleState.capsuleLength = capsuleValue.map((v: any) => (maxValue ? v / maxValue : 0))

    const oneFifth = maxValue / 5
    capsuleState.labelData = Array.from(new Set(new Array(6).fill(0).map((_, i) => Math.ceil(i * oneFifth))))

    // 数据更新后重新判断滚动
    nextTick(() => {
      if (needCapsuleScroll.value) {
        scrollOffset.value = 0
        startCapsuleScroll()
      } else {
        stopCapsuleScroll()
        scrollOffset.value = 0
      }
    })
  } catch (error) {
    console.error('[BorderChartBase] capsule data error:', error)
  }
}

const calcCapsuleData = (data: any, type?: string) => {
  const chartOpt = props.chartConfig.option.chartOption
  const cloneConfig = cloneDeep(chartOpt || {})
  capsuleState.mergedConfig = cloneConfig
  if (type === 'preview') {
    cloneConfig.dataset = data
  }
  if (capsuleState.mergedConfig?.dataset) {
    calcCapsuleLengthAndLabelData(capsuleState.mergedConfig.dataset)
  }
}

// 胶囊图条目 key
const capsuleItemKey = (item: any, index: number) => {
  const dim = capsuleState.mergedConfig?.dataset?.dimensions?.[0] ?? 'name'
  return `${item[dim]}-${index}`
}

// 胶囊条样式
const capsuleBarStyle = (capsule: number, index: number) => {
  const colors = capsuleState.mergedConfig?.colors ?? []
  const color = colors[index % colors.length] || '#c4ebad'
  return `width: ${capsule * 100}%; background-color: ${color}; height: calc(100% - 2px);`
}

// 监听 chartOption 变化（胶囊模式静态数据/配置修改）
watch(
  () => isCapsuleChart.value ? props.chartConfig.option.chartOption : null,
  (newVal) => {
    if (newVal) calcCapsuleData(newVal)
  },
  { deep: true, immediate: true }
)

// 监听滚动需求变化
watch(needCapsuleScroll, (val) => {
  if (val) {
    scrollOffset.value = 0
    startCapsuleScroll()
  } else {
    stopCapsuleScroll()
    scrollOffset.value = 0
  }
})

// 清理
onUnmounted(() => stopCapsuleScroll())
</script>

<style lang="scss" scoped>
.border-title-layer {
  font-family: 'Microsoft YaHei', sans-serif;
  text-shadow: 0 0 10px currentColor;
}

// 胶囊条形图样式（移植自 BorderCapsuleChart）
.go-dv-capsule-chart {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
  padding: 20px;
  padding-right: 50px;
  color: #b9b8cc;
  overflow: hidden;

  .scroll-wrapper {
    display: flex;
    flex-direction: row;
    flex: 1;
    height: 100%;
    overflow: hidden;
  }

  .label-column {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    padding-right: 10px;
    text-align: right;
    > div:not(:last-child) {
      margin: 5px 0;
    }
  }

  .capsule-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .capsule-item {
    box-shadow: 0 0 3px #999;
    height: 10px;
    margin: 5px 0px;
    border-radius: 5px;

    .capsule-item-column {
      position: relative;
      height: 8px;
      margin-top: 1px;
      border-radius: 5px;
      transition: all 0.3s;
      display: flex;
      justify-content: flex-end;
      align-items: center;

      .capsule-item-value {
        padding-left: 10px;
        transform: translateX(100%);
      }
    }
  }

  .unit-label {
    height: 20px;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .unit-text {
    text-align: right;
    display: flex;
    align-items: flex-end;
    line-height: 20px;
    margin-left: 10px;
  }
}
</style>
