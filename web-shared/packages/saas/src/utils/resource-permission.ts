import type { CoreApi } from '@vben/api';

/**
 * 构建完整 resource:action 权限码，如 sale/config/info:view。
 * resource 段包含 group 路径，与 API 注册表及按钮授权口径一致。
 */
export function buildResourceActionKey(
  group: Pick<CoreApi.ApiGroupInfo, 'code'>,
  resource: Pick<CoreApi.ApiResourceInfo, 'code'>,
  action: Pick<CoreApi.ApiActionInfo, 'code'>,
): string {
  return `${group.code}/${resource.code}:${action.code}`;
}

/**
 * 从权限码解析 resource 与 action，action 取最后一个冒号之后的内容。
 */
export function parseResourceActionKey(key: string): { action: string; resource: string } | null {
  const idx = key.lastIndexOf(':');
  if (idx <= 0) return null;
  const resource = key.slice(0, idx);
  const action = key.slice(idx + 1);
  if (!resource || !action) return null;
  return { resource, action };
}

/** 旧版短 key（仅 resource.code:action.code），用于兼容历史角色权限数据。 */
export function buildLegacyResourceActionKey(
  resource: Pick<CoreApi.ApiResourceInfo, 'code'>,
  action: Pick<CoreApi.ApiActionInfo, 'code'>,
): string {
  return `${resource.code}:${action.code}`;
}

/** 从资源树汇总当前可授权的全部完整权限码。 */
export function collectResourceActionKeysFromGroups(groups: CoreApi.ApiGroupInfo[]): Set<string> {
  const keys = new Set<string>();
  for (const group of groups) {
    for (const resource of group.children ?? []) {
      for (const action of resource.children ?? []) {
        keys.add(buildResourceActionKey(group, resource, action));
      }
    }
  }
  return keys;
}

/** 旧版短 key 到完整 key 的映射（同一短 key 可能对应多个分组）。 */
export function buildLegacyResourceActionKeyIndex(
  groups: CoreApi.ApiGroupInfo[],
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const group of groups) {
    for (const resource of group.children ?? []) {
      for (const action of resource.children ?? []) {
        const fullKey = buildResourceActionKey(group, resource, action);
        const legacyKey = buildLegacyResourceActionKey(resource, action);
        const list = index.get(legacyKey) ?? [];
        list.push(fullKey);
        index.set(legacyKey, list);
      }
    }
  }
  return index;
}

/**
 * 将角色已有权限还原为 checkedSet。
 * 优先匹配完整 resource 路径；旧数据若仅存短 resource，则展开到所有同名节点。
 */
export function hydrateResourceActionCheckedSet(
  groups: CoreApi.ApiGroupInfo[],
  items: Array<Pick<CoreApi.RoleResourceActionItem, 'action' | 'resource'>>,
): Set<string> {
  const validKeys = collectResourceActionKeysFromGroups(groups);
  const legacyIndex = buildLegacyResourceActionKeyIndex(groups);
  const next = new Set<string>();

  for (const item of items) {
    if (!item.resource || !item.action) continue;
    const storedKey = `${item.resource}:${item.action}`;
    if (validKeys.has(storedKey)) {
      next.add(storedKey);
      continue;
    }
    if (!item.resource.includes('/')) {
      const matched = legacyIndex.get(storedKey);
      if (matched) {
        for (const key of matched) next.add(key);
      }
    }
  }
  return next;
}

/** 将 checkedSet 转为角色资源权限保存接口所需列表。 */
export function toRoleResourceActionItems(
  checkedSet: Iterable<string>,
): CoreApi.RoleResourceActionItem[] {
  const list: CoreApi.RoleResourceActionItem[] = [];
  for (const key of checkedSet) {
    const parsed = parseResourceActionKey(key);
    if (parsed) {
      list.push({ resource: parsed.resource, action: parsed.action });
    }
  }
  return list;
}
