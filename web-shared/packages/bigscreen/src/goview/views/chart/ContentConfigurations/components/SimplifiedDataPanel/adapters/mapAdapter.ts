/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema, SimplifiedDataColumn, SimplifiedDataState } from './types';

import { getGroupMappedKey, normalizeState, toNumberSafe, toStringSafe } from './helpers';

const MAP_COLUMNS: SimplifiedDataColumn[] = [
  { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('iotApp.deviceDetail.areaName'); }, type: 'string' },
  { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.value'); }, type: 'number' },
];

const POINT_COLUMNS: SimplifiedDataColumn[] = [
  { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.pointName'); }, type: 'string' },
  { key: 'lng', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('iotApp.deviceDetail.longitude'); }, type: 'number' },
  { key: 'lat', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('iotApp.deviceDetail.latitude'); }, type: 'number' },
  { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.value'); }, type: 'number' },
];

const LINE_COLUMNS: SimplifiedDataColumn[] = [
  { key: 'fromLng', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.sourceLongitude'); }, type: 'number' },
  { key: 'fromLat', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.sourceLatitude'); }, type: 'number' },
  { key: 'toLng', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.targetLongitude'); }, type: 'number' },
  { key: 'toLat', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.targetLatitude'); }, type: 'number' },
];

const PIECE_COLUMNS: SimplifiedDataColumn[] = [
  { key: 'gte', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.minimumGte'); }, type: 'number' },
  { key: 'lte', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.maximumLte'); }, type: 'number' },
  { key: 'label', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('iotApp.productPage.tags'); }, type: 'string' },
];

export const mapAdapter: DataAdapter = {
  fromOption(option) {
    const dataset = option?.dataset ?? {};

    const mapRows = Array.isArray(dataset?.map)
      ? dataset.map.map((item: Record<string, any>) => ({
          name: toStringSafe(item?.name),
          value: toNumberSafe(item?.value, 0),
        }))
      : [];

    const pointRows = Array.isArray(dataset?.point)
      ? dataset.point.map((item: Record<string, any>) => {
          const value = Array.isArray(item?.value) ? item.value : [];
          return {
            lat: toNumberSafe(value[1], 0),
            lng: toNumberSafe(value[0], 0),
            name: toStringSafe(item?.name),
            value: toNumberSafe(value[2], 0),
          };
        })
      : [];

    const lineRows = Array.isArray(dataset?.line)
      ? dataset.line.map((item: Record<string, any>) => {
          const from = Array.isArray(item?.coords) ? item.coords[0] : [];
          const to = Array.isArray(item?.coords) ? item.coords[1] : [];
          return {
            fromLat: toNumberSafe(from?.[1], 0),
            fromLng: toNumberSafe(from?.[0], 0),
            toLat: toNumberSafe(to?.[1], 0),
            toLng: toNumberSafe(to?.[0], 0),
          };
        })
      : [];

    const pieceRows = Array.isArray(dataset?.pieces)
      ? dataset.pieces.map((item: Record<string, any>) => ({
          gte: item?.gte ?? '',
          label: toStringSafe(item?.label),
          lte: item?.lte ?? '',
        }))
      : [];

    return {
      groups: [
        {
          key: 'map',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.areaData'); },
          columns: MAP_COLUMNS,
          rows: mapRows,
        },
        {
          key: 'point',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.scatterData'); },
          columns: POINT_COLUMNS,
          rows: pointRows,
        },
        {
          key: 'line',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.routeData'); },
          columns: LINE_COLUMNS,
          rows: lineRows,
        },
        {
          key: 'pieces',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.segmentThresholds'); },
          columns: PIECE_COLUMNS,
          rows: pieceRows,
        },
      ],
    };
  },

  toOption(tableData) {
    const state = normalizeState(tableData);
    const groups = state.groups ?? [];
    const mappings = state.mappings;

    const mapRows = groups.find((group) => group.key === 'map')?.rows ?? [];
    const pointRows = groups.find((group) => group.key === 'point')?.rows ?? [];
    const lineRows = groups.find((group) => group.key === 'line')?.rows ?? [];
    const pieceRows = groups.find((group) => group.key === 'pieces')?.rows ?? [];

    const mapNameKey = getGroupMappedKey(mappings, 'map', 'name', 'name');
    const mapValueKey = getGroupMappedKey(mappings, 'map', 'value', 'value');

    const pointNameKey = getGroupMappedKey(mappings, 'point', 'name', 'name');
    const pointLngKey = getGroupMappedKey(mappings, 'point', 'lng', 'lng');
    const pointLatKey = getGroupMappedKey(mappings, 'point', 'lat', 'lat');
    const pointValueKey = getGroupMappedKey(mappings, 'point', 'value', 'value');

    const lineFromLngKey = getGroupMappedKey(mappings, 'line', 'fromLng', 'fromLng');
    const lineFromLatKey = getGroupMappedKey(mappings, 'line', 'fromLat', 'fromLat');
    const lineToLngKey = getGroupMappedKey(mappings, 'line', 'toLng', 'toLng');
    const lineToLatKey = getGroupMappedKey(mappings, 'line', 'toLat', 'toLat');

    const map = mapRows
      .map((row) => ({
        name: toStringSafe(row[mapNameKey]),
        value: toNumberSafe(row[mapValueKey], 0),
      }))
      .filter((row) => row.name);

    const point = pointRows
      .map((row) => ({
        name: toStringSafe(row[pointNameKey]),
        value: [toNumberSafe(row[pointLngKey], 0), toNumberSafe(row[pointLatKey], 0), toNumberSafe(row[pointValueKey], 0)],
      }))
      .filter((row) => row.name);

    const line = lineRows
      .map((row) => ({
        coords: [
          [toNumberSafe(row[lineFromLngKey], 0), toNumberSafe(row[lineFromLatKey], 0)],
          [toNumberSafe(row[lineToLngKey], 0), toNumberSafe(row[lineToLatKey], 0)],
        ],
      }))
      .filter((row) => Array.isArray(row.coords) && row.coords.length === 2);

    const pieces = pieceRows
      .map((row) => {
        const piece: Record<string, any> = { label: toStringSafe(row.label) };
        if (row.gte !== '' && row.gte !== undefined && row.gte !== null) piece.gte = toNumberSafe(row.gte, 0);
        if (row.lte !== '' && row.lte !== undefined && row.lte !== null) piece.lte = toNumberSafe(row.lte, 0);
        return piece;
      })
      .filter((row) => row.label || row.gte !== undefined || row.lte !== undefined);

    return {
      dataset: {
        line,
        map,
        pieces,
        point,
      },
    };
  },

  getMappingSchema(): MappingSchema {
    return {
      mode: 'grouped',
      groups: [
        {
          key: 'map',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.areaHeatmap'); },
          fields: [
            { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.matchAreaName'); }, required: true, acceptTypes: ['string'] },
            { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.heatmapValue'); }, required: true, acceptTypes: ['number'] },
          ],
        },
        {
          key: 'point',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.scatterBubbles'); },
          fields: [
            { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.pointName'); }, acceptTypes: ['string'] },
            { key: 'lng', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.deviceDetail.longitude'); }, required: true, acceptTypes: ['number'] },
            { key: 'lat', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.deviceDetail.latitude'); }, required: true, acceptTypes: ['number'] },
            { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.bubbleValue'); }, acceptTypes: ['number'] },
          ],
        },
        {
          key: 'line',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.routesPaths'); },
          fields: [
            { key: 'fromLng', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.sourceLongitude'); }, required: true, acceptTypes: ['number'] },
            { key: 'fromLat', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.sourceLatitude'); }, required: true, acceptTypes: ['number'] },
            { key: 'toLng', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.targetLongitude'); }, required: true, acceptTypes: ['number'] },
            { key: 'toLat', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.targetLatitude'); }, required: true, acceptTypes: ['number'] },
          ],
        },
      ],
    };
  },

  getSummaryText(state: SimplifiedDataState) {
    const groups = state.groups ?? [];
    const mapCount = groups.find((group) => group.key === 'map')?.rows.length ?? 0;
    const pointCount = groups.find((group) => group.key === 'point')?.rows.length ?? 0;
    const lineCount = groups.find((group) => group.key === 'line')?.rows.length ?? 0;
    return editorT('bigscreenEditor.dynamic.message53', { areas: String(mapCount), points: String(pointCount), routes: String(lineCount) });
  },
};
