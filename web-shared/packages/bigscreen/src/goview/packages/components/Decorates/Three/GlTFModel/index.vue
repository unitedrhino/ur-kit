<template>
  <GlTFCanvas :chart-config="chartConfig" />
</template>

<script setup lang="ts">
/**
 * 3D 模型组件渲染入口（轻壳）
 *
 * three.js 相关实现全部在 GlTFCanvas（异步组件）内，
 * 保证 three/GLTFLoader 打进独立 chunk，不进 bigscreen 主包与首屏。
 */
import { defineAsyncComponent, type PropType } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { option } from './config'

const GlTFCanvas = defineAsyncComponent(() => import('./canvas.vue'))

defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType & typeof option>,
    required: true
  }
})
</script>
