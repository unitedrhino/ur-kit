/** 区域树扁平化：保留可见祖先顺序，并对孤儿节点及异常环安全降级。 */
import type { AreaEntity } from '../domain/entities/area.entity';

/** AreaTreeRow 是展示用的区域、层级及是否可展开信息。 */
export interface AreaTreeRow { area: AreaEntity; depth: number; hasChildren: boolean; }

/** flattenAreaTree 返回展开节点的可见行；隐藏系统根与未分类，不丢失孤儿或环中的实际区域。 */
export function flattenAreaTree(areas: AreaEntity[], collapsed: readonly string[] = []): AreaTreeRow[] {
  const unique = new Map<string, AreaEntity>();
  for (const area of areas) if (area.areaID && area.areaID !== '1' && area.areaID !== '2' && !unique.has(area.areaID)) unique.set(area.areaID, area);
  const children = new Map<string, AreaEntity[]>();
  const roots: AreaEntity[] = [];
  for (const area of unique.values()) {
    if (area.parentAreaID === area.areaID || !unique.has(area.parentAreaID)) roots.push(area);
    else children.set(area.parentAreaID, [...(children.get(area.parentAreaID) || []), area]);
  }
  const hidden = new Set(collapsed); const visited = new Set<string>(); const rows: AreaTreeRow[] = [];
  const visit = (area: AreaEntity, depth: number, visible: boolean): void => {
    if (visited.has(area.areaID)) return;
    visited.add(area.areaID);
    const descendants = children.get(area.areaID) || [];
    if (visible) rows.push({ area, depth, hasChildren: descendants.some(child => !visited.has(child.areaID)) });
    for (const child of descendants) visit(child, depth + 1, visible && !hidden.has(area.areaID));
  };
  for (const root of roots) visit(root, 0, true);
  for (const area of unique.values()) if (!visited.has(area.areaID)) visit(area, 0, true);
  return rows;
}

/** getAreaPath 获取当前区域及可见祖先；异常环和缺失父级不会导致循环。 */
export function getAreaPath(areas: AreaEntity[], selectedId: string): AreaEntity[] {
  const byId = new Map(areas.map(area => [area.areaID, area]));
  const path: AreaEntity[] = []; const visited = new Set<string>(); let id = selectedId;
  while (id && id !== '1' && id !== '2' && !visited.has(id)) {
    const area = byId.get(id); if (!area) break;
    visited.add(id); path.unshift(area); id = area.parentAreaID;
  }
  return path;
}

/** getAreaSubtree 获取当前区域及其全部下级，保持原始排序并跳过循环。 */
export function getAreaSubtree(areas: AreaEntity[], selectedId: string): AreaEntity[] {
  if (!selectedId || !areas.some(area => area.areaID === selectedId)) return [];
  const children = new Map<string, AreaEntity[]>();
  for (const area of areas) children.set(area.parentAreaID, [...(children.get(area.parentAreaID) || []), area]);
  const included = new Set<string>([selectedId]); const pending = [selectedId];
  while (pending.length) {
    for (const child of children.get(pending.pop()!) || []) if (!included.has(child.areaID) && child.areaID !== '1' && child.areaID !== '2') { included.add(child.areaID); pending.push(child.areaID); }
  }
  return areas.filter(area => included.has(area.areaID));
}
