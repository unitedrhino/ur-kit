// 历史属性趋势图数据模型：将属性聚合点转换为 qiun-data-charts 可消费的数据结构。

import type { PropertyAggPoint } from '../../domain/interfaces/device-msg.repository';

export interface HistoryTrendChartSeries {
  /** 图表序列名称，显示为当前属性名称。 */
  name: string;
  /** 图表序列数值，已过滤非数字点。 */
  data: number[];
}

export interface HistoryTrendChartData {
  /** 横轴分类标签，按点位时间格式化为 HH:mm。 */
  categories: string[];
  /** 折线图序列，当前历史属性页只展示单条属性曲线。 */
  series: HistoryTrendChartSeries[];
}

const MAX_VISIBLE_X_AXIS_LABELS = 3;

/**
 * formatHistoryTrendTime 将时间戳转换为图表横轴 HH:mm 标签。
 * @param timestamp 历史属性点的毫秒时间戳。
 * @returns 本地时区的小时分钟标签；时间戳为空时返回空字符串。
 */
export function formatHistoryTrendTime(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${hour}:${minute}`;
}

/**
 * thinHistoryTrendLabels 抽稀横轴标签，避免小时级密集点在小屏上互相覆盖。
 * @param labels 原始横轴时间标签。
 * @returns 保留首、中、尾后的横轴标签；空字符串位置仍参与折线点位布局。
 */
export function thinHistoryTrendLabels(labels: string[]): string[] {
  if (labels.length <= MAX_VISIBLE_X_AXIS_LABELS) {
    return labels;
  }
  const visibleIndexes = new Set([
    0,
    Math.floor((labels.length - 1) / 2),
    labels.length - 1,
  ]);
  return labels.map((label, index) => (visibleIndexes.has(index) ? label : ''));
}

/**
 * createHistoryTrendChartData 过滤非数值历史点并生成插件图表数据。
 * @param points 后端返回的属性聚合点列表。
 * @param seriesName 折线序列名称，默认展示为历史属性。
 * @returns qiun-data-charts 折线图可消费的分类与序列数据。
 */
export function createHistoryTrendChartData(
  points: PropertyAggPoint[],
  seriesName = '历史属性',
): HistoryTrendChartData {
  const drawablePoints = points.filter((point) => Number.isFinite(point.value));
  const labels = drawablePoints.map((point) => formatHistoryTrendTime(point.timestamp));

  return {
    categories: thinHistoryTrendLabels(labels),
    series: [
      {
        name: seriesName,
        data: drawablePoints.map((point) => point.value as number),
      },
    ],
  };
}
