<script setup lang="ts">
import { $t } from '@vben/locales';
import { ref, watch } from 'vue';
import type { EchartsUIType } from '@vben/plugins/echarts';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useDashboardTheme } from '../composables/useTheme';

const props = defineProps<{
  data: { name: string; value: number; color: string }[];
  total: number;
}>();

const theme = useDashboardTheme();
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

watch(
  () => ({ data: props.data, total: props.total, t: theme.value }),
  ({ data, total, t }) => {
    renderEcharts({
      tooltip: {
        trigger: 'item',
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        textStyle: { color: t.tooltipText, fontSize: 12 },
        formatter: (p: any) => $t('orgIotClient.energyDashboard.deviceCountTip', { name: p.name, value: p.value, percent: p.percent }),
      },
      legend: {
        orient: 'horizontal',
        bottom: 6,
        left: 'center',
        textStyle: { color: t.axisLabel, fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 14,
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '68%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: t.pieBorderColor,
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'center',
            formatter: `{total|${total}}\n{label|${$t('orgIotClient.dashboard.totalDevices')}}`,
            rich: {
              total: {
                fontSize: 22,
                fontWeight: 'bold',
                color: t.centerText,
                lineHeight: 30,
              },
              label: {
                fontSize: 11,
                color: t.centerSubText,
                lineHeight: 18,
              },
            },
          },
          data: data.map((d) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: d.color },
          })),
        },
      ],
    });
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <EchartsUI ref="chartRef" class="chart" />
</template>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
  min-height: 180px;
}
</style>
