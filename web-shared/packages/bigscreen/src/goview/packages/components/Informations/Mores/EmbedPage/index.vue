<template>
  <EmbedPageCanvas :chart-config="chartConfig" />
</template>

<script setup lang="ts">
/**
 * 内嵌页面组件渲染入口（轻壳）
 *
 * 页面经 iframe sandbox 嵌入，桥接逻辑全部在 EmbedPageCanvas 内，
 * 壳组件同步加载（无 three 等重依赖），不进独立 chunk。
 */
import type { PropType } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { option } from './config'
import EmbedPageCanvas from './canvas.vue'

defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType & typeof option>,
    required: true
  }
})
</script>
