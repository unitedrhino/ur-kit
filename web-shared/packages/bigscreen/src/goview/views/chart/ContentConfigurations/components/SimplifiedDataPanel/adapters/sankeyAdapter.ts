/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema, SimplifiedDataColumn, SimplifiedDataState } from './types';

import { getGroupMappedKey, normalizeState, toNumberSafe, toStringSafe } from './helpers';

const NODE_COLUMNS: SimplifiedDataColumn[] = [{ key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgEnergy.ui.nodeName'); }, type: 'string' }];

const LINK_COLUMNS: SimplifiedDataColumn[] = [
  { key: 'source', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.sourceNode'); }, type: 'string' },
  { key: 'target', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.approve.targetNodeLabel'); }, type: 'string' },
  { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.weight'); }, type: 'number' },
];

export const sankeyAdapter: DataAdapter = {
  fromOption(option) {
    const dataset = option?.dataset ?? {};
    const series = option?.series ?? {};

    const nodesFallback = Array.isArray(series?.data) ? series.data : [];
    const nodes = Array.isArray(dataset?.label) ? dataset.label : nodesFallback;
    const linksFallback = Array.isArray(series?.links) ? series.links : [];
    const links = Array.isArray(dataset?.links) ? dataset.links : linksFallback;

    return {
      groups: [
        {
          key: 'nodes',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.nodeManagement'); },
          columns: NODE_COLUMNS,
          rows: nodes.map((node: Record<string, any>) => ({ name: toStringSafe(node?.name) })),
        },
        {
          key: 'links',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.flowRelationship'); },
          columns: LINK_COLUMNS,
          rows: links.map((link: Record<string, any>) => ({
            source: toStringSafe(link?.source),
            target: toStringSafe(link?.target),
            value: toNumberSafe(link?.value, 0),
          })),
        },
      ],
    };
  },

  toOption(tableData, currentOption) {
    const state = normalizeState(tableData);
    const groups = state.groups ?? [];
    const mappings = state.mappings;

    const nodeRows = groups.find((group) => group.key === 'nodes')?.rows ?? [];
    const linkRows = groups.find((group) => group.key === 'links')?.rows ?? [];

    const nodeNameKey = getGroupMappedKey(mappings, 'nodes', 'name', 'name');
    const sourceKey = getGroupMappedKey(mappings, 'links', 'source', 'source');
    const targetKey = getGroupMappedKey(mappings, 'links', 'target', 'target');
    const valueKey = getGroupMappedKey(mappings, 'links', 'value', 'value');

    const label = nodeRows.map((row) => ({ name: toStringSafe(row[nodeNameKey]) })).filter((item) => item.name);

    const links = linkRows
      .map((row) => ({
        source: toStringSafe(row[sourceKey]),
        target: toStringSafe(row[targetKey]),
        value: toNumberSafe(row[valueKey], 0),
      }))
      .filter((item) => item.source && item.target);

    const seriesLevels = Array.isArray((currentOption as any)?.series?.levels) ? (currentOption as any).series.levels : [];
    const fallbackLevels = Array.isArray((currentOption as any)?.dataset?.levels) ? (currentOption as any).dataset.levels : seriesLevels;

    return {
      dataset: {
        label,
        levels: fallbackLevels,
        links,
      },
    };
  },

  getMappingSchema(): MappingSchema {
    return {
      mode: 'grouped',
      groups: [
        {
          key: 'nodes',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.nodeMapping'); },
          fields: [{ key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgEnergy.ui.nodeName'); }, required: true, acceptTypes: ['string'] }],
        },
        {
          key: 'links',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.flowMapping'); },
          fields: [
            { key: 'source', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.sourceNodeSource'); }, required: true, acceptTypes: ['string'] },
            { key: 'target', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.targetNodeTarget'); }, required: true, acceptTypes: ['string'] },
            { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.flowValueValue'); }, required: true, acceptTypes: ['number'] },
          ],
        },
      ],
    };
  },

  getSummaryText(state: SimplifiedDataState) {
    const groups = state.groups ?? [];
    const nodeCount = groups.find((group) => group.key === 'nodes')?.rows.length ?? 0;
    const pathCount = groups.find((group) => group.key === 'links')?.rows.length ?? 0;
    return editorT('bigscreenEditor.dynamic.message56', { paths: String(pathCount), nodes: String(nodeCount) });
  },
};
