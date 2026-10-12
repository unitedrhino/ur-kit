/**
 * 设备看板上下文读取工具。
 *
 * 父页面统一加载设备详情与物模型，本 hook 只负责让看板子组件读取这些共享状态。
 */
import type { Ref } from 'vue';

import type { ThingsApi } from '@vben/api';

import { inject } from 'vue';

/** useDeviceInfo 返回设备看板父页面提供的共享状态。 */
export function useDeviceInfo() {
  const deviceInfo = inject<Ref<null | ThingsApi.DeviceInfo>>('deviceInfo');
  const deviceInfoLoading = inject<Ref<boolean>>('deviceInfoLoading');
  const deviceInfoError = inject<Ref<Error | null>>('deviceInfoError');
  const refreshDeviceInfo = inject<() => Promise<void>>('refreshDeviceInfo');

  const deviceSchema = inject<Ref<null | ThingsApi.DeviceSchema[]>>('deviceSchema');
  const deviceSchemaLoading = inject<Ref<boolean>>('deviceSchemaLoading');
  const deviceSchemaError = inject<Ref<Error | null>>('deviceSchemaError');
  const refreshDeviceSchema = inject<() => Promise<void>>('refreshDeviceSchema');

  if (!deviceInfo) {
    console.warn('useDeviceInfo: deviceInfo 未被提供，请确保在设备看板页面内使用');
  }

  return {
    deviceInfo,
    deviceInfoError,
    deviceInfoLoading,
    deviceSchema,
    deviceSchemaError,
    deviceSchemaLoading,
    refreshDeviceInfo,
    refreshDeviceSchema,
  };
}
