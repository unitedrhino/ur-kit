<template>
  <v-chart :theme="themeColor" :init-options="initOptions" :option="option.value" autoresize />
</template>

<script setup lang="ts">
import { reactive, type PropType, watch } from 'vue';

import { useChartDataFetch } from '@/hooks';
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook';
import { mergeTheme } from '@/packages/public/chart';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { DatasetComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { formatProgressDisplay, getAutoScaleMax } from '../../utils/progressValue';
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

use([DatasetComponent, CanvasRenderer, GaugeChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent]);

const option = reactive({
  value: {},
});

const ensureDialSeries = (targetOption: any) => {
  targetOption.series ??= [];
  targetOption.series[0] ??= {
    type: 'gauge',
    data: [{ value: 0, itemStyle: { color: '#2AF4FF' } }],
    min: 0,
    max: 100,
    splitNumber: 10,
    detail: {
      show: false,
      color: '#2AF4FF',
      fontSize: 24,
      formatter: '',
    },
  };
  targetOption.series[1] ??= {
    type: 'gauge',
    min: targetOption.series[0].min ?? 0,
    max: targetOption.series[0].max ?? 100,
    splitNumber: targetOption.series[0].splitNumber ?? 10,
  };

  const mainGauge = targetOption.series[0];
  mainGauge.data ??= [{ value: 0, itemStyle: { color: '#2AF4FF' } }];
  mainGauge.data[0] ??= { value: 0, itemStyle: { color: '#2AF4FF' } };
  mainGauge.data[0].itemStyle ??= { color: '#2AF4FF' };
  mainGauge.detail ??= {
    show: false,
    color: '#2AF4FF',
    fontSize: 24,
    formatter: '',
  };

  const outerGauge = targetOption.series[1];
  outerGauge.min ??= mainGauge.min ?? 0;
  outerGauge.max ??= mainGauge.max ?? 100;
  outerGauge.splitNumber ??= mainGauge.splitNumber ?? 10;
};

const syncGaugeScale = (series: any[], rawValue: number) => {
  if (!Array.isArray(series) || series.length < 2) return;

  const mainGauge = series[0];
  const outerGauge = series[1];
  let nextMax = mainGauge.max;

  if (props.chartConfig.option.autoScale) {
    nextMax = Math.max(nextMax, getAutoScaleMax(rawValue));
  }

  mainGauge.max = nextMax;
  outerGauge.max = nextMax;
  outerGauge.min = mainGauge.min;
  outerGauge.splitNumber = mainGauge.splitNumber;
};

const applyValue = (rawValue: number, targetOption: any) => {
  const currentOption = targetOption ?? props.chartConfig.option;
  ensureDialSeries(currentOption);
  const series = currentOption.series ?? [];
  syncGaugeScale(series, rawValue);

  if (series[0]?.data?.[0]) {
    series[0].data[0].value = rawValue;
    series[0].detail.formatter = formatProgressDisplay(rawValue, {
      valueMode: 'range',
      minValue: series[0].min,
      maxValue: series[0].max,
      unit: props.chartConfig.option.unit,
      displayDecimals: props.chartConfig.option.displayDecimals,
      clamp: false,
    });
  }
};

const dataHandle = (newData: any) => {
  const rawValue = Number.parseFloat(`${newData ?? 0}`);
  applyValue(Number.isFinite(rawValue) ? rawValue : 0, props.chartConfig.option);
  option.value = mergeTheme(props.chartConfig.option, props.themeSetting, includes);
  option.value = props.chartConfig.option;
};

watch(
  () => props.chartConfig.option.dataset,
  (newData) => {
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
  applyValue(resData, option.value);
});
</script>
