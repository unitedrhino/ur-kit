<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { MappingRendererProps } from './types';

import SharedMappingRenderer from './SharedMappingRenderer.vue';

defineProps<MappingRendererProps>();
</script>

<template>
  <n-text depth="3" style="display: block; margin-bottom: 8px; font-size: 12px">{{ editorT('bigscreenEditor.ui.scatterChartsSupportXYSizeColorAnd') }}</n-text>
  <SharedMappingRenderer v-bind="$props" />
</template>
