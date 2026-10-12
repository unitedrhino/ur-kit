<template>
  <div class="go-border-04">
    <svg :width="w" :height="h">
      <polyline
        :stroke="colors[0]"
        stroke-width="2"
        fill="transparent"
        :points="`${xPos(0)}, 0 ${xPos(30)}, ${h / 2}`"
      />

      <polyline
        :stroke="colors[0]"
        stroke-width="2"
        fill="transparent"
        :points="`${xPos(20)}, 0 ${xPos(50)}, ${h / 2} ${xPos(w)}, ${
          h / 2
        }`"
      />

      <polyline
        :stroke="colors[1]"
        fill="transparent"
        stroke-width="3"
        :points="`${xPos(0)}, ${h - 3}, ${xPos(200)}, ${h - 3}`"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { type PropType, toRefs } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true,
  },
})

const { w, h } = toRefs(props.chartConfig.attr)
const { colors, reverse } = toRefs(props.chartConfig.option)

const xPos = (pos: number) => {
  // reverse 在旧数据中可能缺失，缺失或 falsy 时按正向坐标计算（与默认行为一致）
  if (reverse?.value !== true) return pos
  return w.value - pos
}
</script>

<style lang="scss" scoped>
@include go('border-04') {
}
</style>
