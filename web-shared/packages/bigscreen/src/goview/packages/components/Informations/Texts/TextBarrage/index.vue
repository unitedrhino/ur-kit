<template>
  <div class="go-text-box">
    <div class="content">
      <span>
        {{ option.dataset }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType, toRefs, shallowReactive, watch, computed } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartDataFetch } from '@/hooks'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { option as configOption } from './config'
import type { values } from 'lodash'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType & typeof option>,
    required: true
  }
})

const { w } = toRefs(props.chartConfig.attr)

const { fontColor, fontSize, letterSpacing, fontWeight, animationTime, animationSpeed, boxShadow } = toRefs(
  props.chartConfig.option
)

const option = shallowReactive({
  dataset: configOption.dataset
})

// 手动更新
watch(
  () => props.chartConfig.option.dataset,
  (newData: any) => {
    option.dataset = newData
  },
  {
    immediate: true,
    deep: false
  }
)

//阴影
watch(
  props.chartConfig.option,
  () => {
    try {
      if (boxShadow) {
        // boxShadow 经 toRefs 解构可能为 undefined，写入前收窄
        boxShadow.value = props.chartConfig.option.showShadow
          ? `${props.chartConfig.option.hShadow}px ${props.chartConfig.option.vShadow}px ${props.chartConfig.option.blurShadow}px ${props.chartConfig.option.colorShadow}`
          : 'none'
      }
    } catch (error) {
      console.log(error)
    }
  },
  {
    immediate: true
  }
)

const transitionDuration = computed(() => {
  // animationSpeed 经 toRefs 解构可能为 undefined，缺失时兜底 1，避免除 0
  const speed = Number(animationSpeed?.value) || 1
  return Math.floor(Number(w.value) / speed)
})

// 预览更新
useChartDataFetch(props.chartConfig, useChartEditStore, (newData: string) => {
  option.dataset = newData
})
</script>

<style lang="scss" scoped>
@include go('text-box') {
  display: flex;
  align-items: center;
  .content {
    width: 100%;
    color: v-bind('fontColor');
    font-size: v-bind('fontSize + "px"');
    letter-spacing: v-bind('letterSpacing + "px"');
    font-weight: v-bind('fontWeight');
    text-shadow: v-bind('boxShadow');
    position: absolute;
    animation: barrage v-bind('transitionDuration + "s"') linear v-bind('animationTime + "s"') infinite;
  }
  @keyframes barrage {
    from {
      left: 100%;
      transform: translateX(0);
    }
    to {
      left: 0;
      transform: translateX(-100%);
    }
  }
}
</style>
