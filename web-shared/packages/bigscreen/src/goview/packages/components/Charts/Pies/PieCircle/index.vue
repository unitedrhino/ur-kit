<template>
  <v-chart :theme="themeColor" :init-options="initOptions" :option="option.value" autoresize />
</template>

<script setup lang="ts">
import cloneDeep from 'lodash/cloneDeep';
import { reactive, type PropType, watch } from 'vue';

import { useChartDataFetch } from '@/hooks';
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { DatasetComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import config from './config';
import { extractSingleMetricValue } from '../../utils/progressValue';

type ConditionalRule = {
  color: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
};

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

use([DatasetComponent, CanvasRenderer, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent]);

const option = reactive({
  value: {},
});

const toSafeNumber = (value: unknown) => {
  const nextValue = typeof value === 'number' ? value : Number.parseFloat(`${value ?? 0}`);
  return Number.isFinite(nextValue) ? nextValue : 0;
};

const formatValue = (value: number, digits = 2) => Number(value.toFixed(Math.max(0, digits)));

const resolveConditionalColor = (value: number, conditionalStyles: any): null | string => {
  if (!conditionalStyles?.enabled || !Array.isArray(conditionalStyles.rules) || conditionalStyles.rules.length === 0) {
    return null;
  }

  for (const rule of conditionalStyles.rules as ConditionalRule[]) {
    let match = false;
    switch (rule.operator) {
      case 'gt':
        match = value > rule.value;
        break;
      case 'lt':
        match = value < rule.value;
        break;
      case 'gte':
        match = value >= rule.value;
        break;
      case 'lte':
        match = value <= rule.value;
        break;
      case 'eq':
        match = value === rule.value;
        break;
    }
    if (match) return rule.color;
  }

  return null;
};

const buildRenderState = (value: number) => {
  const percentMode = !!props.chartConfig.option.percentMode;
  const displayDecimals = props.chartConfig.option.displayDecimals ?? 2;

  if (percentMode) {
    const clamped = Math.min(1, Math.max(0, value));
    return {
      percentage: clamped * 100,
      raw: clamped,
      text: `${formatValue(clamped * 100, displayDecimals)}%`,
    };
  }

  const unit = props.chartConfig.option.unit ?? '';
  const maxValue = Math.max(1, toSafeNumber(props.chartConfig.option.maxValue ?? 100));
  const normalized = Math.max(0, value);
  return {
    percentage: Math.min(100, (normalized / maxValue) * 100),
    raw: normalized,
    text: `${formatValue(normalized, displayDecimals)}${unit}`,
  };
};

const ensureRingSeriesData = (renderOption: any) => {
  renderOption.series ??= [];
  renderOption.series[0] ??= {
    type: 'pie',
    radius: ['75%', '80%'],
    center: ['50%', '50%'],
    hoverAnimation: true,
    label: { show: false },
  };

  const series = renderOption.series[0];
  series.data ??= [];
  series.data[0] ??= {
    value: [0],
    itemStyle: {
      color: '#03a9f4',
      shadowBlur: 10,
      shadowColor: '#97e2f5',
    },
  };
  series.data[1] ??= {
    value: [100],
    itemStyle: {
      color: '#00bcd44a',
      shadowBlur: 0,
      shadowColor: '#00bcd44a',
    },
  };

  if (!Array.isArray(series.data[0].value)) {
    series.data[0].value = [Number(series.data[0].value ?? 0)];
  }
  if (!Array.isArray(series.data[1].value)) {
    series.data[1].value = [Number(series.data[1].value ?? 0)];
  }

  series.data[0].itemStyle ??= {};
  series.data[1].itemStyle ??= {};
};

const buildRenderOption = (value: number) => {
  ensureRingSeriesData(props.chartConfig.option);
  const renderState = buildRenderState(value);
  const renderOption = cloneDeep(props.chartConfig.option);
  const currentColor = resolveConditionalColor(renderState.raw, props.chartConfig.option.conditionalStyles);

  ensureRingSeriesData(renderOption);

  renderOption.title.text = renderState.text;
  renderOption.series[0].data[0].value[0] = renderState.percentage;
  renderOption.series[0].data[1].value[0] = Math.max(0, 100 - renderState.percentage);

  renderOption.title.textStyle.color = currentColor ?? renderOption.title.textStyle.color;
  renderOption.series[0].data[0].itemStyle.color = currentColor ?? renderOption.series[0].data[0].itemStyle.color;
  renderOption.series[0].data[0].itemStyle.shadowColor = currentColor ?? renderOption.series[0].data[0].itemStyle.shadowColor;

  return renderOption;
};

const dataHandle = (newData: unknown) => {
  const numericValue = extractSingleMetricValue(newData, props.chartConfig);
  props.chartConfig.option.dataset = numericValue;
  option.value = buildRenderOption(numericValue);
};

watch(
  () => [
    props.chartConfig.option.dataset,
    props.chartConfig.option.percentMode,
    props.chartConfig.option.maxValue,
    props.chartConfig.option.unit,
    props.chartConfig.option.displayDecimals,
    JSON.stringify(props.chartConfig.option.conditionalStyles ?? {}),
  ],
  ([newData]) => {
    try {
      dataHandle(newData);
    } catch (error) {
      console.log(error);
    }
  },
  {
    immediate: true,
    deep: false,
  },
);

useChartDataFetch(props.chartConfig, useChartEditStore, (resData: number) => {
  dataHandle(resData);
});
</script>
