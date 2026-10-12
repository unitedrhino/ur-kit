<template>
  <DecoratedTableView :chart-config="chartConfig">
    <div class="dv-scroll-board">
      <div
        v-if="status.header.length && status.mergedConfig"
        class="header"
        :style="`background-color: ${status.mergedConfig.headerBGC};`"
      >
        <div
          v-for="(headerItem, i) in status.header"
          :key="`header-${i}`"
          class="header-item"
          :style="`
          height: ${status.mergedConfig.headerHeight}px;
          line-height: ${status.mergedConfig.headerHeight}px;
          width: ${status.widths[i]}px;
        `"
          :align="status.aligns[i]"
        >
          {{ headerItem }}
        </div>
      </div>

      <div
        v-if="status.mergedConfig"
        class="rows"
        :style="`height: ${contentHeight - (status.header.length ? status.mergedConfig.headerHeight : 0)}px;`"
      >
        <div
          v-for="(row, ri) in status.rows"
          :key="`${row.toString()}${row.scroll}`"
          class="row-item"
          :style="`
          height: ${status.heights[ri]}px;
          line-height: ${status.heights[ri]}px;
          background-color: ${status.mergedConfig[row.rowIndex % 2 === 0 ? 'evenRowBGC' : 'oddRowBGC']};
        `"
        >
          <div
            v-for="(ceil, ci) in row.ceils"
            :key="`cell-${ri}-${ci}`"
            class="ceil"
            :style="`width: ${status.widths[ci]}px;`"
            :align="status.aligns[ci]"
          >
            <span v-if="isIndexCell(ceil)" class="index-tag" :style="{ backgroundColor: ceil.backgroundColor }">
              {{ ceil.value }}
            </span>
            <template v-else>
              {{ formatCellValue(ceil) }}
            </template>
          </div>
        </div>
      </div>
    </div>
  </DecoratedTableView>
</template>

<script setup lang="ts">
import type { CreateComponentType } from '@/packages/index.type'

import { computed, onMounted, onUnmounted, reactive, toRefs, type PropType, watch } from 'vue'

import { useChartDataFetch } from '@/hooks'
import {
  ensureDecoratedChartOptionDefaults,
  resolveDecoratedChartTitleHeight,
} from '@/packages/components/Charts/shared/decoratedChartOptions'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'

import DecoratedTableView from '../../shared/DecoratedTableView.vue'
import { normalizeDatasetForTableScrollBoard } from '../../shared/iotDataset'

interface IndexCell {
  backgroundColor: string
  type: 'index'
  value: number
}

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true,
  },
})

const { w, h } = toRefs(props.chartConfig.attr)
const { displayDecimals } = toRefs(props.chartConfig.option as any)

ensureDecoratedChartOptionDefaults(props.chartConfig.option as Record<string, any>)

const contentWidth = computed(() => {
  const option = props.chartConfig.option as Record<string, any>
  const padding = option.containerType === 'border' ? Number(option.padding || 0) : 0
  return Math.max(w.value - padding * 2, 0)
})

const contentHeight = computed(() => {
  const option = props.chartConfig.option as Record<string, any>
  const padding = option.containerType === 'border' ? Number(option.padding || 0) : 0
  const titleHeight = option.containerType === 'border'
    ? resolveDecoratedChartTitleHeight(option, option.borderOption?.borderTitle)
    : 0
  return Math.max(h.value - padding * 2 - titleHeight, 0)
})

const status = reactive({
  defaultConfig: {
    header: [],
    dataset: [],
    rowNum: 5,
    headerBGC: '#00BAFF',
    oddRowBGC: '#003B51',
    evenRowBGC: '#0A2732',
    waitTime: 2,
    headerHeight: 35,
    columnWidth: [],
    align: [],
    index: false,
    indexHeader: '#',
    carousel: 'single',
    hoverPause: true,
  },
  mergedConfig: props.chartConfig.option,
  header: [],
  rowsData: [],
  rows: [
    {
      ceils: [] as unknown[],
      rowIndex: 0,
      scroll: 0,
    },
  ],
  widths: [],
  heights: [0],
  avgHeight: 0,
  aligns: [],
  animationIndex: 0,
  animationHandler: 0,
  updater: 0,
  needCalc: false,
})

const lastNonEmptyTableData = reactive<{
  dataset: any[]
  header: string[]
}>({
  dataset: [],
  header: [],
})

const mergeConfig = () => {
  status.mergedConfig = merge(cloneDeep(status.defaultConfig), props.chartConfig.option)
}

const calcHeaderData = () => {
  let { header, index, indexHeader } = status.mergedConfig
  if (!header.length) {
    status.header = []
    return
  }
  header = [...header]
  if (index) header.unshift(indexHeader)
  status.header = header
}

const isIndexCell = (cell: unknown): cell is IndexCell => {
  return typeof cell === 'object' && cell !== null && (cell as IndexCell).type === 'index'
}

const formatCellValue = (cell: unknown) => {
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'number' && Number.isFinite(cell)) {
    const digits = Math.max(0, Number(displayDecimals?.value ?? 0))
    return Number(cell.toFixed(digits))
  }
  return String(cell)
}

const calcRowsData = () => {
  let { dataset, index, headerBGC, rowNum } = status.mergedConfig
  if (!Array.isArray(dataset)) return
  if (index) {
    dataset = dataset.map((row: any, i: number) => {
      row = [...row]
      const indexTag: IndexCell = {
        type: 'index',
        value: i + 1,
        backgroundColor: headerBGC,
      }
      row.unshift(indexTag)
      return row
    })
  }
  dataset = dataset.map((ceils: any, i: number) => ({ ceils, rowIndex: i }))
  const rowLength = dataset.length
  if (rowLength > rowNum && rowLength < 2 * rowNum) {
    dataset = [...dataset, ...dataset]
  }
  dataset = dataset.map((d: any, i: number) => ({ ...d, scroll: i }))

  status.rowsData = dataset
  status.rows = dataset
}

const calcWidths = () => {
  const { mergedConfig, rowsData } = status
  const { columnWidth, header } = mergedConfig
  const usedWidth = columnWidth.reduce((all: any, ws: number) => all + ws, 0)
  let columnNum = 0
  if (rowsData[0]) {
    columnNum = (rowsData[0] as any).ceils.length
  } else if (header.length) {
    columnNum = header.length
  }
  const avgWidth = (contentWidth.value - usedWidth) / (columnNum - columnWidth.length)
  const widths = new Array(columnNum).fill(avgWidth)
  status.widths = merge(widths, columnWidth)
}

const calcHeights = (onresize = false) => {
  const { mergedConfig, header } = status
  const { headerHeight, rowNum, dataset } = mergedConfig
  let allHeight = contentHeight.value
  if (header.length) allHeight -= headerHeight
  const avgHeight = allHeight / rowNum
  status.avgHeight = avgHeight
  if (!onresize) status.heights = new Array(dataset.length).fill(avgHeight)
}

const calcAligns = () => {
  const { header, mergedConfig } = status
  const columnNum = header.length
  const aligns = new Array(columnNum).fill('left')
  const { align } = mergedConfig

  status.aligns = merge(aligns, align)
}

const calcData = () => {
  mergeConfig()
  calcHeaderData()
  calcRowsData()
  calcWidths()
  calcHeights()
  calcAligns()
  animation(true)
}

onMounted(() => {
  calcData()
})

const animation = async (start = false) => {
  const { needCalc } = status

  if (needCalc) {
    calcRowsData()
    calcHeights()
    status.needCalc = false
  }
  let { avgHeight, animationIndex, mergedConfig, rowsData, updater } = status
  const { waitTime, carousel, rowNum } = mergedConfig

  const rowLength = rowsData.length
  if (rowNum >= rowLength) return
  if (start) {
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
    if (updater !== status.updater) return
  }
  const animationNum = carousel === 'single' ? 1 : rowNum
  let rows = rowsData.slice(animationIndex)
  rows.push(...rowsData.slice(0, animationIndex))
  status.rows = rows.slice(0, carousel === 'page' ? rowNum * 2 : rowNum + 1)
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
    stopAnimation()
    calcData()
  } catch (error) {
    console.log(error)
  }
}

watch(
  () => w.value,
  () => {
    onRestart()
  },
)

watch(
  () => h.value,
  () => {
    onRestart()
  },
)

watch(
  () => props.chartConfig.option,
  () => {
    onRestart()
  },
  { deep: true },
)

useChartDataFetch(props.chartConfig, useChartEditStore, (resData: any[]) => {
  const normalized = normalizeDatasetForTableScrollBoard(resData)
  const hasRows = Array.isArray(normalized.dataset) && normalized.dataset.length > 0
  const hasHeader = Array.isArray(normalized.header) && normalized.header.length > 0

  if (!hasRows && !hasHeader) {
    if (lastNonEmptyTableData.dataset.length > 0) {
      props.chartConfig.option.dataset = cloneDeep(lastNonEmptyTableData.dataset)
      if (lastNonEmptyTableData.header.length > 0) {
        props.chartConfig.option.header = cloneDeep(lastNonEmptyTableData.header)
      }
      onRestart()
    }
    return
  }

  if (hasRows) {
    lastNonEmptyTableData.dataset = cloneDeep(normalized.dataset)
  }
  if (hasHeader) {
    lastNonEmptyTableData.header = cloneDeep(normalized.header)
  }
  props.chartConfig.option.dataset = normalized.dataset
  if (hasHeader) {
    props.chartConfig.option.header = normalized.header
  }
  onRestart()
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<style lang="scss" scoped>
.dv-scroll-board {
  position: relative;
  width: 100%;
  height: 100%;
  color: #fff;

  .text {
    padding: 0 10px;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header {
    display: flex;
    flex-direction: row;
    font-size: 15px;

    .header-item {
      transition: all 0.3s;
    }
  }

  .rows {
    overflow: hidden;

    .row-item {
      display: flex;
      font-size: 14px;
      transition: all 0.3s;
      overflow: hidden;
    }
  }

  .index-tag {
    display: inline-block;
    padding: 0 3px;
    border-radius: 3px;
    line-height: 1.4;
  }
}
</style>
