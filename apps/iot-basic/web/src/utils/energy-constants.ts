/**
 * 能源管理模块共享常量
 */

import { $t } from '@vben/locales';

/** 能源设备品类 Code */
export const ENERGY_PRODUCT_CATEGORY_CODE = 'dianbiao';

/** 常用数据点标识 */
export const DATA_IDS = {
  /** 总电能 */
  TOTAL_ENERGY: 'TotalEnergy',
  /** 电能变化量 */
  TOTAL_ENERGY_CHANGE: 'TotalEnergyChange',
  /** 有功功率 */
  P: 'P',
  /** 无功功率 */
  Q: 'Q',
  /** 电流 */
  I: 'I',
  /** 电压 */
  U: 'U',
  /** A相功率 */
  PS: 'Ps',
} as const;

/** 设备在线状态 */
export const DEVICE_STATUS = {
  INACTIVE: 1,
  ONLINE: 2,
  OFFLINE: 3,
  FAULT: 4,
} as const;

/** 设备状态标签映射 */
export const DEVICE_STATUS_MAP: Record<number, { label: string; type: 'default' | 'error' | 'success' | 'warning' }> = {
  [DEVICE_STATUS.INACTIVE]: { label: $t('orgIotClient.deviceStatus.inactive'), type: 'default' },
  [DEVICE_STATUS.ONLINE]: { label: $t('orgIotClient.deviceStatus.online'), type: 'success' },
  [DEVICE_STATUS.OFFLINE]: { label: $t('orgIotClient.deviceStatus.offline'), type: 'warning' },
  [DEVICE_STATUS.FAULT]: { label: $t('orgIotClient.deviceStatus.fault'), type: 'error' },
};
