/**
 * 能源大屏配置 DTO
 * 存储于项目 profile（things project profile），通过 code 标识
 */

/** profile code（版本化，便于 schema 演进） */
export const ENERGY_DASHBOARD_PROFILE_CODE = 'energy_dashboard_settings_v1';

export type EnergyDashboardMode = 'custom' | 'default';

export interface EnergyDashboardSetting {
  /** 大屏方案 */
  mode: EnergyDashboardMode;
  /** 定制大屏 id（mode=custom 时必填） */
  selectedScreenId?: string;
  /** 定制大屏名称（展示辅助，可选） */
  selectedScreenName?: string;
  /** 最后更新时间 ISO 字符串 */
  updatedAt?: string;
}

/** 默认配置 */
export const DEFAULT_ENERGY_DASHBOARD_SETTING: EnergyDashboardSetting = {
  mode: 'default',
};
