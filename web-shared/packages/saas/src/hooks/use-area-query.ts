import type { TreeOption } from 'naive-ui';

// import { useQuery } from '@tanstack/vue-query';

import { ThingsApi } from '@vben/api';

// import { postSystemAreaInfoIndex } from '#/api/v1/api';

export type TreeOptionWithKeyAndParentID = TreeOption & {
  key: string;
  parentID: string;
};

// 转换分组详情为树结构的通用函数
export const convertGroupDetailToTree = (list: TreeOptionWithKeyAndParentID[]): TreeOptionWithKeyAndParentID[] => {
  const map = new Map<string, any>();

  // 首先构建所有节点的映射
  list.forEach((item) => {
    if (item.key) {
      map.set(item.key, {
        value: item.value,
        label: item.label,
        children: [],
        ...item,
      });
    }
  });

  const result: TreeOptionWithKeyAndParentID[] = [];

  // 构建树
  list.forEach((item) => {
    if (item.key) {
      const node = map.get(item.key);

      // 如果有父节点且父节点存在于map中
      if (item.parentID && item.parentID !== '0' && map.has(item.parentID)) {
        const parent = map.get(item.parentID);
        parent.children.push(node);
      } else {
        // 如果是根节点或父节点不存在，则放入结果数组
        result.push(node);
      }
    }
  });

  return result;
};

// 自动选择第一个节点 muti type
export const autoSelectFirstNode = (nodes: TreeOptionWithKeyAndParentID[]) => {
  if (nodes.length > 0) {
    return { value: [nodes[0]?.value] };
  }
  return { value: [] };
};

// 自动选择第一个节点 single type
export const autoSelectFirstNodeSingle = (nodes: TreeOptionWithKeyAndParentID[]) => {
  if (nodes.length > 0) {
    return { value: nodes[0]?.value };
  }
  return { value: [] };
};

// 获取所有节点的 key 值
export const getAllNodeKeys = (nodes: TreeOptionWithKeyAndParentID[]): string[] => {
  const keys: string[] = [];
  const traverse = (nodeList: TreeOptionWithKeyAndParentID[]) => {
    nodeList.forEach((node) => {
      if (node.key) {
        keys.push(node.key);
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children as TreeOptionWithKeyAndParentID[]);
      }
    });
  };
  traverse(nodes);
  return keys;
};

// 获取区域列表的查询函数
const fetchAreaList = async (): Promise<TreeOptionWithKeyAndParentID[]> => {
  const res = await ThingsApi.postApiV1ThingsAreaInfoGetList({
    page: { page: 1, size: 2000 },
  });
  const list: TreeOptionWithKeyAndParentID[] = res.list.map((item: ThingsApi.AreaInfo) => ({
    label: item.areaName,
    key: item.areaID?.toString() || '',
    parentID: item.parentAreaID?.toString() || '',
  }));

  return convertGroupDetailToTree(list);
};

// 使用 useQuery 的区域列表 hook
export const useAreaQuery = () => {
  // return useQuery({
  //   queryKey: ['area-list'],
  //   queryFn: fetchAreaList,
  //   staleTime: 5 * 60 * 1000, // 5 分钟内数据视为新鲜
  //   gcTime: 10 * 60 * 1000, // 10 分钟后清理缓存
  // });
};

// 返回同步获取区域列表的函数（用于 ApiTreeSelect）
export const getAreaList = async (): Promise<TreeOptionWithKeyAndParentID[]> => {
  const cachedData = localStorage.getItem('area-list-cache');
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      const cacheTime = parsed.timestamp;
      const now = Date.now();
      // 如果缓存时间小于 5 分钟，直接返回缓存数据
      if (now - cacheTime < 5 * 60 * 1000) {
        return parsed.data;
      }
    } catch (error) {
      console.warn('解析缓存数据失败:', error);
    }
  }

  // 没有缓存或缓存过期，重新获取数据
  const data = await fetchAreaList();

  // 缓存数据
  localStorage.setItem(
    'area-list-cache',
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  );

  return data;
};
