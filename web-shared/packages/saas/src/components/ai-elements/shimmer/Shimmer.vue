<!-- 闪烁文本:用于 Reasoning 加载中的占位提示,纯 CSS 实现背景扫光动画(避免引入 motion-v) -->
<script setup lang="ts">
import type { CSSProperties, HTMLAttributes } from 'vue'
import { cn } from '@vben-core/shared/utils'
import { computed, useSlots } from 'vue'

export interface TextShimmerProps {
  /** 渲染的标签元素 */
  as?: keyof HTMLElementTagNameMap
  class?: HTMLAttributes['class']
  /** 动画周期(秒) */
  duration?: number
  /** 扫光宽度系数(随文本长度扩展) */
  spread?: number
}

const props = withDefaults(defineProps<TextShimmerProps>(), {
  as: 'p',
  duration: 2,
  spread: 2,
})

const slots = useSlots()

const textContent = computed(() => {
  const defaultSlot = slots.default?.()
  if (!defaultSlot || defaultSlot.length === 0)
    return ''

  return defaultSlot
    .map((vnode) => {
      if (typeof vnode.children === 'string') {
        return vnode.children
      }
      return ''
    })
    .join('')
})

const dynamicSpread = computed(() => {
  return (textContent.value?.length ?? 0) * props.spread
})

const componentClasses = computed(() => cn('ai-elements-shimmer relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent', '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]', props.class))

const componentStyle = computed((): CSSProperties => ({
  '--spread': `${dynamicSpread.value}px`,
  '--shimmer-duration': `${props.duration}s`,
  'backgroundImage':
    'var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))',
}))
</script>

<template>
  <component
    :is="props.as"
    :class="componentClasses"
    :style="componentStyle"
  >
    <slot />
  </component>
</template>

<style>
@keyframes ai-elements-shimmer-slide {
  0% {
    background-position: 100% center;
  }

  100% {
    background-position: 0% center;
  }
}

.ai-elements-shimmer {
  animation: ai-elements-shimmer-slide var(--shimmer-duration, 2s) linear infinite;
}
</style>
