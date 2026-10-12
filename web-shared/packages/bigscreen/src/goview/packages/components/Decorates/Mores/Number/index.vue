<!-- 数值卡保留真实零值，无有效数据时显示空缺。 -->
<template>
  <n-statistic tabular-nums class="go-decorates-number">
    <template #prefix>
      <span :style="`color:${prefixColor};font-size:${numberSize}px`">
        {{ prefixText }}
      </span>
    </template>
    <span :style="`color:${numberColor};font-size:${numberSize}px`">
      <span v-if="option.dataset === null">—</span>
      <n-number-animation v-else
        :from="option.from"
        :to="option.dataset"
        :duration="dur * 1000"
        :show-separator="showSeparator"
        :precision="precision"
      ></n-number-animation>
    </span>
    <template #suffix>
      <span :style="`color:${suffixColor};font-size:${numberSize}px`">
        {{ suffixText }}
      </span>
    </template>
    <template #label><span v-if="qualityWarnings" class="text-xs">{{ qualityWarnings }}</span></template>
  </n-statistic>
</template>

<script setup lang="ts">
import { type PropType, toRefs, reactive, watch, ref } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { useChartDataFetch } from '@/hooks'
import { extractNullableSingleMetricValue } from '@/packages/components/Charts/utils/progressValue'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})
/** 普通数值组件通过数据回调接收质量，不能依赖 ECharts 专属的 option 回写。 */
const qualityWarnings = ref('')
const option = reactive({
  from: 0,
  dataset: null as number | null
})
const { w, h } = toRefs(props.chartConfig.attr)
let { dur, showSeparator, prefixText, prefixColor, suffixText, suffixColor, precision, numberSize, numberColor } =
  toRefs(props.chartConfig.option)

/** 更新实际数值，空值不进入数字动画。 */
const updateNumber = (newData: unknown) => {
  // 每次回调完整替换警示，GOOD 回复会清除上一条 BAD 警示。
  qualityWarnings.value = Object.values((newData as any)?._iotMeta?.qualityWarnings ?? {}).join('；')
  // 原来的目标值作为新的数字动画的起始值
  option.from = option.dataset ?? 0
  option.dataset = extractNullableSingleMetricValue(newData, props.chartConfig)
}

watch(
  () => props.chartConfig.option.from,
  () => {
    option.from = props.chartConfig.option.from
  },
  { immediate: true }
)

watch(
  () => props.chartConfig.option.dataset,
  () => {
    updateNumber(props.chartConfig.option.dataset)
  },
  {
    immediate: true,
    deep: false
  }
)

useChartDataFetch(props.chartConfig, useChartEditStore, updateNumber)
</script>

<style lang="scss" scoped>
@include go('decorates-number') {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
