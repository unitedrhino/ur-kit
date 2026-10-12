/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema, SimplifiedDataState } from './types';

import { getMappedKey, normalizeState, toNumberSafe, toStringSafe } from './helpers';

const TREE_COLUMNS = [
  { key: 'parent', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.level1NodeParent'); }, type: 'string' as const },
  { key: 'child', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.level2NodeChild'); }, type: 'string' as const },
  { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.valueValue'); }, type: 'number' as const },
];

export const treeAdapter: DataAdapter = {
  fromOption(option) {
    const dataset = Array.isArray(option?.dataset) ? option.dataset : [];
    const rows: Record<string, any>[] = [];

    dataset.forEach((parentNode: any) => {
      const parentName = toStringSafe(parentNode?.name);
      const children = Array.isArray(parentNode?.children) ? parentNode.children : [];
      if (children.length === 0) {
        rows.push({
          parent: parentName,
          child: '',
          value: toNumberSafe(parentNode?.value, 0),
        });
        return;
      }
      children.forEach((child: any) => {
        rows.push({
          parent: parentName,
          child: toStringSafe(child?.name),
          value: toNumberSafe(child?.value, 0),
        });
      });
    });

    return {
      columns: TREE_COLUMNS,
      rows,
    };
  },

  toOption(tableData) {
    const state = normalizeState(tableData);
    const rows = state.rows ?? [];
    const parentKey = getMappedKey(state.mappings, 'parent', 'parent');
    const childKey = getMappedKey(state.mappings, 'child', 'child');
    const valueKey = getMappedKey(state.mappings, 'value', 'value');
    const groupMap = new Map<string, Array<{ name: string; value: number }>>();

    rows.forEach((row) => {
      const parent = toStringSafe(row[parentKey]);
      const child = toStringSafe(row[childKey]);
      if (!parent) return;
      if (!groupMap.has(parent)) groupMap.set(parent, []);
      if (child) {
        groupMap.get(parent)?.push({ name: child, value: toNumberSafe(row[valueKey], 0) });
      }
    });

    const dataset = [...groupMap.entries()].map(([parent, children]) => ({
      name: parent,
      value: children.reduce((sum, item) => sum + toNumberSafe(item.value, 0), 0),
      children,
    }));

    return { dataset };
  },

  getMappingSchema(): MappingSchema {
    return {
      mode: 'flat',
      fields: [
        { key: 'parent', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.level1Root'); }, required: true, acceptTypes: ['string'] },
        { key: 'child', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.level2Leaf'); }, required: true, acceptTypes: ['string'] },
        { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blockAreaWeight'); }, acceptTypes: ['number'] },
      ],
    };
  },

  getSummaryText(state: SimplifiedDataState) {
    const rows = state.rows ?? [];
    const leafCount = rows.filter((row) => String(row.child ?? '').trim()).length;
    return editorT('bigscreenEditor.dynamic.message59', { leaves: String(leafCount) });
  },
};
