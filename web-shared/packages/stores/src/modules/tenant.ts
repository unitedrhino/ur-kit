import { ref } from 'vue';

import { CoreApi } from '@vben/api';

import { defineStore } from 'pinia';

export const useTenantStore = defineStore(
  'tenant',
  () => {
    const currentTenant = ref<CoreApi.TenantInfo | null>(null);
    const loading = ref(false);
    const error = ref<null | string>(null);

    /**
     * 设置当前租户
     */
    const setCurrentTenant = (tenant: CoreApi.TenantInfo | null) => {
      currentTenant.value = tenant;
      error.value = null;
    };

    /**
     * 获取当前租户
     */
    const getCurrentTenant = () => currentTenant.value;

    /**
     * 从服务器获取租户详情并设置为当前租户
     */
    const fetchAndSetTenant = async (code: string) => {
      try {
        loading.value = true;
        error.value = null;

        const tenant = await CoreApi.postApiV1SystemTenantInfoGetOne({ code });
        // console.log("fetchAndSetTenant tenant========", tenant);
        currentTenant.value = tenant;
        return tenant;
      } catch (error_) {
        error.value = error_ instanceof Error ? error_.message : '获取租户信息失败';
        throw error_;
      } finally {
        loading.value = false;
      }
    };

    /**
     * 清空当前租户
     */
    const clearCurrentTenant = () => {
      currentTenant.value = null;
      error.value = null;
    };

    /**
     * 重置 store 状态
     */
    const $reset = () => {
      currentTenant.value = null;
      loading.value = false;
      error.value = null;
    };

    return {
      // 状态
      currentTenant,
      loading,
      error,
      // 方法
      setCurrentTenant,
      getCurrentTenant,
      fetchAndSetTenant,
      clearCurrentTenant,
      $reset,
    };
  },
  {
    persist: {
      // 只持久化 currentTenant 字段
      pick: ['currentTenant'],
      // loading 和 error 不需要持久化
    },
  },
);
