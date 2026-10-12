<template>
  <DecoratedTableView :chart-config="chartConfig">
    <div class="go-tables-rank" :style="`color: ${textColor}`">
      <div
        v-for="(item, i) in status.rows"
        :key="item.toString() + item.scroll"
        class="row-item"
        :style="`height: ${status.heights[i]}px;`"
      >
        <div class="ranking-info">
          <div class="rank" :style="`color: ${color};font-size: ${indexFontSize}px`">No.{{ item.ranking }}</div>
          <div class="info-name" :style="`font-size: ${leftFontSize}px`">{{ item.name }}</div>
          <div class="ranking-value" :style="`color: ${textColor};font-size: ${rightFontSize}px`">
            {{ formatDisplayValue(item) }}
            {{ unit }}
          </div>
        </div>
        <div class="ranking-column" :style="`border-color: ${borderColor}`">
          <div class="inside-column" :style="`width: ${item.percent}%;background-color: ${color}`">
            <div class="shine" />
          </div>
        </div>
      </div>
    </div>
  </DecoratedTableView>
</template>

<script setup lang="ts">
import type { CreateComponentType } from '@/packages/index.type'

import { computed, onUnmounted, reactive, toRefs, type PropType, watch } from 'vue'

import { useChartDataFetch } from '@/hooks'
import {
  ensureDecoratedChartOptionDefaults,
  resolveDecoratedChartTitleHeight,
} from '@/packages/components/Charts/shared/decoratedChartOptions'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'

import DecoratedTableView from '../../shared/DecoratedTableView.vue'
import { normalizeDatasetForTableList, resolveAutoUnitFromIoTDataset } from '../../shared/iotDataset'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true,
  },
})

const { h } = toRefs(props.chartConfig.attr)
const { rowNum, unit, color, textColor, borderColor, indexFontSize, leftFontSize, rightFontSize, displayDecimals } = toRefs(
  props.chartConfig.option,
)

ensureDecoratedChartOptionDefaults(props.chartConfig.option as Record<string, any>)

const contentHeight = computed(() => {
  const option = props.chartConfig.option as Record<string, any>
  const padding = option.containerType === 'border' ? Number(option.padding || 0) : 0
  const titleHeight = option.containerType === 'border'
    ? resolveDecoratedChartTitleHeight(option, option.borderOption?.borderTitle)
    : 0
  return Math.max(h.value - padding * 2 - titleHeight, 0)
})

const formatDisplayValue = (item: { value: any }) => {
  const digits = Math.max(0, Number(displayDecimals?.value ?? 0))
  const value = Number(item?.value ?? 0)
  if (Number.isFinite(value)) {
    return Number(value.toFixed(digits))
  }

  if (typeof status.mergedConfig.valueFormatter === 'function') {
    return status.mergedConfig.valueFormatter(item, { displayDecimals: digits })
  }

  return item?.value ?? ''
}

const status = reactive({
  mergedConfig: props.chartConfig.option,
  rowsData: [],
  rows: [
    {
      scroll: 0,
      ranking: 1,
      name: '',
      value: '',
      percent: 0,
    },
  ],
  heights: [0],
  animationIndex: 0,
  animationHandler: 0,
  updater: 0,
  avgHeight: 0,
})

const syncAutoUnit = (nextAutoUnit: string) => {
  const option = props.chartConfig.option as typeof props.chartConfig.option & { autoUnit?: string }
  const currentAutoUnit = option.autoUnit || ''
  const currentUnit = option.unit || ''
  option.autoUnit = nextAutoUnit

  if (!nextAutoUnit) {
    if (currentUnit === currentAutoUnit) {
      option.unit = ''
    }
    return
  }

  if (!currentUnit || currentUnit === currentAutoUnit) {
    option.unit = nextAutoUnit
  }
}

const calcRowsData = () => {
  let { dataset, rowNum, sort } = status.mergedConfig
  if (!Array.isArray(dataset)) return
  sort &&
    dataset.sort(({ value: a }, { value: b }) => {
      if (a > b) return -1
      if (a < b) return 1
      // NaN 等不可比较情况按相等处理（与 Array.sort 默认语义一致）
      return 0
    })
  const value = dataset.map(({ value }) => value)
  const min = Math.min(...value) || 0
  const minAbs = Math.abs(min)
  const max = Math.max(...value) || 0
  const total = max + minAbs
  dataset = dataset.map((row: any, i: number) => ({
    ...row,
    ranking: i + 1,
    percent: ((row.value + minAbs) / total) * 100,
  }))
  const rowLength = dataset.length
  if (rowLength > rowNum && rowLength < 2 * rowNum) {
    dataset = [...dataset, ...dataset]
  }
  dataset = dataset.map((d: any, i: number) => ({ ...d, scroll: i }))
  status.rowsData = dataset
  status.rows = dataset
}

const calcHeights = (onresize = false) => {
  const { rowNum, dataset } = status.mergedConfig
  const avgHeight = contentHeight.value / rowNum
  status.avgHeight = avgHeight
  if (!onresize) status.heights = new Array(dataset.length).fill(avgHeight)
}

const animation = async (start = false) => {
  let { avgHeight, animationIndex, mergedConfig, rowsData, updater } = status
  const { waitTime, carousel, rowNum } = mergedConfig
  const rowLength = rowsData.length
  if (rowNum >= rowLength) return
  if (start) {
    await new Promise(resolve => setTimeout(resolve, waitTime))
    if (updater !== status.updater) return
  }
  const animationNum = carousel === 'single' ? 1 : rowNum
  let rows = rowsData.slice(animationIndex)
  rows.push(...rowsData.slice(0, animationIndex))
  status.rows = rows.slice(0, rowNum + 1)
  status.heights = new Array(rowLength).fill(avgHeight)
  await new Promise(resolve => setTimeout(resolve, 300))
  if (updater !== status.updater) return
  status.heights.splice(0, animationNum, ...new Array(animationNum).fill(0))
  animationIndex += animationNum
  const back = animationIndex - rowLength
  if (back >= 0) animationIndex = back
  status.animationIndex = animationIndex
  status.animationHandler = setTimeout(animation, waitTime * 1000 - 300) as any
}

const stopAnimation = () => {
  status.updater = (status.updater + 1) % 999999
  if (!status.animationHandler) return
  clearTimeout(status.animationHandler)
}

const onRestart = async () => {
  try {
    if (!status.mergedConfig) return
    let { dataset, rowNum } = status.mergedConfig
    if (!Array.isArray(dataset)) return
    stopAnimation()
    calcRowsData()
    let flag = true
    if (dataset.length <= rowNum) {
      flag = false
    }
    calcHeights(flag)
    animation(flag)
  } catch (error) {
    console.error(error)
  }
}

onRestart()

watch(
  () => h.value,
  () => {
    onRestart()
  },
)

watch(
  () => rowNum?.value,
  () => {
    onRestart()
  },
)

watch(
  () => props.chartConfig.option.dataset,
  () => {
    onRestart()
  },
  {
    deep: false,
  },
)

useChartDataFetch(props.chartConfig, useChartEditStore, (resData: any[]) => {
  syncAutoUnit(resolveAutoUnitFromIoTDataset(resData))
  props.chartConfig.option.dataset = normalizeDatasetForTableList(resData)
  onRestart()
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<style lang="scss" scoped>
@include go('tables-rank') {
  width: 100%;
  height: 100%;
  overflow: hidden;

  .row-item {
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }

  .ranking-info {
    display: flex;
    width: 100%;
    font-size: 13px;
    align-items: center;

    .rank {
      margin-right: 5px;
    }

    .info-name {
      flex: 1;
    }
  }

  .ranking-column {
    border-bottom: 2px solid #1370fb80;
    margin-top: 5px;

    .inside-column {
      position: relative;
      height: 6px;
      margin-bottom: 2px;
      border-radius: 1px;
      overflow: hidden;
    }

    .shine {
      position: absolute;
      left: 0%;
      top: 2px;
      height: 2px;
      width: 50px;
      transform: translateX(-100%);
      background: radial-gradient(rgb(40, 248, 255) 5%, transparent 80%);
      animation: shine 3s ease-in-out infinite alternate;
    }
  }
}

@keyframes shine {
  80% {
    left: 0;
    transform: translateX(-100%);
  }

  100% {
    left: 100%;
    transform: translateX(0%);
  }
}
</style>
