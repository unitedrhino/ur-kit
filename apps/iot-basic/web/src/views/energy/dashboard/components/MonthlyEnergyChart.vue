<script setup lang="ts">
import { ref, watch } from 'vue';
import { $t } from '@vben/locales';
import type { EchartsUIType } from '@vben/plugins/echarts';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useDashboardTheme } from '../composables/useTheme';

const props = defineProps<{
  xData: string[];
  yData: number[];
}>();

const theme = useDashboardTheme();
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

watch(
  () => ({ xData: props.xData, yData: props.yData, t: theme.value }),
  ({ xData, yData, t }) => {
    if (!xData?.length) return;
    const maxVal = Math.max(...yData, 1);

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
            <div style="color:${t.axisLabel}">${p.axisValue}</div>
            <div style="margin-top:4px">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${t.accentDark};margin-right:6px"></span>
              ${$t('orgIotClient.energyDashboard.energyTip')} <b style="color:${t.accentLight};margin-left:8px">${Number(p.value).toFixed(2)} kWh</b>
            </div>
          </div>`;
        },
      },
      grid: { top: 30, left: 12, right: 12, bottom: 24, containLabel: true },
      xAxis: {
        type: 'category',
        data: xData,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: t.axisLine } },
        axisLabel: { color: t.axisLabel, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: 'kWh',
        nameTextStyle: { color: t.textDim, fontSize: 10 },
        splitLine: { lineStyle: { color: t.splitLine } },
        axisLabel: { color: t.textDim, fontSize: 10 },
      },
      series: [
        {
          data: yData,
          type: 'bar',
          barWidth: '40%',
          barMaxWidth: 40,
          label: {
            show: true,
            position: 'top',
            color: t.chartLabel,
            fontSize: 10,
            formatter: (params: any) => {
              const v = Number(params.value);
              return v > 0 ? v.toFixed(1) : '';
            },
          },
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: (params: any) => {
              const ratio = Number(params.value) / maxVal;
              return {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: ratio > 0.7 ? t.accentLight : t.accentDark,
                  },
                  {
                    offset: 1,
                    color:
                      ratio > 0.7
                        ? t.areaGradient[0]
                        : t.areaGradient[1],
                  },
                ],
              };
            },
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
