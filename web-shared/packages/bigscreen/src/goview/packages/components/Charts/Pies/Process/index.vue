<template>
  <n-progress
    :type="type"
    :height="h"
    :processing="processing"
    :percentage="normalizedPercentage"
    :indicator-placement="indicatorPlacement"
    :color="color"
    :rail-color="railColor"
    :offset-degree="offsetDegree"
  >
    <n-text
      :style="{
        color: indicatorTextColor,
        fontSize: `${indicatorTextSize}px`,
      }"
    >
      {{ displayText }}
    </n-text>
  </n-progress>
</template>

<script setup lang="ts">
import { computed, type PropType, toRefs, watch } from 'vue';

import { useChartDataFetch } from '@/hooks';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';

import config from './config';
import { extractSingleMetricValue } from '../../utils/progressValue';

const props = defineProps({
  chartConfig: {
    type: Object as PropType<config>,
    required: true,
  },
});

const { h } = toRefs(props.chartConfig.attr);
const {
  type,
  unit,
  percentMode,
  maxValue,
  displayDecimals,
  color,
  processing,
  railColor,
  indicatorTextColor,
  indicatorPlacement,
  indicatorTextSize,
  offsetDegree,
  dataset,
} = toRefs(props.chartConfig.option);

const resolveNumericValue = (value: unknown) => {
  const extracted = extractSingleMetricValue(value, props.chartConfig);
  const normalized = typeof extracted === 'number' ? extracted : Number(extracted);
  return Number.isFinite(normalized) ? normalized : 0;
};

const formatNumericText = (value: unknown, digits: number) => {
  const safeValue = resolveNumericValue(value);
  return Number(Number(safeValue).toFixed(digits));
};

const normalizedPercentage = computed(() => {
  const raw = resolveNumericValue(dataset.value);
  if (percentMode.value) {
    return Math.min(100, Math.max(0, raw) * 100);
  }
  return Math.min(100, (Math.max(0, raw) / Math.max(1, Number(maxValue.value) || 100)) * 100);
});

const displayText = computed(() => {
  const digits = Math.max(0, Number(displayDecimals.value) || 0);
  if (percentMode.value) {
    return `${formatNumericText(Math.min(1, Math.max(0, resolveNumericValue(dataset.value))) * 100, digits)}%`;
  }
  return `${formatNumericText(dataset.value, digits)}${unit.value ?? ''}`;
});

const syncDatasetValue = (newData: unknown) => {
  dataset.value = resolveNumericValue(newData);
};

watch(
  () => props.chartConfig.option.dataset,
  (newData: any) => {
    try {
      syncDatasetValue(newData);
    } catch (error) {
      console.log(error);
    }
  },
  {
    deep: false,
  },
);

useChartDataFetch(props.chartConfig, useChartEditStore, (newData: number) => {
  syncDatasetValue(newData);
});
</script>
