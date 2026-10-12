export type TreeOption = {
  value: string;
  label: string;
  parentID?: string;
  children?: TreeOption[];
};

export const convertListToTree = (list: TreeOption[]) => {
  const map = new Map<string, TreeOption>();

  list.forEach((item) => {
    if (item.value) {
      map.set(item.value, {
        value: item.value,
        label: item.label,
        children: [],
      });
    }
  });

  const result: TreeOption[] = [];

  list.forEach((item) => {
    if (item.value) {
      const node = map.get(item.value);
      if (!node) return;
      if (item.parentID && map.has(item.parentID)) {
        const parent = map.get(item.parentID)!;
        parent.children!.push(node);
      } else {
        result.push(node);
      }
    }
  });

  return result;
};

export const flaternTreeToList = (list: TreeOption[]) => {
  const result: TreeOption[] = [];

  const traverse = (node: TreeOption) => {
    result.push(node);
    if (node.children) {
      node.children.forEach(traverse);
    }
  };

  list.forEach(traverse);

  return result;
};
