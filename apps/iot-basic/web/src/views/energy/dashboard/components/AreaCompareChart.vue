<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EchartsUIType } from '@vben/plugins/echarts';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useDashboardTheme } from '../composables/useTheme';

const props = defineProps<{
  names: string[];
  values: number[];
}>();

const theme = useDashboardTheme();
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

watch(
  () => ({ names: props.names, values: props.values, t: theme.value }),
  ({ names, values, t }) => {
    if (!names?.length) return;

    const colors = t.chartColors;
    const combined = names
      .map((name, i) => ({ name, value: values?.[i] ?? 0 }))
      .sort((a, b) => a.value - b.value);

    const sortedNames = combined.map((i) => i.name);
    const sortedValues = combined.map((i) => i.value);

    renderEcharts({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        textStyle: { color: t.tooltipText, fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          return `<div style="font-size:12px">
            ${p.name}: <b style="color:${t.accentLight}">${Number(p.value).toFixed(2)} kWh</b>
          </div>`;
        },
      },
      grid: { top: 12, left: 12, right: 50, bottom: 12, containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: t.splitLine } },
        axisLabel: { color: t.textDim, fontSize: 10 },
      },
      yAxis: {
        type: 'category',
        data: sortedNames,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: t.textMuted, fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: sortedValues,
          barWidth: '50%',
          barMaxWidth: 24,
          label: {
            show: true,
            position: 'right',
            color: t.chartLabel,
            fontSize: 10,
            formatter: (params: any) => `${Number(params.value).toFixed(1)}`,
          },
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: ((params: any) => {
              const idx = sortedNames.length - 1 - params.dataIndex;
              const c = colors[idx % colors.length] ?? t.accent;
              return {
                type: 'linear' as const,
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: `${c}80` },
                  { offset: 1, color: c },
                ],
              };
            }) as any,
          },
        },
      ],
    });
  },
  { immediate: true },
);
</script>

<template>
  <EchartsUI ref="chartRef" height="100%" />
</template>
