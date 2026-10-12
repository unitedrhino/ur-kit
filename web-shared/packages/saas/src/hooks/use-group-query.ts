import type { TreeOptionWithKeyAndParentID } from './use-area-query';

// import { useQuery } from '@tanstack/vue-query';

import { ThingsApi } from '@vben/api';

// import { postThingsGroupInfoIndex } from '#/api/v1/api';

import { convertGroupDetailToTree } from './use-area-query';

// 获取建筑分组列表的查询函数
const fetchGroupList = async (purpose: string = 'building'): Promise<TreeOptionWithKeyAndParentID[]> => {
  const res = await ThingsApi.postApiV1ThingsGroupInfoGetList({
    purpose,
    page: { page: 1, size: 2000 },
  });

  const list: TreeOptionWithKeyAndParentID[] = res.list.map((item: ThingsApi.GroupInfo) => ({
    label: item.name,
    key: item.id?.toString() || '',
    parentID: item.parentID?.toString() || '',
  }));

  return convertGroupDetailToTree(list);
};

// 使用 useQuery 的建筑分组列表 hook
export const useGroupQuery = (_purpose: string = 'building') => {
  // return useQuery({
  //   queryKey: ['group-list', purpose],
  //   queryFn: () => fetchGroupList(purpose),
  //   staleTime: 5 * 60 * 1000, // 5 分钟内数据视为新鲜
  //   gcTime: 10 * 60 * 1000, // 10 分钟后清理缓存
  // });
};

// 返回同步获取建筑分组列表的函数（用于 ApiTreeSelect）
export const getGroupList = async (purpose: string = 'building'): Promise<TreeOptionWithKeyAndParentID[]> => {
  const cacheKey = `group-list-${purpose}-cache`;
  const cachedData = localStorage.getItem(cacheKey);

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
  const data = await fetchGroupList(purpose);

  // 缓存数据
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  );

  return data;
};
