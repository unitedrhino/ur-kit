/**
 * 文件说明：告警 V2 通知渠道数据层
 * ThingsApi 目前没有专门的通知渠道枚举接口，因此以前端常量对齐后端通知调度器当前真实支持的渠道。
 */
import { ref } from 'vue';

import type { NotifyChannel } from '../types/alarm-v2.types';
import {
  loadAlarmCapabilities,
  notifyChannelsFromCapabilities,
} from './useAlarmCapabilities';

/**
 * 通知渠道 composable
 * 当前真实来源为已加载的告警能力接口，不保留独立硬编码兜底。
 */
export function useAlarmNotifyChannel() {
  /** 当前可用的通知渠道列表 */
  const channels = ref<NotifyChannel[]>([]);
  /** 加载状态 */
  const loading = ref(false);
  /** 最近一次加载错误 */
  const error = ref<Error | null>(null);

  /**
   * 从真实来源获取通知渠道列表
   * 独立模板页不经过规则编辑器初始化，因此这里必须主动确保能力契约已加载。
   */
  async function fetchNotifyChannels(): Promise<NotifyChannel[]> {
    await loadAlarmCapabilities();
    return notifyChannelsFromCapabilities();
  }

  /**
   * 加载通知渠道列表
   */
  async function loadChannels() {
    loading.value = true;
    error.value = null;
    try {
      const list = await fetchNotifyChannels();
      channels.value = list;
    } catch (err) {
      console.error('加载通知渠道失败', err);
      error.value = err instanceof Error ? err : new Error(String(err));
      channels.value = [];
    } finally {
      loading.value = false;
    }
  }

  return {
    channels,
    loading,
    error,
    loadChannels,
  };
}
