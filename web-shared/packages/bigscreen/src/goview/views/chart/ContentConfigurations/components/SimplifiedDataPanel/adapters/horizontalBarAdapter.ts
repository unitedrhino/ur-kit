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
  return encode.x ?? '';
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

const resolveHorizontalBarValueAxisRange = (rows: Record<string, any>[], dimensions: string[], categoryField: string) => {
  const numericFields = dimensions.filter((field) => field !== categoryField);
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

/**
 * 横向柱状图适配器 —— 与 barAdapter 逻辑一致，但 xAxis/yAxis 互换。
 *
 * ECharts 横向柱状图约定：
 *   - xAxis = 数值轴（value）
 *   - yAxis = 分类轴（category）
 *   - series.encode: { x: 数值列, y: 分类列 }
 */
export const horizontalBarAdapter: DataAdapter = {
  toOption(rows, currentOption) {
    if (rows.length === 0) return {};
    // rows 非空时首行必存在，此兜底仅为满足严格索引类型收窄
    const dimensions = Object.keys(rows[0] ?? {});
    const { iotMeta, mappings: userMappings } = resolveIoTConsumerContext(currentOption as any);

    if (iotMeta) {
      // 优先级：用户 UI 映射 > IoT 推导
      let series;
      if (userMappings && Object.keys(userMappings).length > 0) {
        series = buildSeriesFromMappings(userMappings, 'bar', dimensions);
      } else {
        series = parseIoTMetaToSeries(dimensions, iotMeta, 'bar').series;
      }

      series = applySeriesTemplateCycle(series, currentOption?.series as Array<Record<string, any>> | undefined);

      // 横向柱状图特有属性（与 BarCrossrange/config.ts seriesItem 保持一致）
      (series as any[]).forEach((s: any) => {
        s.barMaxWidth = 30;
        if (!s.itemStyle) s.itemStyle = { color: null, borderRadius: 0 };
        if (!s.label) s.label = { show: true, position: 'right', color: '#fff', fontSize: 12 };
        s.labelLayout ??= { hideOverlap: false };
        s.label.formatter ??= (params: { data?: Record<string, unknown>; seriesName?: string; value?: unknown }) => {
          const valueField = resolveSeriesValueField(s);
          const actualValue = resolveBarLabelActualValue(params, valueField);
          return formatBarLabelValue(actualValue);
        };
      });

      // 🔥 关键区别：swap encode 的 x/y
      (series as any[]).forEach((s: any) => {
        if (s.encode) {
          const tmp = s.encode.x;
          s.encode.x = s.encode.y;
          s.encode.y = tmp;
        }
      });

      // X 轴单位自动填充（横向柱状图的值轴在 xAxis）
      const yAxisUnit = deriveYAxisUnit(iotMeta, dimensions);
      const hasTimeCol = dimensions.includes('time');
      const useCategoryTimeAxis = hasTimeCol && iotMeta.mode === 'log';

      let nextRows = rows;
      if (useCategoryTimeAxis) {
        nextRows = rows.map((row) => {
          const { time, ...rest } = row as Record<string, any>;
          return {
            ...rest,
            timeLabel: time,
          };
        });
        (series as any[]).forEach((s: any) => {
          if (s.encode) {
            s.encode.y = 'timeLabel';
          }
        });
      }

      const valueAxisRange = resolveHorizontalBarValueAxisRange(
        nextRows as Record<string, any>[],
        useCategoryTimeAxis ? ['timeLabel', ...dimensions.filter((dim) => dim !== 'time')] : dimensions,
        // dimensions 非空时首列必存在，此兜底仅为满足严格索引类型收窄
        useCategoryTimeAxis ? 'timeLabel' : hasTimeCol ? 'time' : (dimensions[0] ?? ''),
      );

      return {
        dataset: {
          dimensions: useCategoryTimeAxis ? ['timeLabel', ...dimensions.filter((dim) => dim !== 'time')] : dimensions,
          source: nextRows,
        },
        series,
        xAxis: {
          name: yAxisUnit || '',
          max: valueAxisRange.max,
          min: valueAxisRange.min,
        },
        yAxis: {
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
      } as any;
    }

    // 原逻辑不变
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
        { key: 'y', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.yAxisCategory'); }, required: true, acceptTypes: ['string'] },
        { key: 'x', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.xAxisValue'); }, required: true, multiple: true, acceptTypes: ['number'] },
      ],
    };
  },
};
