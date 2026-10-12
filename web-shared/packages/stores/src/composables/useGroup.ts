import { computed } from 'vue';
import { useGroupStore } from '../modules/group';

/**
 * 分组相关的统一业务逻辑封装
 */
export function useGroup() {
  const groupStore = useGroupStore();

  // 计算属性：分组列表
  const groups = computed(() => groupStore.groups);

  // 计算属性：分组树结构
  const groupTree = computed(() => groupStore.groupTree);

  // 计算属性：加载状态
  const isLoading = computed(() => groupStore.loading);

  // 计算属性：错误信息
  const errorMessage = computed(() => groupStore.error);

  // 计算属性：分组数量
  const groupCount = computed(() => groups.value.length);

  // 计算属性：是否有分组
  const hasGroups = computed(() => groupCount.value > 0);

  /**
   * 初始化分组列表
   */
  const initGroups = async (params?: { page?: number; size?: number; parentID?: string; productID?: string; areaID?: string }) => {
    return await groupStore.getGroups(params);
  };

  /**
   * 刷新分组列表
   */
  const refreshGroups = async () => {
    return await groupStore.getGroups();
  };

  /**
   * 根据 ID 获取分组
   */
  const findGroupById = (id: string) => {
    return groupStore.getGroupById(id);
  };

  /**
   * 获取子分组
   */
  const findChildGroups = (parentID: string) => {
    return groupStore.getChildGroups(parentID);
  };

  /**
   * 根据产品ID获取分组
   */
  const findGroupsByProductId = (productID: string) => {
    return groupStore.getGroupsByProductId(productID);
  };

  /**
   * 根据区域ID获取分组
   */
  const findGroupsByAreaId = (areaID: string) => {
    return groupStore.getGroupsByAreaId(areaID);
  };

  /**
   * 创建分组
   */
  const createGroup = async (groupData: Partial<import('@vben/api').ThingsApi.GroupInfo>) => {
    return await groupStore.createGroup(groupData);
  };

  /**
   * 更新分组
   */
  const updateGroup = async (groupData: import('@vben/api').ThingsApi.GroupInfo) => {
    return await groupStore.updateGroup(groupData);
  };

  /**
   * 删除分组
   */
  const deleteGroup = async (id: string) => {
    return await groupStore.deleteGroup(id);
  };

  /**
   * 获取分组选项（用于下拉框等）
   */
  const getGroupOptions = () => {
    return groups.value.map((group) => ({
      label: group.name || '未命名分组',
      value: group.id ?? '',
      data: group,
    }));
  };

  /**
   * 获取顶级分组选项
   */
  const getTopLevelGroupOptions = () => {
    return groups.value
      .filter((group) => !group.parentID)
      .map((group) => ({
        label: group.name || '未命名分组',
        value: group.id ?? '',
        data: group,
      }));
  };

  /**
   * 根据产品ID获取分组选项
   */
  const getGroupOptionsByProductId = (productID: string) => {
    return groups.value
      .filter((group) => group.productID === productID)
      .map((group) => ({
        label: group.name || '未命名分组',
        value: group.id ?? '',
        data: group,
      }));
  };

  /**
   * 根据区域ID获取分组选项
   */
  const getGroupOptionsByAreaId = (areaID: string) => {
    return groups.value
      .filter((group) => group.areaID === areaID)
      .map((group) => ({
        label: group.name || '未命名分组',
        value: group.id ?? '',
        data: group,
      }));
  };

  /**
   * 清除错误信息
   */
  const clearError = () => {
    groupStore.clearError();
  };

  return {
    // 响应式数据
    groups,
    groupTree,
    isLoading,
    errorMessage,
    groupCount,
    hasGroups,

    // 方法
    initGroups,
    refreshGroups,
    findGroupById,
    findChildGroups,
    findGroupsByProductId,
    findGroupsByAreaId,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupOptions,
    getTopLevelGroupOptions,
    getGroupOptionsByProductId,
    getGroupOptionsByAreaId,
    clearError,
  };
}
