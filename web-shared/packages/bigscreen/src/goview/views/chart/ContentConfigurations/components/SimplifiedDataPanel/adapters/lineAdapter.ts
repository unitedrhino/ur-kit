/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema } from './types';

import { cloneDeep } from 'lodash';

import { formatIoTTimeAxisLabel } from './iotAggregation';
import { resolveIoTConsumerContext } from './iotConsumerContext';
import { parseIoTMetaToSeries, buildSeriesFromMappings, deriveYAxisUnit } from './iotSeriesParser';

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

export const lineAdapter: DataAdapter = {
  toOption(rows, currentOption) {
    if (rows.length === 0) return {};
    // rows 非空时首行必存在，此兜底仅为满足严格索引类型收窄
    const dimensions = Object.keys(rows[0] ?? {});
    const { iotMeta, mappings: userMappings } = resolveIoTConsumerContext(currentOption as any);

    if (iotMeta) {
      // 优先级：用户 UI 映射 > IoT 推导
      let series: ReturnType<typeof parseIoTMetaToSeries>['series'] = [];
      if (userMappings && Object.keys(userMappings).length > 0) {
        series = buildSeriesFromMappings(userMappings, 'line', dimensions);
      }
      if (!series?.length) {
        series = parseIoTMetaToSeries(dimensions, iotMeta, 'line').series;
      }

      // 保留折线组件原始样式骨架，避免 IoT 历史时序重建 series 后
      // 丢失 lineStyle / label / symbolSize，导致样式面板内容变空。
      if (Array.isArray(currentOption?.series) && currentOption.series.length > 0) {
        const styleTemplates = currentOption.series;
        series = (series as any[]).map((seriesItem: any, index: number) => {
          const template = cloneDeep(styleTemplates[index] || styleTemplates[0] || {});
          return {
            ...template,
            ...seriesItem,
            type: seriesItem.type,
            name: seriesItem.name,
            encode: seriesItem.encode,
          };
        });
      }

      // 🔥 仅当原始设计 series 包含渐变样式时，才限制折线数量并保留样式模板
      // 单折线渐变图=1, 双折线渐变面积图=2；基础折线图无渐变，不截断
      const opt = currentOption as any;
      if (!opt._originalSeries && Array.isArray(currentOption?.series) && currentOption.series.length > 0) {
        opt._originalSeries = cloneDeep(currentOption.series);
      }
      const designTemplates = opt._originalSeries;
      const hasGradientStyle = Array.isArray(designTemplates) && designTemplates.length > 0
        && designTemplates.some((t: any) =>
          t?.lineStyle?.color?.type === 'linear'
          || t?.areaStyle?.color?.type === 'linear',
        );
      if (hasGradientStyle) {
        const maxSeries = designTemplates.length;
        series = (series as any[]).slice(0, maxSeries).map((s: any, i: number) => {
          const template = cloneDeep(designTemplates[i] || designTemplates[0]);
          return {
            ...template,     // 保留原始渐变样式（lineStyle/areaStyle/label 等）
            type: s.type,    // 确保类型正确
            encode: s.encode, // 使用 IoT 推导的维度绑定
            name: s.name,    // 使用 IoT 推导的系列名
          };
        });
      }

      // 折线图特有属性
      (series as any[]).forEach((s: any) => {
        s.smooth = true;
        s.connectNulls = false; // 属性无有效数据的时段必须断开。
        s.encode = { ...s.encode };
      });

      // Y 轴单位自动填充
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
        series = (series as any[]).map((seriesItem: any) => ({
          ...seriesItem,
          encode: {
            ...seriesItem.encode,
            x: 'timeLabel',
          },
        }));
      }

      return {
        dataset: {
          dimensions: useCategoryTimeAxis ? ['timeLabel', ...dimensions.filter((dim) => dim !== 'time')] : dimensions,
          source: nextRows,
        },
        series,
        xAxis: {
          type: useCategoryTimeAxis ? 'category' : hasTimeCol ? 'time' : 'category',
          ...(useCategoryTimeAxis ? { boundaryGap: false } : {}),
          axisLabel: {
            formatter: useCategoryTimeAxis
              ? ((value: unknown) => formatCategoryTimeLabel(value, iotMeta.timeAxisLabelFormat))
              : hasTimeCol && iotMeta.timeAxisLabelFormat
                ? ((value: unknown) => formatIoTTimeAxisLabel(value, iotMeta.timeAxisLabelFormat!))
                : undefined,
          },
        },
        ...(yAxisUnit ? { yAxis: { name: yAxisUnit } } : {}),
      } as any;
    }

    // ── 原逻辑：动态生成 series，确保数量与指标维度一致 ──
    const metricCount = Math.max(0, dimensions.length - 1);
    const result: any = {
      dataset: { dimensions, source: rows },
    };

    // 优先保留原有 series 样式（渐变色、线条等），不足时克隆 series[0]
    const existingSeries = currentOption?.series;
    if (Array.isArray(existingSeries) && existingSeries.length > 0 && metricCount > 0) {
      result.series = [];
      for (let i = 0; i < metricCount; i++) {
        result.series.push(cloneDeep(existingSeries[i] || existingSeries[0]));
      }
    }

    return result;
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
        { key: 'x', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.xAxisTimeCategory'); }, required: true, acceptTypes: ['string'] },
        { key: 'y', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.yAxisValue'); }, required: true, multiple: true, acceptTypes: ['number'] },
      ],
    };
  },
};
