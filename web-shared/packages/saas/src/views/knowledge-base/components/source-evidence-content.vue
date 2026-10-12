<!-- 文件说明：来源依据切片正文渲染；与解析正文同管道，mermaid 围栏成图，其余原样保留。 -->
<script setup lang="ts">
import { computed } from 'vue';

import { splitMermaidSegments } from '../mermaid-segments';
import MermaidBlock from './mermaid-block.vue';

/** content 为切片原文；经解析正文同款围栏分段渲染，围栏标记不外露。 */
const props = defineProps<{ content: string }>();

const segments = computed(() => splitMermaidSegments(props.content));
</script>
<template>
  <div class="break-words leading-7" data-testid="source-evidence-content">
    <template v-for="(segment, index) in segments" :key="index">
      <MermaidBlock v-if="segment.type === 'mermaid'" :code="segment.code" />
      <div v-else class="whitespace-pre-wrap">{{ segment.value }}</div>
    </template>
  </div>
</template>
