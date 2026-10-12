/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema, SimplifiedDataState } from './types';

import { getMappedKey, normalizeState, toNumberSafe, toStringSafe } from './helpers';

const HEATMAP_COLUMNS = [
  { key: 'yAxis', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.yAxisDimension'); }, type: 'string' as const },
  { key: 'xAxis', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.xAxisDimension'); }, type: 'string' as const },
  { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.intensityValue'); }, type: 'number' as const },
];

export const heatmapAdapter: DataAdapter = {
  fromOption(option) {
    const dataset = option?.dataset ?? {};
    const xAxis = Array.isArray(dataset.xAxis) ? dataset.xAxis : [];
    const yAxis = Array.isArray(dataset.yAxis) ? dataset.yAxis : [];
    const seriesData = Array.isArray(dataset.seriesData) ? dataset.seriesData : [];

    const rows = seriesData.map((item: any) => {
      const xIdx = toNumberSafe(item?.[0], 0);
      const yIdx = toNumberSafe(item?.[1], 0);
      return {
        yAxis: toStringSafe(yAxis[yIdx]),
        xAxis: toStringSafe(xAxis[xIdx]),
        value: toNumberSafe(item?.[2], 0),
      };
    });

    return {
      columns: HEATMAP_COLUMNS,
      rows,
    };
  },

  toOption(tableData) {
    const state = normalizeState(tableData);
    const rows = state.rows ?? [];
    const xKey = getMappedKey(state.mappings, 'xAxis', 'xAxis');
    const yKey = getMappedKey(state.mappings, 'yAxis', 'yAxis');
    const valueKey = getMappedKey(state.mappings, 'value', 'value');

    const xAxis = [...new Set(rows.map((row) => toStringSafe(row[xKey])).filter((value) => value !== ''))];
    const yAxis = [...new Set(rows.map((row) => toStringSafe(row[yKey])).filter((value) => value !== ''))];

    const seriesData = rows
      .map((row) => {
        const xLabel = toStringSafe(row[xKey]);
        const yLabel = toStringSafe(row[yKey]);
        if (!xLabel || !yLabel) return null;
        return [xAxis.indexOf(xLabel), yAxis.indexOf(yLabel), toNumberSafe(row[valueKey], 0)];
      })
      .filter(Boolean);

    return {
      dataset: {
        xAxis,
        yAxis,
        seriesData,
      },
    };
  },

  getMappingSchema(): MappingSchema {
    return {
      mode: 'flat',
      fields: [
        { key: 'xAxis', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.xAxisHorizontalScale'); }, required: true, acceptTypes: ['string'] },
        { key: 'yAxis', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.yAxisVerticalScale'); }, required: true, acceptTypes: ['string'] },
        { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.colorIntensityBasedOn'); }, required: true, acceptTypes: ['number'] },
      ],
    };
  },

  getSummaryText(state: SimplifiedDataState) {
    const rows = state.rows?.length ?? 0;
    return editorT('bigscreenEditor.dynamic.message43', { rows: String(rows) });
  },
};
