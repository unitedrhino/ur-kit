<script setup lang="ts">
import type { PropType } from 'vue';

import { computed, nextTick, ref, watch } from 'vue';
import VChart from 'vue-echarts';

import { useChartDataFetch } from '@/hooks';
import { useCanvasInitOptions } from '@/hooks/useCanvasInitOptions.hook';
import { hasIoTDatasetMeta } from '@/packages/components/Charts/utils/iotDataset';
import { fixSameValueYAxis, mergeTheme } from '@/packages/public/chart';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { LineChart } from 'echarts/charts';
import { DatasetComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { cloneDeep } from 'lodash';
import isObject from 'lodash/isObject';

import config, { includes, seriesItem } from './config';

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

const replaceMergeArr = ref<string[]>();

const option = computed(() => {
  const merged = mergeTheme(props.chartConfig.option, props.themeSetting, includes);
  fixSameValueYAxis(merged);
  return merged;
});

// dataset 无法变更条数的补丁
watch(
  () => props.chartConfig.option.dataset,
  (newData: { dimensions: any }, _oldData) => {
    try {
      if (!isObject(newData) || !('dimensions' in newData)) return;
      if (Array.isArray(newData?.dimensions)) {
        const expectedCount = newData.dimensions.length - 1;
        const currentSeries = props.chartConfig.option.series;
        // 如果 series 已有 encode（适配器/映射器设置的）且数量匹配，跳过重建
        if (Array.isArray(currentSeries) && currentSeries.length === expectedCount && currentSeries[0]?.encode) {
          replaceMergeArr.value = ['series'];
          nextTick(() => { replaceMergeArr.value = []; });
          return;
        }
        const seriesArr: any[] = [];
        for (let i = 0; i < expectedCount; i++) {
          const s = cloneDeep(seriesItem);
          // 补充 encode（原逻辑缺失）
          if (newData.dimensions.length >= 2) {
            s.encode = newData.dimensions[i + 1] !== undefined
              ? { x: newData.dimensions[0], y: newData.dimensions[i + 1] }
              : { x: newData.dimensions[0], y: '' };
          }
          seriesArr.push(s);
        }
        replaceMergeArr.value = ['series'];
        // eslint-disable-next-line vue/no-mutating-props
        props.chartConfig.option.series = seriesArr;
        nextTick(() => {
          replaceMergeArr.value = [];
        });
      }
    } catch (error) {
      console.error(error);
    }
  },
  {
    deep: false,
  },
);

const { vChartRef } = useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  if (hasIoTDatasetMeta(newData)) return;
  // eslint-disable-next-line vue/no-mutating-props
  props.chartConfig.option.dataset = newData;
});
</script>

<template>
  <VChart
    ref="vChartRef"
    :init-options="initOptions"
    :theme="themeColor"
    :option="option"
    :update-options="{
      replaceMerge: replaceMergeArr,
    }"
    autoresize
  />
</template>
