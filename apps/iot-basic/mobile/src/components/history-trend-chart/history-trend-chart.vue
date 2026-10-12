<template>
<!-- 历史属性趋势图组件：通过 qiun-data-charts 渲染属性聚合结果。 -->
<view class="trend-chart-card">
  <view class="trend-chart-card__head">
    <view class="trend-chart-card__title-wrap">
      <text class="trend-chart-card__title">{{title}}</text>
      <text class="trend-chart-card__meta">{{subtitle}}</text>
    </view>
  </view>
  <view class="trend-chart-card__body">
    <qiun-data-charts
      v-if="hasDrawablePoints"
      type="line"
      canvasId="historyTrendChartUcharts"
      :canvas2d="true"
      :chartData="chartData"
      :opts="chartOptions"
      :inScrollView="true"
      :disableScroll="true"
    />
    <view v-else class="trend-chart-empty">
      <text>{{emptyText}}</text>
    </view>
  </view>
</view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { config } from '../../config';
import type { PropertyAggPoint } from '../../domain/interfaces/device-msg.repository';
import { createHistoryTrendChartData } from './history-trend-chart.model';

// 历史趋势图入参：页面传入当前属性聚合点、标题、副标题与空态文案。
const props = withDefaults(defineProps<{
  points: PropertyAggPoint[];
  title?: string;
  subtitle?: string;
  emptyText?: string;
}>(), {
  points: () => [],
  title: '趋势图',
  subtitle: '',
  emptyText: '暂无可绘制数据',
});

/** chartData 为 qiun-data-charts 的折线图数据源。 */
const chartData = computed(() => createHistoryTrendChartData(props.points, props.title || '历史属性'));

/** hasDrawablePoints 控制空态与插件图表切换，避免空数据时渲染异常图。 */
const hasDrawablePoints = computed(() => chartData.value.series[0]?.data.length > 0);

/** chartOptions 使用项目主题色约束折线图、网格、坐标轴与标签显示。 */
const chartOptions = {
  color: [config.themePrimaryColor],
  padding: [12, 18, 8, 42],
  fontSize: 10,
  fontColor: config.themeTextSecondaryColor,
  dataLabel: false,
  dataPointShape: true,
  legend: {
    show: false,
  },
  xAxis: {
    disableGrid: false,
    gridColor: config.themeChartGridColor,
    fontColor: config.themeTextSecondaryColor,
    boundaryGap: 'justify',
    axisLine: false,
  },
  yAxis: {
    gridType: 'solid',
    gridColor: config.themeChartGridColor,
    dashLength: 0,
    splitNumber: 4,
    data: [
      {
        fontColor: config.themeTextSecondaryColor,
        axisLine: false,
      },
    ],
  },
  extra: {
    line: {
      type: 'straight',
      width: 2,
      activeType: 'hollow',
    },
  },
};
</script>

<style lang="scss" scoped>
.trend-chart-card {
  margin: 10px 16px;
  padding: 12px 0 8px;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color);
}

.trend-chart-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 8px;
}

.trend-chart-card__title-wrap {
  flex: 1;
  min-width: 0;
}

.trend-chart-card__title {
  display: block;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trend-chart-card__meta {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trend-chart-card__body {
  position: relative;
  box-sizing: border-box;
  height: 220px;
  padding: 0 8px 4px;
}

.trend-chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
  font-size: 13px;
  pointer-events: none;
}
</style>
