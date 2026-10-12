import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { ThingsApi } from '@vben/api';

export const useAreaStore = defineStore(
  'area',
  () => {
    const areas = ref<ThingsApi.AreaInfo[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // 计算属性：按树结构组织的区域数据
    const areaTree = computed(() => {
      const tree: ThingsApi.AreaInfo[] = [];
      const map = new Map<string, ThingsApi.AreaInfo & { children?: ThingsApi.AreaInfo[] }>();

      // 先建立映射
      areas.value.forEach((area) => {
        map.set(area.areaID!, { ...area, children: [] });
      });

      // 构建树结构
      areas.value.forEach((area) => {
        const currentArea = map.get(area.areaID!);
        if (area.parentAreaID && map.has(area.parentAreaID)) {
          const parent = map.get(area.parentAreaID);
          parent!.children!.push(currentArea!);
        } else {
          tree.push(currentArea!);
        }
      });

      return tree;
    });

    // 获取区域列表
    const getAreas = async (params?: { page?: number; size?: number; parentAreaID?: string }) => {
      try {
        loading.value = true;
        error.value = null;

        const res = await ThingsApi.postApiV1ThingsAreaInfoGetList({
          page: {
            page: params?.page || 1,
            size: params?.size || 1000,
          },
          parentAreaID: params?.parentAreaID,
        });

        areas.value = res.list;
        return res;
      } catch (err) {
        error.value = err instanceof Error ? err.message : '获取区域列表失败';
        throw err;
      } finally {
        loading.value = false;
      }
    };

    // 创建区域
    const createArea = async (areaData: Partial<ThingsApi.AreaInfo>) => {
      try {
        loading.value = true;
        error.value = null;

        const res = await ThingsApi.postApiV1ThingsAreaInfoCreate(areaData as ThingsApi.AreaInfo);

        // 重新获取列表以保持数据一致性
        await getAreas();

        return res;
      } catch (err) {
        error.value = err instanceof Error ? err.message : '创建区域失败';
        throw err;
      } finally {
        loading.value = false;
      }
    };

    // 更新区域
    const updateArea = async (areaData: ThingsApi.AreaInfo) => {
      try {
        loading.value = true;
        error.value = null;

        const res = await ThingsApi.postApiV1ThingsAreaInfoUpdate(areaData);

        // 更新本地数据
        const index = areas.value.findIndex((area) => area.areaID === areaData.areaID);
        if (index !== -1) {
          areas.value[index] = { ...areas.value[index], ...areaData };
        }

        return res;
      } catch (err) {
        error.value = err instanceof Error ? err.message : '更新区域失败';
        throw err;
      } finally {
        loading.value = false;
      }
    };

    // 删除区域
    const deleteArea = async (areaID: string) => {
      try {
        loading.value = true;
        error.value = null;

        const res = await ThingsApi.postApiV1ThingsAreaInfoDelete({ areaID });

        // 从本地数据中移除
        areas.value = areas.value.filter((area) => area.areaID !== areaID);

        return res;
      } catch (err) {
        error.value = err instanceof Error ? err.message : '删除区域失败';
        throw err;
      } finally {
        loading.value = false;
      }
    };

    // 根据ID获取区域信息
    const getAreaById = (areaID: string) => {
      return areas.value.find((area) => area.areaID === areaID);
    };

    // 获取子区域
    const getChildAreas = (parentAreaID: string) => {
      return areas.value.filter((area) => area.parentAreaID === parentAreaID);
    };

    // 清除错误信息
    const clearError = () => {
      error.value = null;
    };

    // 实现 $reset 方法，用于重置 store 状态
    const $reset = () => {
      areas.value = [];
      loading.value = false;
      error.value = null;
    };

    return {
      // 状态
      areas,
      areaTree,
      loading,
      error,

      // 方法
      getAreas,
      createArea,
      updateArea,
      deleteArea,
      getAreaById,
      getChildAreas,
      clearError,
      $reset,
    };
  },
  {
    persist: {
      pick: ['areas'],
    },
  },
);
