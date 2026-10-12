<script setup lang="ts">
import type { CreateComponentGroupType } from '@/packages/index.type';

import { computed, onMounted } from 'vue';

import { useChartDataPondFetch, useLifeHandler } from '@/hooks';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { animationsClass, colorCustomMerge, getBlendModeStyle, getFilterStyle, getTransformStyle } from '@/utils';

import { getComponentAttrStyle, getPreviewConfigStyle, getSizeStyle, getStatusStyle } from '../../utils';
import { PreviewRenderGroup } from '../PreviewRenderGroup/index';

// 初始化数据池
const { initDataPond, clearMittDataPondMap } = useChartDataPondFetch();
const chartEditStore = useChartEditStore();

// const props = defineProps({
//   localStorageInfo: {
//     type: Object as PropType<ChartEditStorageType>,
//     required: true
//   }
// })

// 主题色
const themeSetting = computed(() => {
  const chartThemeSetting = chartEditStore.editCanvasConfig.chartThemeSetting;
  return chartThemeSetting;
});

// 配置项
const themeColor = computed(() => {
  const colorCustomMergeData = colorCustomMerge(chartEditStore.editCanvasConfig.chartCustomThemeColorInfo);
  return colorCustomMergeData[chartEditStore.editCanvasConfig.chartThemeColor];
});

// 组件渲染结束初始化数据池
clearMittDataPondMap();
onMounted(() => {
  initDataPond(useChartEditStore);
});

// 画布组件兜底归一化：API 直建/历史画布可能缺 styles/status/preview 等 goview 规范字段，
// 下方渲染链（animationsClass/getTransformStyle/getStatusStyle 等）假定字段存在，缺失会直接白屏。
// 渲染前为每个组件补齐空默认结构（分组子组件递归处理），保证缺字段画布至少可渲染。
type ComponentItem = (typeof chartEditStore.componentList)[number];
const normalizeItem = (item: ComponentItem): ComponentItem => {
  // 画布 JSON 由后端纯透传，运行时不保证字段齐全，这里按 Partial 视角读取再补默认值
  const raw = item as unknown as {
    styles?: Record<string, unknown>;
    status?: Record<string, unknown>;
    preview?: Record<string, unknown>;
    events?: Record<string, unknown>;
  };
  const normalized = {
    ...item,
    styles: { animations: [], ...raw.styles },
    status: { lock: false, hide: false, ...raw.status },
    preview: { ...raw.preview },
    events: { baseEvent: {}, advancedEvents: {}, interactEvents: [], ...raw.events },
  } as unknown as ComponentItem;
  if (normalized.isGroup && Array.isArray(normalized.groupList)) {
    normalized.groupList = normalized.groupList.map(child => normalizeItem(child as ComponentItem));
  }
  return normalized;
};
const normalizedComponentList = computed(() => chartEditStore.componentList.map(item => normalizeItem(item)));
</script>

<template>
  <div
    class="chart-item"
    :id="item.id"
    v-for="(item, index) in normalizedComponentList"
    :class="animationsClass(item.styles.animations)"
    :key="item.id"
    :style="{
      ...getComponentAttrStyle(item.attr, index),
      ...getTransformStyle(item.styles),
      ...getStatusStyle(item.status),
      ...getPreviewConfigStyle(item.preview),
      ...(getBlendModeStyle(item.styles) as any),
      ...getSizeStyle(item.attr),
    }"
  >
    <!-- 分组 -->
    <PreviewRenderGroup
      v-if="item.isGroup"
      :group-data="item as CreateComponentGroupType"
      :group-index="index"
      :theme-setting="themeSetting"
      :theme-color="themeColor"
    />

    <!-- 单组件 -->
    <component
      v-else
      :is="item.chartConfig.chartKey"
      :id="item.id"
      :chart-config="item"
      :theme-setting="themeSetting"
      :theme-color="themeColor"
      :style="{
        ...getSizeStyle(item.attr),
        ...getFilterStyle(item.styles),
      }"
      v-on="useLifeHandler(item)"
    />
  </div>
</template>

<style lang="scss" scoped>
.chart-item {
  position: absolute;
}
</style>
