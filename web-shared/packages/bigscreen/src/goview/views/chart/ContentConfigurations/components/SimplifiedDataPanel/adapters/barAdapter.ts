/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema } from './types';

import { formatIoTTimeAxisLabel } from './iotAggregation';
import { resolveIoTConsumerContext } from './iotConsumerContext';
import { parseIoTMetaToSeries, buildSeriesFromMappings, deriveYAxisUnit, applySeriesTemplateCycle } from './iotSeriesParser';

const formatCategoryTimeLabel = (value: unknown, format?: string) => {
  if (format && format !== 'time') {
    return formatIoTTimeAxisLabel(value, format as any);
  }

  const date = new Date(typeof value === 'number' ? value : String(value));
  if (Number.isNaN(date.getTime())) return String(value ?? '');

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (hours === '00' && minutes === '00') {
    return `${month}-${day}`;
  }

  return `${hours}:${minutes}`;
};

const formatBarLabelValue = (value: unknown) => {
  const nextValue = typeof value === 'number' ? value : Number.parseFloat(`${value ?? ''}`);
  if (!Number.isFinite(nextValue)) return `${value ?? ''}`;
  return nextValue.toFixed(2);
};

const resolveSeriesValueField = (seriesItem: any) => {
  const encode = seriesItem?.encode;
  if (!encode) return '';
  return encode.y ?? '';
};

const resolveBarLabelActualValue = (
  params: { data?: Record<string, unknown>; seriesName?: string; value?: unknown },
  valueField: string,
) => {
  if (valueField && params.data && typeof params.data === 'object' && valueField in params.data) {
    return params.data[valueField];
  }

  if (params.seriesName && params.data && typeof params.data === 'object' && params.seriesName in params.data) {
    return params.data[params.seriesName];
  }

  if (Array.isArray(params.value)) {
    const reversed = [...params.value].reverse();
    const candidate = reversed.find((item) => {
      const n = typeof item === 'number' ? item : Number.parseFloat(`${item ?? ''}`);
      return Number.isFinite(n);
    });
    return candidate;
  }

  if (params.value && typeof params.value === 'object') {
    if (params.seriesName && params.seriesName in (params.value as Record<string, unknown>)) {
      return (params.value as Record<string, unknown>)[params.seriesName];
    }
    const numericEntry = Object.entries(params.value as Record<string, unknown>).find(([key, candidate]) => {
      if (['time', 'timeLabel', '时间', '_timestamp'].includes(key)) return false;
      const n = typeof candidate === 'number' ? candidate : Number.parseFloat(`${candidate ?? ''}`);
      return Number.isFinite(n);
    });
    if (numericEntry) return numericEntry[1];
  }

  if (params.value && typeof params.value === 'object' && valueField && valueField in (params.value as Record<string, unknown>)) {
    return (params.value as Record<string, unknown>)[valueField];
  }

  return params.value;
};

const resolveBarYAxisRange = (rows: Record<string, any>[], dimensions: string[], xField: string) => {
  const numericFields = dimensions.filter((field) => field !== xField);
  const values: number[] = [];
  rows.forEach((row) => {
    numericFields.forEach((field) => {
      const rawValue = row[field];
      const nextValue = typeof rawValue === 'number' ? rawValue : Number.parseFloat(`${rawValue ?? ''}`);
      if (Number.isFinite(nextValue)) {
        values.push(nextValue);
      }
    });
  });

  if (values.length === 0) {
    return { max: 10, min: 0 };
  }

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  if (maxValue <= 0 && minValue >= 0) {
    return { max: Math.max(maxValue, 10), min: 0 };
  }

  return { max: null, min: minValue >= 0 ? 0 : null };
};

// BarLine 的默认模板（与 BarLine/config.ts 保持一致）
const BAR_LINE_TEMPLATES = [
  {
    type: 'bar',
    barWidth: 15,
    label: { show: true, position: 'top', color: '#fff', fontSize: 12 },
    itemStyle: { color: null, borderRadius: 2 },
  },
  {
    type: 'line',
    symbol: 'circle',
    symbolSize: 5,
    label: { show: true, position: 'top', color: '#fff', fontSize: 12 },
    itemStyle: { borderWidth: 1 },
    lineStyle: { type: 'solid', width: 3, color: null },
  },
];

export const barAdapter: DataAdapter = {
  toOption(rows, currentOption) {
    if (rows.length === 0) return {};
    // rows 非空时首行必存在，此兜底仅为满足严格索引类型收窄
    const dimensions = Object.keys(rows[0] ?? {});
    const { chartKey, iotMeta, mappings: userMappings } = resolveIoTConsumerContext(currentOption as any);

    if (iotMeta) {
      let series: ReturnType<typeof parseIoTMetaToSeries>['series'] = [];
      if (userMappings && Object.keys(userMappings).length > 0) {
        series = buildSeriesFromMappings(userMappings, 'bar', dimensions);
      }
      if (!series?.length) {
        series = parseIoTMetaToSeries(dimensions, iotMeta, 'bar').series;
      }

      // 🔥 BarLine 特殊处理：使用 bar/line 交替模板
      const isBarLine = chartKey === 'VBarLine' || chartKey === 'BarLine';
      const templates = isBarLine ? BAR_LINE_TEMPLATES : (currentOption?.series as Array<Record<string, any>>);

      series = applySeriesTemplateCycle(series, templates);

      (series as any[]).forEach((seriesItem: any) => {
        if (seriesItem.type === 'bar') {
          seriesItem.barMaxWidth ??= 30;
          seriesItem.itemStyle ??= { color: null, borderRadius: 2 };
        }
        seriesItem.label ??= { show: true, position: 'top', color: '#fff', fontSize: 12 };
        seriesItem.labelLayout ??= { hideOverlap: false };
        seriesItem.label.formatter ??= (params: { data?: Record<string, unknown>; seriesName?: string; value?: unknown }) => {
          const valueField = resolveSeriesValueField(seriesItem);
          const actualValue = resolveBarLabelActualValue(params, valueField);
          return formatBarLabelValue(actualValue);
        };
      });

      const yAxisUnit = deriveYAxisUnit(iotMeta, dimensions);
      const hasTimeCol = dimensions.includes('time');
      const useCategoryTimeAxis = hasTimeCol && iotMeta.mode === 'log';
      // dimensions 非空时首列必存在，此兜底仅为满足严格索引类型收窄
      const xDim = hasTimeCol ? 'time' : (dimensions[0] ?? '');

      let nextRows = rows;
      if (useCategoryTimeAxis) {
        nextRows = rows.map((row) => {
          const { time, ...rest } = row as Record<string, any>;
          return {
            ...rest,
            timeLabel: time,
          };
        });
        series = (series as any[]).map((seriesItem: any) => ({
          ...seriesItem,
          encode: {
            ...seriesItem.encode,
            x: 'timeLabel',
            y: seriesItem.encode?.y,
          },
        }));
      }

      const valueAxisRange = resolveBarYAxisRange(
        nextRows as Record<string, any>[],
        useCategoryTimeAxis ? ['timeLabel', ...dimensions.filter((dim) => dim !== 'time')] : dimensions,
        useCategoryTimeAxis ? 'timeLabel' : xDim,
      );

      return {
        dataset: {
          dimensions: useCategoryTimeAxis ? ['timeLabel', ...dimensions.filter((dim) => dim !== 'time')] : dimensions,
          source: nextRows,
        },
        series,
        xAxis: {
          type: useCategoryTimeAxis ? 'category' : hasTimeCol ? 'time' : 'category',
          axisLine: { onZero: false },
          ...(useCategoryTimeAxis ? { boundaryGap: true, axisTick: { alignWithLabel: true } } : {}),
          axisLabel: {
            formatter: useCategoryTimeAxis
              ? ((value: unknown) => formatCategoryTimeLabel(value, iotMeta.timeAxisLabelFormat))
              : hasTimeCol && iotMeta.timeAxisLabelFormat
                ? ((value: unknown) => formatIoTTimeAxisLabel(value, iotMeta.timeAxisLabelFormat!))
                : undefined,
          },
        },
        yAxis: {
          name: yAxisUnit || '',
          max: valueAxisRange.max,
          min: valueAxisRange.min,
        },
      } as any;
    }

    return { dataset: { dimensions, source: rows } } as any;
  },

  fromOption(option) {
    const dataset = option.dataset;
    if (!dataset?.source) return { rows: [] };
    const rows = Array.isArray(dataset.source) ? dataset.source.map((row: any) => ({ ...row })) : [];
    return { rows };
  },

  getMappingSchema(): MappingSchema {
    return {
      mode: 'flat',
      fields: [
        { key: 'x', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.xAxisCategory'); }, required: true, acceptTypes: ['string'] },
        { key: 'y', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.yAxisValue'); }, required: true, multiple: true, acceptTypes: ['number'] },
      ],
    };
  },
};
