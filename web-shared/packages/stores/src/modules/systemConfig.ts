import { ref } from 'vue';
import { CoreApi } from '@vben/api';

import { defineStore } from 'pinia';

export const useSystemConfigStore = defineStore(
  'systemConfig',
  () => {
    const systemConfig = ref<CoreApi.SysConfigInfo | null>(null);

    // 返回值含义：
    // SysConfigInfo → 系统已初始化（oem.title 有效非空）
    // null          → 系统未初始化（后端返回空对象或 oem.title 为空）
    // undefined     → 状态未知（API 故障且无本地缓存），不应跳转 /init
    async function getSystemConfig(force = false): Promise<
      CoreApi.SysConfigInfo | null | undefined
    > {
      if (!force && systemConfig.value?.oem?.title?.trim()) {
        return systemConfig.value;
      }
      return fetchSystemConfig(force);
    }

    async function fetchSystemConfig(force = false): Promise<
      CoreApi.SysConfigInfo | null | undefined
    > {
      try {
        // Pinia persist 插件会自动从 localStorage 恢复数据到 systemConfig.value
        // 如果缓存值有效（oem.title 非空），直接返回
        if (!force && systemConfig.value?.oem?.title?.trim()) {
          return systemConfig.value;
        }

        // 缓存无效或不存在，重新获取
        // 读取系统配置信息,不需要登录
        // /api/v1/system/common/sys-config/core/read
        const res = await CoreApi.postApiV1SystemCommonSysConfigCoreGetOne({});
        // 后端未初始化时返回空字段对象（oem.title 为空），而非 null
        // 以 oem.title 是否有效作为系统已初始化的判断依据
        if (res?.oem?.title?.trim()) {
          // 更新值后，Pinia persist 插件会自动持久化到 localStorage
          systemConfig.value = res;
          return res;
        } else {
          // oem.title 为空，系统尚未初始化，清除可能存在的无效缓存
          systemConfig.value = null;
          return null;
        }
      } catch {
        // API 失败时保留已有缓存（网络抖动、服务重启等场景），避免清除有效的持久化数据
        if (systemConfig.value?.oem?.title) {
          return systemConfig.value;
        }
        // 无缓存且 API 失败：返回 undefined 表示状态未知，不应重定向到 /init
        // 避免"已初始化 + 无缓存 + API 故障"时误跳转到初始化页面
        return undefined;
      }
    }

    function $reset() {
      systemConfig.value = null;
      // Pinia persist 插件会自动同步到 localStorage
    }
    function updateSystemConfig(config: CoreApi.SysConfigInfo) {
      // 更新值后，Pinia persist 插件会自动持久化到 localStorage
      systemConfig.value = config;
    }

    return {
      $reset,
      getSystemConfig,
      fetchSystemConfig,
      systemConfig,
      updateSystemConfig,
    };
  },
  {
    persist: true,
  },
);
