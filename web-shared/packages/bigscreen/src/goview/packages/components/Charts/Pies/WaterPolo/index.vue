<template>
  <v-chart :theme="themeColor" :init-options="initOptions" :option="option.value" autoresize></v-chart>
</template>

<script setup lang="ts">
import { type PropType, watch, reactive } from 'vue';
import VChart from 'vue-echarts';
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook';
import { use } from 'echarts/core';
import 'echarts-liquidfill/src/liquidFill.js';
import { CanvasRenderer } from 'echarts/renderers';
import { GridComponent } from 'echarts/components';
import config from './config';
import { isPreview, isString, colorGradientCustomMerge } from '@/utils';
import { chartColorsSearch, defaultTheme } from '@/settings/chartThemes/index';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { useChartDataFetch } from '@/hooks';
import { extractSingleMetricValue } from '../../utils/progressValue';

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

use([CanvasRenderer, GridComponent]);

const chartEditStore = useChartEditStore();

const option = reactive({
  value: {},
});

const ensureWaterPoloSeries = (targetOption: any) => {
  targetOption.series ??= [];
  targetOption.series[0] ??= {
    type: 'liquidFill',
    data: [0],
    color: [
      {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: '#446bf5' },
          { offset: 1, color: '#2ca3e2' },
        ],
        globalCoord: false,
      },
    ],
    backgroundStyle: {
      borderWidth: 1,
      color: 'rgba(51, 66, 127, 0.7)',
    },
    label: {
      normal: {
        textStyle: {
          fontSize: 50,
          color: '#fff',
        },
      },
    },
  };

  const series = targetOption.series[0];
  if (!Array.isArray(series.data)) {
    series.data = [Number(series.data ?? 0)];
  }
  if (!Array.isArray(series.color) || !series.color[0]?.colorStops) {
    series.color = [
      {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: '#446bf5' },
          { offset: 1, color: '#2ca3e2' },
        ],
        globalCoord: false,
      },
    ];
  }
  series.backgroundStyle ??= {
    borderWidth: 1,
    color: 'rgba(51, 66, 127, 0.7)',
  };
  series.label ??= { normal: { textStyle: { fontSize: 50, color: '#fff' } } };
  series.label.normal ??= { textStyle: { fontSize: 50, color: '#fff' } };
  series.label.normal.textStyle ??= { fontSize: 50, color: '#fff' };
};

watch(
  () => chartEditStore.getEditCanvasConfig.chartThemeColor,
  (newColor: string) => {
    try {
      if (!isPreview()) {
        ensureWaterPoloSeries(props.chartConfig.option);
        const themeColor =
          colorGradientCustomMerge(chartEditStore.getEditCanvasConfig.chartCustomThemeColorInfo)[newColor] ||
          colorGradientCustomMerge(chartEditStore.getEditCanvasConfig.chartCustomThemeColorInfo)[defaultTheme];
        props.chartConfig.option.series[0].backgroundStyle.color = themeColor[2];
        props.chartConfig.option.series[0].color[0].colorStops = [
          {
            offset: 0,
            color: themeColor[0],
          },
          {
            offset: 1,
            color: themeColor[1],
          },
        ];
      }
      option.value = props.chartConfig.option;
    } catch (error) {
      console.log(error);
    }
  },
  {
    immediate: true,
  },
);

const normalizeValue = (newData: number | string) => {
  const raw = isString(newData) ? parseFloat(newData) : newData;
  const numeric = Number.isFinite(raw) ? raw : 0;
  if (props.chartConfig.option.percentMode) {
    const clamped = Math.min(1, Math.max(0, numeric));
    return {
      ratio: clamped,
      text: `${Number((clamped * 100).toFixed(props.chartConfig.option.displayDecimals ?? 2))}%`,
    };
  }

  const maxValue = Math.max(1, Number(props.chartConfig.option.maxValue) || 100);
  const normalized = Math.max(0, numeric);
  return {
    ratio: Math.min(1, normalized / maxValue),
    text: `${Number(normalized.toFixed(props.chartConfig.option.displayDecimals ?? 2))}${props.chartConfig.option.unit ?? ''}`,
  };
};

const dataHandle = (newData: unknown) => {
  const numericValue = extractSingleMetricValue(newData, props.chartConfig);
  const normalized = normalizeValue(numericValue);
  ensureWaterPoloSeries(props.chartConfig.option);
  props.chartConfig.option.dataset = numericValue;
  props.chartConfig.option.series[0].data = [normalized.ratio];
  props.chartConfig.option.series[0].label.formatter = normalized.text;
  option.value = props.chartConfig.option;
};

watch(
  () => props.chartConfig.option.dataset,
  (newData) => {
    dataHandle(newData);
  },
  {
    immediate: true,
    deep: false,
  },
);

useChartDataFetch(props.chartConfig, useChartEditStore, (newData: number) => {
  dataHandle(newData);
});
</script>
