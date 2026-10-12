/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { SimplifiedDataColumn, SimplifiedDataGroup, SimplifiedDataState } from './types';

export const cloneRows = (rows: Record<string, any>[]) => rows.map((item) => ({ ...item }));

export const toNumberSafe = (value: any, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const toStringSafe = (value: any, fallback = '') => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

export const normalizeState = (tableData: Record<string, any>[] | SimplifiedDataState): SimplifiedDataState => {
  if (Array.isArray(tableData)) {
    return { rows: cloneRows(tableData) };
  }
  return {
    columns: tableData?.columns ? [...tableData.columns] : [],
    rows: tableData?.rows ? cloneRows(tableData.rows) : [],
    groups: tableData?.groups
      ? tableData.groups.map((group) => ({
          key: group.key,
          title: group.title,
          columns: [...group.columns],
          rows: cloneRows(group.rows),
        }))
      : [],
  };
};

export const inferColumnsFromRows = (rows: Record<string, any>[], preferColumns?: SimplifiedDataColumn[]): SimplifiedDataColumn[] => {
  if (preferColumns?.length) return [...preferColumns];
  const firstRow = rows[0] ?? {};
  return Object.keys(firstRow).map((key, index) => ({
    key,
    title: key,
    type: index === 0 ? 'string' : 'number',
  }));
};

export const createRowByColumns = (columns: SimplifiedDataColumn[]) => {
  const row: Record<string, any> = {};
  columns.forEach((column) => {
    row[column.key] = column.type === 'number' ? 0 : '';
  });
  return row;
};

export const normalizeToGroups = (state: SimplifiedDataState): SimplifiedDataGroup[] => {
  if (Array.isArray(state?.groups) && state.groups.length > 0) {
    return state.groups.map((group) => ({
      key: group.key,
      title: group.title,
      columns: [...group.columns],
      rows: cloneRows(group.rows),
    }));
  }

  return [
    {
      key: 'default',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgMall.devices.excelSheet'); },
      columns: state?.columns ? [...state.columns] : [],
      rows: cloneRows(state?.rows || []),
    },
  ];
};

export const isMultiGroup = (groups: SimplifiedDataGroup[]) => {
  return groups.length > 1 || (groups.length === 1 && groups[0]?.key !== 'default');
};

export const getMappedKey = (mappings: Record<string, string | string[]> | undefined, mappingKey: string, fallback: string) => {
  const candidate = mappings?.[mappingKey];
  if (typeof candidate === 'string' && candidate.trim()) return candidate;
  return fallback;
};

export const getMappedKeys = (mappings: Record<string, string | string[]> | undefined, mappingKey: string, fallback: string[]) => {
  const candidate = mappings?.[mappingKey];
  if (!Array.isArray(candidate)) return fallback;
  const cleaned = candidate.map((item) => String(item || '').trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
};

export const getGroupMappedKey = (mappings: Record<string, string | string[]> | undefined, groupKey: string, fieldKey: string, fallback: string) => {
  return getMappedKey(mappings, `${groupKey}.${fieldKey}`, fallback);
};

export const getColumnTitleByKey = (columns: SimplifiedDataColumn[] | undefined, key: string, fallback: string) => {
  const column = columns?.find((item) => item.key === key);
  return column?.title || fallback;
};
