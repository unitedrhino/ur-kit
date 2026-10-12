<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EchartsUIType } from '@vben/plugins/echarts';
import { $t } from '@vben/locales';
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

    const validData = yData.filter((v) => v > 0);
    const avg =
      validData.length > 0
        ? validData.reduce((a, b) => a + b, 0) / validData.length
        : 0;

    renderEcharts({
      tooltip: {
        trigger: 'axis',
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        textStyle: { color: t.tooltipText, fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          return `<div style="font-size:12px">
            <div style="color:${t.axisLabel}">${p.axisValue}</div>
            <div style="margin-top:4px">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.accent};margin-right:6px"></span>
              ${$t('orgIotClient.energyDashboard.powerTip')} <b style="color:${t.accentLight};margin-left:8px">${Number(p.value).toFixed(3)} kW</b>
            </div>
          </div>`;
        },
      },
      grid: { top: 30, left: 12, right: 12, bottom: 30, containLabel: true },
      xAxis: {
        type: 'category',
        data: xData,
        boundaryGap: false,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: t.axisLine } },
        axisLabel: {
          color: t.axisLabel,
          fontSize: 10,
          interval: 'auto',
        },
      },
      yAxis: {
        type: 'value',
        name: 'kW',
        nameTextStyle: { color: t.textDim, fontSize: 10 },
        splitLine: { lineStyle: { color: t.splitLine } },
        axisLabel: { color: t.textDim, fontSize: 10 },
      },
      series: [
        {
          data: yData,
          type: 'line',
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          emphasis: { itemStyle: { borderWidth: 2, borderColor: '#fff' } },
          itemStyle: { color: t.accent },
          lineStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: t.accent },
                { offset: 0.5, color: t.accentLight },
                { offset: 1, color: t.accent },
              ],
            },
            width: 2,
            shadowColor: t.lineShadow,
            shadowBlur: 8,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: t.areaGradient[0] },
                { offset: 0.5, color: t.areaGradient[1] },
                { offset: 1, color: t.areaGradient[2] },
              ],
            },
          },
          markLine:
            avg > 0
              ? {
                  silent: true,
                  symbol: 'none',
                  lineStyle: {
                    color: t.tooltipBorder,
                    type: 'dashed',
                    width: 1,
                  },
                  label: {
                    formatter: $t('orgIotClient.energyDashboard.averageLabel', { value: `${avg.toFixed(3)}kW` }),
                    position: 'insideEndTop',
                    color: t.chartLabel,
                    fontSize: 10,
                  },
                  data: [{ yAxis: avg }],
                }
              : undefined,
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
