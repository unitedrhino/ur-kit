import { computed } from 'vue';

import { useTenantStore } from '../modules/tenant';

/**
 * 租户相关的统一业务逻辑封装
 */
export function useTenant() {
  const tenantStore = useTenantStore();

  // 计算属性：当前租户
  const currentTenant = computed(() => tenantStore.currentTenant);

  // 计算属性：加载状态
  const isLoading = computed(() => tenantStore.loading);

  // 计算属性：错误信息
  const errorMessage = computed(() => tenantStore.error);

  // 计算属性：是否有当前租户
  const hasCurrentTenant = computed(() => currentTenant.value !== null);

  /**
   * 设置当前租户
   */
  const setCurrentTenant = (tenant: import('@vben/api').CoreApi.TenantInfo | null) => {
    tenantStore.setCurrentTenant(tenant);
  };

  /**
   * 获取当前租户
   */
  const getCurrentTenant = () => {
    return tenantStore.getCurrentTenant();
  };

  /**
   * 从服务器获取租户详情并设置为当前租户
   */
  const fetchAndSetTenant = async (code: string) => {
    return await tenantStore.fetchAndSetTenant(code);
  };

  /**
   * 清空当前租户
   */
  const clearCurrentTenant = () => {
    tenantStore.clearCurrentTenant();
  };

  return {
    // 响应式数据
    currentTenant,
    isLoading,
    errorMessage,
    hasCurrentTenant,

    // 方法
    setCurrentTenant,
    getCurrentTenant,
    fetchAndSetTenant,
    clearCurrentTenant,
  };
}
