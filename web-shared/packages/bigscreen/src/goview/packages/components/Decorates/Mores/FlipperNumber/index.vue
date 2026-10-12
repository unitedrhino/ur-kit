<template>
  <n-space class="go-decorates-flipper-number" :size="flipperGap" align="center" justify="center">
    <flipper
      :count="item"
      :width="flipperWidth"
      :height="flipperHeight"
      :front-color="flipperTextColor"
      :back-color="flipperBgColor"
      :radius="flipperRadius"
      :flip-type="flipperType"
      :duration="flipperSpeed"
      :border-width="flipperBorderWidth"
      v-for="(item, index) in flipperData"
      :key="index"
      class="go-d-block"
    />
  </n-space>
</template>

<script setup lang="ts">
import { type PropType, toRefs, watch, ref } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { useChartDataFetch } from '@/hooks'
import { Flipper } from '@/components/Pages/Flipper'
import { extractNullableSingleMetricValue } from '@/packages/components/Charts/utils/progressValue'
import type { OptionType } from './config'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})

const { w, h } = toRefs(props.chartConfig.attr)

const {
  displayDecimals,
  flipperLength,
  flipperBgColor,
  flipperTextColor,
  flipperWidth,
  flipperHeight,
  flipperRadius,
  flipperGap,
  flipperType,
  flipperSpeed,
  flipperBorderWidth
} = toRefs(props.chartConfig.option as OptionType)

const flipperData = ref<string[] | number[]>([])
const resolveDisplayValue = (value: unknown) => {
  // GlobalThemeJsonType 未具名声明 _simplifiedData，显式取值构造参数以通过结构检查
  const extracted = extractNullableSingleMetricValue(value, {
    option: { _simplifiedData: props.chartConfig.option._simplifiedData },
    request: props.chartConfig.request,
  })
  return extracted
}
const formatDisplayValue = (value: unknown) => {
  const normalized = resolveDisplayValue(value)
  if (normalized === null) return '—'
  const digits = Math.max(0, Number(displayDecimals.value) || 0)
  return Number(normalized.toFixed(digits)).toFixed(digits)
}
const getFlipperData = (val: string) => {
  if (val === '—') return ['—']
  return val
    .toString()
    .padStart(flipperLength.value, '0') // 左侧填充|右对齐
    .split('') // 转数组
    .slice(flipperLength.value * -1) // 从后面取指定长度
}
const updateDatasetHandler = (newVal: unknown) => {
  flipperData.value = getFlipperData(formatDisplayValue(newVal))
}

watch(
  () => props.chartConfig.option,
  newVal => {
    try {
      updateDatasetHandler((newVal as any as OptionType).dataset)
    } catch (error) {
      console.log(error)
    }
  },
  {
    immediate: true,
    deep: true
  }
)

useChartDataFetch(props.chartConfig, useChartEditStore, (newVal: unknown) => {
  updateDatasetHandler(newVal)
})
</script>

<style lang="scss" scoped>
@include go('decorates-flipper-number') {
  width: v-bind('`${w}px`');
  height: v-bind('`${h}px`');
}
</style>
