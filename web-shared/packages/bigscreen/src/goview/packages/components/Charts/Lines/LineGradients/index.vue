<script setup lang="ts">
import type { PropType } from 'vue';

import { computed, watch } from 'vue';
import VChart from 'vue-echarts';

import { useChartDataFetch } from '@/hooks';
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook';
import { hasIoTDatasetMeta } from '@/packages/components/Charts/utils/iotDataset';
import { fixSameValueYAxis, mergeTheme } from '@/packages/public/chart';
import { chartColorsSearch, defaultTheme } from '@/settings/chartThemes/index';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { colorGradientCustomMerge, isPreview } from '@/utils';
import { LineChart } from 'echarts/charts';
import { DatasetComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { graphic, use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import config, { includes } from './config';

const props = defineProps({
  themeSetting: {
    type: Object,
    required: true,
  },
  themeColor: {
    type: Object,
    required: true,
  },
  chartConfig: {
    type: Object as PropType<config>,
    required: true,
  },
});

const initOptions = useCanvasInitOptions(props.chartConfig.option, props.themeSetting);

use([DatasetComponent, CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent]);
const chartEditStore = useChartEditStore();

// 渐变色处理：监听主题色变化，更新 series 上的渐变 areaStyle
watch(
  () => chartEditStore.getEditCanvasConfig.chartThemeColor,
  (newColor: string) => {
    try {
      if (!isPreview()) {
        const themeColor =
          colorGradientCustomMerge(chartEditStore.getEditCanvasConfig.chartCustomThemeColorInfo)[newColor] ||
          colorGradientCustomMerge(chartEditStore.getEditCanvasConfig.chartCustomThemeColorInfo)[defaultTheme];
        props.chartConfig.option.series.forEach((value: any, index: number) => {
          value.areaStyle.color = new graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              // 兜底透明色仅满足类型（themeColor 固定 5 色，运行时不会命中）
              color: themeColor[3 + index] ?? 'rgba(0,0,0, 0)',
            },
            {
              offset: 1,
              color: 'rgba(0,0,0, 0)',
            },
          ]);
        });
      }
    } catch (error) {
      console.error(error);
    }
  },
  {
    immediate: true,
  },
);

// 核心：使用 computed 替代 reactive + watch，自动追踪 props.chartConfig.option 的所有变化
const option = computed(() => {
  const merged = mergeTheme(props.chartConfig.option, props.themeSetting, includes);
  fixSameValueYAxis(merged);
  return merged;
});

const { vChartRef } = useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  if (hasIoTDatasetMeta(newData)) return;
  // eslint-disable-next-line vue/no-mutating-props
  props.chartConfig.option.dataset = newData;
});
</script>

<template>
  <VChart ref="vChartRef" :init-options="initOptions" :theme="themeColor" :option="option" autoresize />
</template>
