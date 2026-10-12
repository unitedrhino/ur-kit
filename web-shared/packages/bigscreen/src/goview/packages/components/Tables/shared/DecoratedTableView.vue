<template>
  <div class="decorated-table-view">
    <component
      v-if="isBorderContainer && borderComponent && fakeBorderConfig"
      :is="borderComponent"
      :chart-config="fakeBorderConfig"
      class="decorated-table-view__border"
    />
    <div v-if="showTitle" class="decorated-table-view__title" :style="titleStyle">
      {{ titleConfig?.text }}
    </div>
    <div class="decorated-table-view__content" :style="contentStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CreateComponentType } from '@/packages/index.type'

import type { CSSProperties, PropType } from 'vue'

import { computed } from 'vue'

import { useBorderLoader } from '@/composables/useBorderLoader'
import {
  ensureDecoratedChartOptionDefaults,
  resolveDecoratedChartTitleHeight,
} from '@/packages/components/Charts/shared/decoratedChartOptions'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true,
  },
})

ensureDecoratedChartOptionDefaults(props.chartConfig.option as Record<string, any>)

const isBorderContainer = computed(() => props.chartConfig.option?.containerType === 'border')
const isBorder04 = computed(() => props.chartConfig.option?.borderKey === 'Border04')
const padding = computed(() => props.chartConfig.option?.padding || 0)

const borderKeyRef = computed(() => props.chartConfig.option?.borderKey || 'Border01')
const borderOptionRef = computed(() => props.chartConfig.option)
const { borderComponent, computeTitleConfig, computeTitleStyle } = useBorderLoader(borderKeyRef, borderOptionRef)

const fakeBorderConfig = computed(() => {
  if (!isBorderContainer.value) return null
  return {
    attr: props.chartConfig.attr,
    option: props.chartConfig.option?.borderOption || {},
  }
})

const titleConfig = computed(() => {
  if (!isBorderContainer.value) return null
  return computeTitleConfig()
})

const titleStyle = computed<CSSProperties | undefined>(() => {
  if (!titleConfig.value) return undefined
  return computeTitleStyle(titleConfig.value) as CSSProperties
})

const titleHeight = computed(() => {
  return resolveDecoratedChartTitleHeight(props.chartConfig.option as Record<string, any>, titleConfig.value)
})

const showTitle = computed(() => {
  if (!isBorderContainer.value || isBorder04.value) return false
  return !!titleConfig.value?.show && !!titleConfig.value?.text
})

const contentStyle = computed<CSSProperties>(() => {
  if (!isBorderContainer.value) {
    return {
      position: 'absolute',
      inset: '0px',
      zIndex: 3,
    } as CSSProperties
  }

  const { w = 0, h = 0 } = props.chartConfig.attr || {}
  const inset = padding.value
  const heightOffset = inset * 2 + titleHeight.value

  return {
    position: 'absolute',
    left: `${inset}px`,
    top: `${inset + titleHeight.value}px`,
    width: `${Math.max(w - inset * 2, 0)}px`,
    height: `${Math.max(h - heightOffset, 0)}px`,
    zIndex: 3,
  } as CSSProperties
})
</script>

<style lang="scss" scoped>
.decorated-table-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.decorated-table-view__border {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.decorated-table-view__title {
  position: absolute;
  z-index: 2;
  white-space: nowrap;
  pointer-events: none;
}

.decorated-table-view__content {
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
</style>
