import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { ThingsApi } from '@vben/api';

export const useGroupStore = defineStore('group', () => {
  const groups = ref<ThingsApi.GroupInfo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性：按树结构组织的分组数据
  const groupTree = computed(() => {
    const tree: ThingsApi.GroupInfo[] = [];
    const map = new Map<string, ThingsApi.GroupInfo & { children?: ThingsApi.GroupInfo[] }>();

    // 先建立映射
    groups.value.forEach((group) => {
      const id = group.id!;
      map.set(id, { ...group, children: [] });
    });

    // 构建树结构
    groups.value.forEach((group) => {
      const currentGroup = map.get(group.id!);
      if (!currentGroup) return;
      if (group.parentID && map.has(group.parentID)) {
        const parent = map.get(group.parentID);
        parent!.children!.push(currentGroup);
      } else {
        tree.push(currentGroup);
      }
    });

    return tree;
  });

  // 获取分组列表
  const getGroups = async (params?: {
    page?: number;
    size?: number;
    parentID?: string;
    productID?: string;
    areaID?: string;
  }) => {
    try {
      loading.value = true;
      error.value = null;

      const res = await ThingsApi.postApiV1ThingsGroupInfoGetList({
        page: {
          page: params?.page || 1,
          size: params?.size || 1000,
        },
        parentID: params?.parentID,
        productID: params?.productID,
        areaID: params?.areaID,
      });

      groups.value = res.list;
      return res;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取分组列表失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 创建分组
  const createGroup = async (groupData: Partial<ThingsApi.GroupInfo>) => {
    try {
      loading.value = true;
      error.value = null;

      const res = await ThingsApi.postApiV1ThingsGroupInfoCreate(groupData as ThingsApi.GroupInfo);

      // 重新获取列表以保持数据一致性
      await getGroups();

      return res;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建分组失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 更新分组
  const updateGroup = async (groupData: ThingsApi.GroupInfo) => {
    try {
      loading.value = true;
      error.value = null;

      const res = await ThingsApi.postApiV1ThingsGroupInfoUpdate(groupData);

      // 更新本地数据
      const index = groups.value.findIndex((group) => group.id === groupData.id);
      if (index !== -1) {
        groups.value[index] = { ...groups.value[index], ...groupData };
      }

      return res;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新分组失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 删除分组
  const deleteGroup = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;

      const res = await ThingsApi.postApiV1ThingsGroupInfoDelete({ id });

      // 从本地数据中移除
      groups.value = groups.value.filter((group) => group.id !== id);

      return res;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除分组失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 根据ID获取分组信息
  const getGroupById = (id: string) => {
    return groups.value.find((group) => group.id === id);
  };

  // 获取子分组
  const getChildGroups = (parentID: string) => {
    return groups.value.filter((group) => group.parentID === parentID);
  };

  // 根据产品ID获取分组
  const getGroupsByProductId = (productID: string) => {
    return groups.value.filter((group) => group.productID === productID);
  };

  // 根据区域ID获取分组
  const getGroupsByAreaId = (areaID: string) => {
    return groups.value.filter((group) => group.areaID === areaID);
  };

  // 清除错误信息
  const clearError = () => {
    error.value = null;
  };

  // 实现 $reset 方法，用于重置 store 状态
  const $reset = () => {
    groups.value = [];
    loading.value = false;
    error.value = null;
  };

  return {
    // 状态
    groups,
    groupTree,
    loading,
    error,

    // 方法
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    getChildGroups,
    getGroupsByProductId,
    getGroupsByAreaId,
    clearError,
    $reset,
  };
});
