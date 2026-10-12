import type { DataAdapter } from './types';

import { formatIoTTimeAxisLabel } from './iotAggregation';
import { resolveIoTConsumerContext } from './iotConsumerContext';
import { parseIoTMetaToSeries, buildSeriesFromMappings, deriveYAxisUnit } from './iotSeriesParser';

export const defaultAdapter: DataAdapter = {
  toOption(rows, currentOption) {
    if (rows.length === 0) return {};
    // rows 非空时首行必存在，此兜底仅为满足严格索引类型收窄
    const dimensions = Object.keys(rows[0] ?? {});
    const { iotMeta, mappings: userMappings } = resolveIoTConsumerContext(currentOption as any);

    if (iotMeta) {
      // 优先级：用户 UI 映射 > IoT 推导
      let series: ReturnType<typeof parseIoTMetaToSeries>['series'] = [];
      if (userMappings && Object.keys(userMappings).length > 0) {
        series = buildSeriesFromMappings(userMappings, 'bar', dimensions);
      }
      if (!series?.length) {
        series = parseIoTMetaToSeries(dimensions, iotMeta, 'bar').series;
      }

      // Y 轴单位自动填充
      const yAxisUnit = deriveYAxisUnit(iotMeta, dimensions);

      // 🔥 时间列检测：如果有 time 列，不硬编码 xAxis.type，让 ECharts 自动处理
      const hasTimeCol = dimensions.includes('time');

      return {
        dataset: { dimensions, source: rows },
        series,
        xAxis: {
          ...(hasTimeCol ? { type: 'time' } : { type: 'category' }),
          axisLabel: {
            formatter: hasTimeCol && iotMeta.timeAxisLabelFormat
              ? ((value: unknown) => formatIoTTimeAxisLabel(value, iotMeta.timeAxisLabelFormat!))
              : undefined,
          },
        },
        ...(yAxisUnit ? { yAxis: { name: yAxisUnit } } : {}),
      } as any;
    }

    // 原逻辑不变
    return { dataset: { dimensions, source: rows } } as any;
  },

  fromOption(option) {
    const dataset = option.dataset;
    if (!dataset?.source) return { rows: [] };
    const rows = Array.isArray(dataset.source) ? [...dataset.source] : [];
    return { rows };
  },
};
