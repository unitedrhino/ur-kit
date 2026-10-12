export type AreaTreeNode = {
  areaID: string | number;
  parentAreaID?: null | string | number;
  sort?: number;
  children?: AreaTreeNode[];
  [key: string]: any;
};

export function buildAreaTree<T extends AreaTreeNode>(list: T[]): T[] {
  const nodeMap = new Map<string, T>();
  const roots: T[] = [];

  const cloneList = list.map((item) => ({
    ...item,
    children: [],
  })) as T[];

  for (const item of cloneList) {
    nodeMap.set(String(item.areaID), item);
  }

  for (const item of cloneList) {
    const parentID = item.parentAreaID;
    if (parentID == null || parentID === '' || !nodeMap.has(String(parentID))) {
      roots.push(item);
      continue;
    }
    nodeMap.get(String(parentID))!.children!.push(item);
  }

  const sortNodes = (nodes: T[]) => {
    nodes.sort((a, b) => {
      const sortA = Number(a.sort ?? 0);
      const sortB = Number(b.sort ?? 0);
      if (sortA !== sortB) return sortA - sortB;
      return String(a.areaID).localeCompare(String(b.areaID), 'zh-CN');
    });
    for (const node of nodes) {
      if (node.children?.length) {
        sortNodes(node.children as T[]);
      }
    }
  };

  sortNodes(roots);
  return roots;
}
