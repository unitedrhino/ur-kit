<template>
  <svg :width="w" :height="h">
    <polyline :stroke-width="lineWidth" :points="getStartPoint(-1, '')" :stroke="backgroundCol" fill="none" />
    <polyline
      :stroke-width="lineWidth"
      class="g-dashed-line"
      :points="getStartPoint(-1, '')"
      :stroke="animateCol"
      fill="none"
    />
    <polyline
      :stroke-width="lineWidth"
      v-for="(item, index) in lineNum"
      :key="index"
      :points="getStartPoint(index + 1, 'down')"
      :stroke="backgroundCol"
      fill="none"
    />
    <polyline
      :stroke-width="lineWidth"
      class="g-dashed-line"
      v-for="(item, index) in lineNum"
      :key="index"
      :points="getStartPoint(index + 1, 'down')"
      :stroke="animateCol"
      fill="none"
    />
    <polyline
      :stroke-width="lineWidth"
      v-for="(item, index) in lineNumUp"
      :key="index"
      :points="getStartPoint(index + 1, 'up')"
      :stroke="backgroundCol"
      fill="none"
    />
    <polyline
      :stroke-width="lineWidth"
      class="g-dashed-line"
      v-for="(item, index) in lineNumUp"
      :key="index"
      :points="getStartPoint(index + 1, 'up')"
      :stroke="animateCol"
      fill="none"
    />
  </svg>
</template>

<script setup lang="ts">
import { type PropType, toRefs } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})

const { w, h } = toRefs(props.chartConfig.attr)
const { lineNum, lineNumUp, lineWidth, backgroundCol, animateCol } = toRefs(props.chartConfig.option)
const getStartPoint = (num: number, direction: string) => {
  const lineLength = w.value / 2
  // lineNum/lineNumUp/lineWidth 在旧数据中可能缺失，兜底 0，避免除法产生 NaN 导致线条异常
  const countUp = lineNumUp?.value ?? 0
  const count = lineNum?.value ?? 0
  const width = lineWidth?.value ?? 0
  const lineColLength = h.value / (countUp + count) - width / (countUp + count)
  if (num === -1 && direction === '') {
    return `0,${h.value / 2} ${lineLength},${h.value / 2} ${lineLength * 2},${h.value / 2}`
  } else if (num !== -1 && direction === 'down') {
    return `0,${h.value / 2} ${lineLength},${h.value / 2} ${lineLength},${h.value / 2 + num * lineColLength},${
      lineLength * 2
    },${h.value / 2 + num * lineColLength}`
  } else if (num !== -1 && direction === 'up') {
    return `0,${h.value / 2} ${lineLength},${h.value / 2} ${lineLength},${h.value / 2 - num * lineColLength},${
      lineLength * 2
    },${h.value / 2 - num * lineColLength}`
  }
}
</script>

<style scoped>
.g-dashed-line {
  stroke-dasharray: 20 130;
  stroke-dashoffset: 0;
  animation: move 3s infinite linear;
}
@keyframes move {
  0% {
    stroke-dashoffset: 20;
  }
  100% {
    stroke-dashoffset: -130;
  }
}
</style>
