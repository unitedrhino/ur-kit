import { ThingsApi } from '@vben/api';

import {
  DEFAULT_ENERGY_DASHBOARD_SETTING,
  ENERGY_DASHBOARD_PROFILE_CODE,
  type EnergyDashboardSetting,
} from '../types/dashboard-setting';

/**
 * 读取当前项目的能源大屏配置
 * 无配置、解析失败、请求失败时静默返回默认配置
 */
export async function loadDashboardSetting(): Promise<EnergyDashboardSetting> {
  try {
    const res = await ThingsApi.postApiV1ThingsProjectProfileGetOne({
      code: ENERGY_DASHBOARD_PROFILE_CODE,
    });
    // 响应结构：{ code, data: ProjectProfile }，data 可能为 undefined
    const profile = (res as any)?.data ?? (res as any);
    const raw = profile?.params;
    if (!raw) return { ...DEFAULT_ENERGY_DASHBOARD_SETTING };
    const parsed = JSON.parse(raw) as Partial<EnergyDashboardSetting>;
    if (parsed?.mode !== 'default' && parsed?.mode !== 'custom') {
      return { ...DEFAULT_ENERGY_DASHBOARD_SETTING };
    }
    return {
      mode: parsed.mode,
      selectedScreenId: parsed.selectedScreenId,
      selectedScreenName: parsed.selectedScreenName,
      updatedAt: parsed.updatedAt,
    };
  } catch (e) {
    console.warn('[dashboard-setting] load failed, fallback to default', e);
    return { ...DEFAULT_ENERGY_DASHBOARD_SETTING };
  }
}

/**
 * 更新当前项目的能源大屏配置
 */
export async function saveDashboardSetting(setting: EnergyDashboardSetting): Promise<void> {
  const payload: EnergyDashboardSetting = {
    ...setting,
    updatedAt: new Date().toISOString(),
  };
  await ThingsApi.postApiV1ThingsProjectProfileUpdate({
    code: ENERGY_DASHBOARD_PROFILE_CODE,
    params: JSON.stringify(payload),
  });
}
