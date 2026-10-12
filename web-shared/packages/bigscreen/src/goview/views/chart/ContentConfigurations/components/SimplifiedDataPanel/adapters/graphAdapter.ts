/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema, SimplifiedDataColumn, SimplifiedDataState } from './types';

import { getGroupMappedKey, normalizeState, toNumberSafe, toStringSafe } from './helpers';

const NODE_COLUMNS: SimplifiedDataColumn[] = [
  { key: 'id', title: 'ID', type: 'string' },
  { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.agent.name'); }, type: 'string' },
  { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.weight'); }, type: 'number' },
  { key: 'symbolSize', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.nodeSize'); }, type: 'number' },
  { key: 'category', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.categoryIndex'); }, type: 'number' },
  { key: 'x', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.xCoordinate'); }, type: 'number' },
  { key: 'y', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.yCoordinate'); }, type: 'number' },
];

const LINK_COLUMNS: SimplifiedDataColumn[] = [
  { key: 'source', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.sourceNode'); }, type: 'string' },
  { key: 'target', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.approve.targetNodeLabel'); }, type: 'string' },
  { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.weight'); }, type: 'number' },
];

const CATEGORY_COLUMNS: SimplifiedDataColumn[] = [{ key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.categoryName'); }, type: 'string' }];

export const graphAdapter: DataAdapter = {
  fromOption(option) {
    const dataset = option?.dataset ?? {};
    const series = Array.isArray(option?.series) ? option.series[0] : option?.series;

    const nodesFallback = Array.isArray(series?.data) ? series.data : [];
    const nodes = Array.isArray(dataset?.nodes) ? dataset.nodes : nodesFallback;
    const linksFallback = Array.isArray(series?.links) ? series.links : [];
    const links = Array.isArray(dataset?.links) ? dataset.links : linksFallback;
    const categoriesFallback = Array.isArray(series?.categories) ? series.categories : [];
    const categories = Array.isArray(dataset?.categories) ? dataset.categories : categoriesFallback;

    return {
      groups: [
        {
          key: 'nodes',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.nodeManagement'); },
          columns: NODE_COLUMNS,
          rows: nodes.map((node: Record<string, any>, index: number) => ({
            id: toStringSafe(node?.id, toStringSafe(node?.name, String(index + 1))),
            name: toStringSafe(node?.name),
            value: toNumberSafe(node?.value, 0),
            symbolSize: toNumberSafe(node?.symbolSize, 10),
            category: toNumberSafe(node?.category, 0),
            x: toNumberSafe(node?.x, 0),
            y: toNumberSafe(node?.y, 0),
          })),
        },
        {
          key: 'links',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.relationshipEdge'); },
          columns: LINK_COLUMNS,
          rows: links.map((link: Record<string, any>) => ({
            source: toStringSafe(link?.source),
            target: toStringSafe(link?.target),
            value: link?.value === undefined || link?.value === null || link?.value === '' ? '' : toNumberSafe(link?.value, 0),
          })),
        },
        {
          key: 'categories',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.flow.categoryLabel'); },
          columns: CATEGORY_COLUMNS,
          rows: categories.map((item: Record<string, any>) => ({
            name: toStringSafe(item?.name),
          })),
        },
      ],
    };
  },

  toOption(tableData, currentOption) {
    const state = normalizeState(tableData);
    const groups = state.groups ?? [];
    const mappings = state.mappings;

    const nodesGroup = groups.find((group) => group.key === 'nodes');
    const linksGroup = groups.find((group) => group.key === 'links');
    const categoriesGroup = groups.find((group) => group.key === 'categories');

    const nodeIdKey = getGroupMappedKey(mappings, 'nodes', 'id', 'id');
    const nodeNameKey = getGroupMappedKey(mappings, 'nodes', 'name', 'name');
    const nodeValueKey = getGroupMappedKey(mappings, 'nodes', 'value', 'value');
    const nodeSizeKey = getGroupMappedKey(mappings, 'nodes', 'symbolSize', 'symbolSize');
    const nodeCategoryKey = getGroupMappedKey(mappings, 'nodes', 'category', 'category');
    const nodeXKey = getGroupMappedKey(mappings, 'nodes', 'x', 'x');
    const nodeYKey = getGroupMappedKey(mappings, 'nodes', 'y', 'y');

    const linkSourceKey = getGroupMappedKey(mappings, 'links', 'source', 'source');
    const linkTargetKey = getGroupMappedKey(mappings, 'links', 'target', 'target');
    const linkValueKey = getGroupMappedKey(mappings, 'links', 'value', 'value');

    const nodes = (nodesGroup?.rows ?? []).map((row, index) => ({
      id: toStringSafe(row[nodeIdKey], toStringSafe(row[nodeNameKey], String(index + 1))),
      name: toStringSafe(row[nodeNameKey], editorT('bigscreenEditor.dynamic.message41', { index: String(index + 1) })),
      value: toNumberSafe(row[nodeValueKey], 0),
      symbolSize: toNumberSafe(row[nodeSizeKey], 10),
      category: toNumberSafe(row[nodeCategoryKey], 0),
      x: toNumberSafe(row[nodeXKey], 0),
      y: toNumberSafe(row[nodeYKey], 0),
    }));

    const links = (linksGroup?.rows ?? [])
      .map((row) => ({
        source: toStringSafe(row[linkSourceKey]),
        target: toStringSafe(row[linkTargetKey]),
        value: row[linkValueKey] === undefined || row[linkValueKey] === null || row[linkValueKey] === '' ? undefined : toNumberSafe(row[linkValueKey], 0),
      }))
      .filter((row) => row.source && row.target);

    const categories = (categoriesGroup?.rows ?? []).map((row) => ({ name: toStringSafe(row.name) })).filter((row) => row.name);

    const fallbackCategories = Array.isArray((currentOption as any)?.dataset?.categories) ? (currentOption as any).dataset.categories : [];

    return {
      dataset: {
        nodes,
        links,
        categories: categories.length > 0 ? categories : fallbackCategories,
      },
    };
  },

  getMappingSchema(): MappingSchema {
    return {
      mode: 'grouped',
      groups: [
        {
          key: 'nodes',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.nodeEntityMapping'); },
          fields: [
            { key: 'id', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.uniqueNodeID'); }, required: true, acceptTypes: ['string'] },
            { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.nodeDisplayName'); }, required: true, acceptTypes: ['string'] },
            { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.nodeWeight'); }, acceptTypes: ['number'] },
            { key: 'symbolSize', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.nodeSize'); }, acceptTypes: ['number'] },
            { key: 'category', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.nodeCategory'); }, acceptTypes: ['number'] },
          ],
        },
        {
          key: 'links',
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.relationshipEdgeMapping'); },
          fields: [
            { key: 'source', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.relationshipSource'); }, required: true, acceptTypes: ['string'] },
            { key: 'target', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.relationshipTarget'); }, required: true, acceptTypes: ['string'] },
            { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.edgeWeight'); }, acceptTypes: ['number'] },
          ],
        },
      ],
    };
  },

  getSummaryText(state: SimplifiedDataState) {
    const groups = state.groups ?? [];
    const nodeCount = groups.find((group) => group.key === 'nodes')?.rows.length ?? 0;
    const linkCount = groups.find((group) => group.key === 'links')?.rows.length ?? 0;
    return editorT('bigscreenEditor.dynamic.message42', { nodes: String(nodeCount), edges: String(linkCount) });
  },
};
