import type { CoreApi } from '@vben/api';

/**
 * 将菜单 ID 规范为字符串，避免 number/string 混用导致 Set 去重失效。
 */
export function normalizeMenuID(id: unknown): string | undefined {
  if (id === null || id === undefined || id === '') return undefined;
  return String(id);
}

/**
 * 从接口返回或勾选结果构建去重后的菜单 ID 集合。
 */
export function createMenuIDSet(ids: Iterable<unknown>): Set<string> {
  const set = new Set<string>();
  for (const id of ids) {
    const normalized = normalizeMenuID(id);
    if (normalized) set.add(normalized);
  }
  return set;
}

/**
 * 收集租户菜单节点及其子节点的 menuID（全部规范为字符串）。
 */
export function getTenantMenuNodeIDs(item: CoreApi.TenantMenu): string[] {
  const ids: string[] = [];
  const selfID = normalizeMenuID(item.menuID);
  if (selfID) ids.push(selfID);
  if (item.children?.length) {
    for (const child of item.children) {
      ids.push(...getTenantMenuNodeIDs(child as CoreApi.TenantMenu));
    }
  }
  return ids;
}

/**
 * 将菜单 ID 集合转为提交接口用的去重数组。
 */
export function menuIDSetToArray(set: Iterable<unknown>): string[] {
  return [...createMenuIDSet(set)];
}
