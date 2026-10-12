import type { CompositeChildBinding } from '@/packages/custom/types';
import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import { get, set } from 'lodash-es';

import { useChartDataFetch } from './useChartDataFetch.hook';

function normalizeTargetPath(path: string) {
  return path.replace(/^option\./, '').trim();
}

function normalizeRows(payload: any): Record<string, any>[] {
  if (Array.isArray(payload?.source)) {
    return payload.source.filter((item: any) => item && typeof item === 'object');
  }
  if (Array.isArray(payload)) {
    return payload.filter((item: any) => item && typeof item === 'object');
  }
  if (payload && typeof payload === 'object') {
    return [payload];
  }
  return [];
}

function normalizeColumns(payload: any, rows: Record<string, any>[]) {
  const dimensions = Array.isArray(payload?.dimensions) ? payload.dimensions : [];
  const keys = dimensions.length > 0 ? dimensions : Object.keys(rows[0] ?? {});

  return keys.map((key: string) => ({
    key,
    title: key,
    type: key === 'time' ? 'date' : typeof rows[0]?.[key] === 'number' ? 'number' : 'string',
  }));
}

function resolveSourceValue(payload: any, sourceField: string) {
  const normalizedField = sourceField.trim();
  if (!normalizedField) return undefined;

  const directValue = get(payload, normalizedField);
  if (directValue !== undefined) return directValue;

  const rows = normalizeRows(payload);
  const lastRow = rows.at(-1);
  if (!lastRow) return undefined;

  const rowValue = get(lastRow, normalizedField);
  if (rowValue !== undefined) return rowValue;

  return lastRow[normalizedField];
}

function applyBinding(groupData: CreateComponentGroupType, binding: CompositeChildBinding, payload: any) {
  const targetPath = normalizeTargetPath(binding.childProp);
  if (!binding.childId || !binding.sourceField || !targetPath) return;

  const child = groupData.groupList?.find((item) => item.id === binding.childId);
  if (!child?.option) return;

  const value = resolveSourceValue(payload, binding.sourceField);
  if (value === undefined) return;

  set(child.option, targetPath, value);
}

export const useCompositeGroupDataBinding = (
  groupData: CreateComponentGroupType,
  useChartEditStore: typeof import('@/store/modules/chartEditStore/chartEditStore').useChartEditStore,
) => {
  useChartDataFetch(groupData as unknown as CreateComponentType, useChartEditStore, (payload: any) => {
    const simplifiedData = groupData.option?._simplifiedData;
    const bindings = simplifiedData?.compositeAdapter?.childBindings;
    const isCompositeGroup = simplifiedData?.isComposite === true || simplifiedData?.editMode === 'composite';

    if (!isCompositeGroup || !bindings?.length) return;

    const rows = normalizeRows(payload);
    simplifiedData.rows = rows;
    simplifiedData.columns = normalizeColumns(payload, rows);

    bindings.forEach((binding) => applyBinding(groupData, binding, payload));
  });
};
