import { computed } from 'vue';
import { useAreaStore } from '../modules/area';

/**
 * 区域相关的统一业务逻辑封装
 */
export function useArea() {
  const areaStore = useAreaStore();

  // 计算属性：区域列表
  const areas = computed(() => areaStore.areas);

  // 计算属性：区域树结构
  const areaTree = computed(() => areaStore.areaTree);

  // 计算属性：加载状态
  const isLoading = computed(() => areaStore.loading);

  // 计算属性：错误信息
  const errorMessage = computed(() => areaStore.error);

  // 计算属性：区域数量
  const areaCount = computed(() => areas.value.length);

  // 计算属性：是否有区域
  const hasAreas = computed(() => areaCount.value > 0);

  /**
   * 初始化区域列表
   */
  const initAreas = async (params?: { page?: number; size?: number; parentAreaID?: string }) => {
    return await areaStore.getAreas(params);
  };

  /**
   * 刷新区域列表
   */
  const refreshAreas = async () => {
    return await areaStore.getAreas();
  };

  /**
   * 根据 ID 获取区域
   */
  const findAreaById = (areaID: string) => {
    return areaStore.getAreaById(areaID);
  };

  /**
   * 获取子区域
   */
  const findChildAreas = (parentAreaID: string) => {
    return areaStore.getChildAreas(parentAreaID);
  };

  /**
   * 创建区域
   */
  const createArea = async (areaData: Partial<import('@vben/api').CoreApi.AreaInfo>) => {
    return await areaStore.createArea(areaData);
  };

  /**
   * 更新区域
   */
  const updateArea = async (areaData: import('@vben/api').CoreApi.AreaInfo) => {
    return await areaStore.updateArea(areaData);
  };

  /**
   * 删除区域
   */
  const deleteArea = async (areaID: string) => {
    return await areaStore.deleteArea(areaID);
  };

  /**
   * 获取区域选项（用于下拉框等）
   */
  const getAreaOptions = () => {
    return areas.value.map((area) => ({
      label: area.areaName || '未命名区域',
      value: area.areaID || '',
      data: area,
    }));
  };

  /**
   * 获取顶级区域选项
   */
  const getTopLevelAreaOptions = () => {
    return areas.value
      .filter((area) => !area.parentAreaID)
      .map((area) => ({
        label: area.areaName || '未命名区域',
        value: area.areaID || '',
        data: area,
      }));
  };

  /**
   * 清除错误信息
   */
  const clearError = () => {
    areaStore.clearError();
  };

  return {
    // 响应式数据
    areas,
    areaTree,
    isLoading,
    errorMessage,
    areaCount,
    hasAreas,

    // 方法
    initAreas,
    refreshAreas,
    findAreaById,
    findChildAreas,
    createArea,
    updateArea,
    deleteArea,
    getAreaOptions,
    getTopLevelAreaOptions,
    clearError,
  };
}
