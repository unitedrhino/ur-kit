/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema, SimplifiedDataColumn, SimplifiedDataState } from './types';

import { getColumnTitleByKey, getMappedKey, getMappedKeys, normalizeState, toNumberSafe, toStringSafe } from './helpers';

const BASE_COLUMNS: SimplifiedDataColumn[] = [
  { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.radarVertexMetric'); }, type: 'string' },
  { key: 'max', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.maximumMax'); }, type: 'number' },
];

const createSeriesColumn = (index: number, name?: string): SimplifiedDataColumn => ({
  key: `data${index + 1}`,
  title: name || editorT('bigscreenEditor.dynamic.message54', { index: String(index + 1) }),
  type: 'number',
});

const buildRadarDataset = (radarIndicator: Record<string, any>[], seriesData: Record<string, any>[]) => ({
  dataset: {
    radarIndicator,
    seriesData,
  },
});

const getSeriesColumnsFromRows = (rows: Record<string, any>[], columns?: SimplifiedDataColumn[]) => {
  if (columns?.length) {
    return columns.filter((column) => column.key.startsWith('data'));
  }
  const firstRow = rows[0] ?? {};
  return Object.keys(firstRow)
    .filter((key) => key.startsWith('data'))
    .map((key, index) => ({ key, title: editorT('bigscreenEditor.dynamic.message54', { index: String(index + 1) }), type: 'number' as const }));
};

const toRadarFromLongTable = (rows: Record<string, any>[]) => {
  const firstRow = rows[0] ?? {};
  const nameKey = 'name' in firstRow ? 'name' : Object.keys(firstRow)[0] ?? 'name';
  const valueKey = 'value' in firstRow ? 'value' : Object.keys(firstRow).find((key) => key !== nameKey) ?? 'value';

  const radarIndicator = rows.map((row) => ({
    name: toStringSafe(row[nameKey], editorT('bigscreenEditor.ui.unnamedDimension')),
    max: Math.max(toNumberSafe(row[valueKey], 0), 1),
  }));

  const seriesData = [{
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.series1'); },
    value: rows.map((row) => toNumberSafe(row[valueKey], 0)),
  }];

  return buildRadarDataset(radarIndicator, seriesData);
};

const toRadarFromWideSingleRow = (rows: Record<string, any>[]) => {
  const row = rows[0] ?? {};
  const entries = Object.entries(row).filter(([key, value]) => key !== 'name' && typeof value === 'number');
  const radarIndicator = entries.map(([key, value]) => ({
    name: key,
    max: Math.max(toNumberSafe(value, 0), 1),
  }));
  const seriesData = [{
    name: toStringSafe(row.name, editorT('bigscreenEditor.ui.series1')),
    value: entries.map(([, value]) => toNumberSafe(value, 0)),
  }];

  return buildRadarDataset(radarIndicator, seriesData);
};

export const radarAdapter: DataAdapter = {
  fromOption(option) {
    const dataset = option?.dataset ?? {};
    const radarIndicator = Array.isArray(dataset.radarIndicator) ? dataset.radarIndicator : [];
    const seriesData = Array.isArray(dataset.seriesData) ? dataset.seriesData : [];
    const seriesColumns = seriesData.map((series: any, index: number) => createSeriesColumn(index, series?.name));
    const columns = [...BASE_COLUMNS, ...seriesColumns];

    const rows = radarIndicator.map((indicator: any, rowIndex: number) => {
      const row: Record<string, any> = {
        name: toStringSafe(indicator?.name),
        max: indicator?.max ?? '',
      };
      seriesData.forEach((series: any, seriesIndex: number) => {
        row[`data${seriesIndex + 1}`] = toNumberSafe(series?.value?.[rowIndex], 0);
      });
      return row;
    });

    return { columns, rows };
  },

  toOption(tableData) {
    const state = normalizeState(tableData);
    const rows = (state.rows ?? []).map((row) => ({ ...row }));
    const columns = state.columns ?? [];

    if (rows.length > 0) {
      const firstRow = rows[0] ?? {};
      const keys = Object.keys(firstRow);
      const looksLikeRadarState = keys.some((key) => key.startsWith('data'));
      const looksLikeLongTable = keys.length >= 2 && keys.includes('name') && keys.includes('value');
      const looksLikeWideSingleRow = rows.length === 1 && keys.length > 1 && keys.includes('name');

      if (!looksLikeRadarState && looksLikeLongTable) {
        return toRadarFromLongTable(rows);
      }

      if (!looksLikeRadarState && looksLikeWideSingleRow) {
        return toRadarFromWideSingleRow(rows);
      }
    }

    const mappings = state.mappings;
    const nameKey = getMappedKey(mappings, 'name', 'name');
    const maxKey = getMappedKey(mappings, 'max', 'max');

    const fallbackSeriesColumns = getSeriesColumnsFromRows(rows, columns);
    const fallbackSeriesKeys = fallbackSeriesColumns.map((column) => column.key);
    const mappedSeriesKeys = getMappedKeys(mappings, 'series', fallbackSeriesKeys);
    const seriesKeys = mappedSeriesKeys.length > 0 ? mappedSeriesKeys : fallbackSeriesKeys;

    const radarIndicator = rows.map((row) => {
      const seriesValues = seriesKeys.map((seriesKey) => toNumberSafe(row[seriesKey], 0));
      const actualMax = Math.max(...seriesValues, 1);
      const maxVal = row[maxKey];
      const indicator: Record<string, any> = { name: toStringSafe(row[nameKey], editorT('bigscreenEditor.ui.unnamedDimension')) };

      if (maxVal !== undefined && maxVal !== null && maxVal !== '') {
        indicator.max = toNumberSafe(maxVal, Math.ceil(actualMax * 1.2));
      }

      return indicator;
    });

    const seriesData = seriesKeys.map((seriesKey, index) => ({
      name: getColumnTitleByKey(state.columns, seriesKey, editorT('bigscreenEditor.dynamic.message54', { index: String(index + 1) })),
      value: rows.map((row) => toNumberSafe(row[seriesKey], 0)),
    }));

    return buildRadarDataset(radarIndicator, seriesData);
  },

  getMappingSchema(): MappingSchema {
    return {
      mode: 'flat',
      fields: [
        { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.radarVertexDimension'); }, required: true, acceptTypes: ['string'] },
        { key: 'max', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.maximumMetricValueMax'); }, acceptTypes: ['number'] },
        { key: 'series', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.dataSeries'); }, required: true, multiple: true, addable: true, acceptTypes: ['number'] },
      ],
    };
  },

  getSummaryText(state: SimplifiedDataState) {
    const rows = state.rows ?? [];
    const cols = state.columns ?? [];
    const seriesCount = cols.filter((column) => column.key.startsWith('data')).length;
    return editorT('bigscreenEditor.dynamic.message55', { vertices: String(rows.length), series: String(seriesCount) });
  },
};
