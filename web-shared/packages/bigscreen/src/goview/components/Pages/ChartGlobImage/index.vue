<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { ConfigType } from '@/packages/index.type';

import type { PropType } from 'vue';

import { ref, watch } from 'vue';

import { fetchImages } from '@/packages';
import { requireErrorImg } from '@/utils';

const props = defineProps({
  chartConfig: {
    type: Object as PropType<ConfigType>,
    required: true,
  },
});

const imageInfo = ref('');

// 获取图片
const fetchImageUrl = async () => {
  // fetchImages 异常路径可能返回 undefined，空串走占位图逻辑
  imageInfo.value = (await fetchImages(props.chartConfig)) ?? '';
};

/** 非图片资源（如 CAD 图纸）无法用 <img> 预览时回退到占位图，避免裂图 */
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  if (img.src !== requireErrorImg()) img.src = requireErrorImg();
};

watch(
  () => props.chartConfig.key,
  () => fetchImageUrl(),
  {
    immediate: true,
  },
);
</script>

<template>
  <img class="list-img" v-lazy="imageInfo" :alt="editorT('bigscreenEditor.ui.chartImage')" @error="handleImageError" />
</template>
