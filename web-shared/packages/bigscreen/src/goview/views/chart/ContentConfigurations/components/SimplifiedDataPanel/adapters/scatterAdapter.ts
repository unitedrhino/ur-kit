/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema, SimplifiedDataState } from './types';

import { getMappedKey, normalizeState, toNumberSafe, toStringSafe } from './helpers';

const SCATTER_COLUMNS = [
  { key: 'x', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.xValueXAxis'); }, type: 'number' as const },
  { key: 'y', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.yValueYAxis'); }, type: 'number' as const },
  { key: 'size', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.bubbleSizeSize'); }, type: 'number' as const },
  { key: 'color', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.categoryColor2'); }, type: 'string' as const },
  { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.labelNameName'); }, type: 'string' as const },
];

const normalizeScatterRows = (rows: Record<string, any>[], mapping: { colorKey: string; nameKey: string; sizeKey: string; xKey: string; yKey: string }) => {
  return rows
    .map((row) => ({
      x: toNumberSafe(row[mapping.xKey]),
      y: toNumberSafe(row[mapping.yKey]),
      size: toNumberSafe(row[mapping.sizeKey], 0),
      color: toStringSafe(row[mapping.colorKey], editorT('bigscreenEditor.ui.defaultGroup')),
      name: toStringSafe(row[mapping.nameKey]),
    }))
    .filter((row) => Number.isFinite(row.x) && Number.isFinite(row.y));
};

const fromRegressionDataset = (dataset: any[]) => {
  const source = Array.isArray(dataset?.[0]?.source) ? dataset[0].source : [];
  const rows = source.map((item: any[]) => {
    if (!Array.isArray(item)) return { x: 0, y: 0, size: 0, /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get color() { return editorT('bigscreenEditor.ui.defaultGroup'); }, name: '' };
    return {
      x: toNumberSafe(item[0]),
      y: toNumberSafe(item[1]),
      size: toNumberSafe(item[2]),
      name: toStringSafe(item[3]),
      color: item[4] === undefined || item[4] === null || item[4] === '' ? editorT('bigscreenEditor.ui.defaultGroup') : String(item[4]),
    };
  });
  return {
    columns: SCATTER_COLUMNS,
    rows,
  };
};

const fromCommonDataset = (dataset: any[]) => {
  const rows: Record<string, any>[] = [];
  dataset.forEach((entry: any, index: number) => {
    const source = Array.isArray(entry?.source) ? entry.source : [];
    const dimensionName = Array.isArray(entry?.dimensions) ? String(entry.dimensions[0] ?? editorT('bigscreenEditor.dynamic.message57', { index: String(index + 1) })) : editorT('bigscreenEditor.dynamic.message57', { index: String(index + 1) });
    source.forEach((item: any) => {
      if (!Array.isArray(item)) return;
      rows.push({
        x: toNumberSafe(item[0]),
        y: toNumberSafe(item[1]),
        size: 0,
        color: dimensionName,
        name: '',
      });
    });
  });
  return {
    columns: SCATTER_COLUMNS,
    rows,
  };
};

const toRegressionDataset = (rows: Record<string, any>[]) => {
  const cleanedRows = normalizeScatterRows(rows, {
    colorKey: 'color',
    nameKey: 'name',
    sizeKey: 'size',
    xKey: 'x',
    yKey: 'y',
  });
  const categories = [...new Set(cleanedRows.map((item) => item.color))];
  const first = categories[0] ?? editorT('bigscreenEditor.ui.defaultGroup');
  const second = categories[1] ?? first;

  return [
    {
      source: cleanedRows.map((item) => [item.x, item.y, item.size, item.name, item.color]),
    },
    {
      transform: {
        type: 'filter',
        config: { dimension: 4, eq: first },
      },
    },
    {
      transform: {
        type: 'filter',
        config: { dimension: 4, eq: second },
      },
    },
    {
      transform: {
        type: 'ecStat:regression',
        config: { method: 'logarithmic' },
      },
    },
  ];
};

const toCommonDataset = (rows: Record<string, any>[]) => {
  const cleanedRows = normalizeScatterRows(rows, {
    colorKey: 'color',
    nameKey: 'name',
    sizeKey: 'size',
    xKey: 'x',
    yKey: 'y',
  });
  const groupMap = new Map<string, [number, number][]>();
  cleanedRows.forEach((item) => {
    if (!groupMap.has(item.color)) {
      groupMap.set(item.color, []);
    }
    groupMap.get(item.color)?.push([item.x, item.y]);
  });

  return [...groupMap.entries()].map(([groupName, source]) => ({
    dimensions: [groupName],
    source,
  }));
};

export const scatterAdapter: DataAdapter = {
  fromOption(option) {
    const dataset = option?.dataset;
    if (!Array.isArray(dataset)) {
      return { columns: SCATTER_COLUMNS, rows: [] };
    }
    const hasRegression = dataset.some((item) => item?.transform?.type === 'ecStat:regression');
    return hasRegression ? fromRegressionDataset(dataset) : fromCommonDataset(dataset);
  },

  toOption(tableData, currentOption) {
    const state = normalizeState(tableData);
    const rows = state.rows ?? [];
    const mappings = state.mappings;

    const xKey = getMappedKey(mappings, 'x', 'x');
    const yKey = getMappedKey(mappings, 'y', 'y');
    const sizeKey = getMappedKey(mappings, 'size', 'size');
    const colorKey = getMappedKey(mappings, 'color', 'color');
    const nameKey = getMappedKey(mappings, 'name', 'name');

    const normalizedRows = normalizeScatterRows(rows, {
      colorKey,
      nameKey,
      sizeKey,
      xKey,
      yKey,
    });

    const isRegression = Array.isArray(currentOption?.dataset) && currentOption.dataset.some((item: any) => item?.transform?.type === 'ecStat:regression');
    return {
      dataset: isRegression ? toRegressionDataset(normalizedRows) : toCommonDataset(normalizedRows),
    };
  },

  getMappingSchema(): MappingSchema {
    return {
      mode: 'flat',
      fields: [
        { key: 'x', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.xAxisHorizontalCoordinate'); }, required: true, acceptTypes: ['number'] },
        { key: 'y', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.yAxisVerticalCoordinate'); }, required: true, acceptTypes: ['number'] },
        { key: 'size', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.bubbleSizeSize2'); }, acceptTypes: ['number'] },
        { key: 'color', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.categoryColor'); }, acceptTypes: ['string'] },
        { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.textLabelLabel'); }, acceptTypes: ['string'] },
      ],
    };
  },

  getSummaryText(state: SimplifiedDataState) {
    const rows = state.rows?.length ?? 0;
    const cols = state.columns?.length ?? SCATTER_COLUMNS.length;
    return editorT('bigscreenEditor.dynamic.message58', { rows: String(rows), dimensions: String(cols) });
  },
};
