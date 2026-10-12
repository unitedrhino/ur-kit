/**
 * 设备日志时间范围工具。
 *
 * 统一把页面快捷筛选和自定义时间转换成日志接口需要的毫秒时间戳字符串。
 */

import { $t } from '@vben/locales';

/** DeviceLogTimePreset 表示设备日志页内置的快捷时间范围。 */
export type DeviceLogTimePreset = 'last30m' | 'last1h' | 'last7d' | 'today' | 'yesterday';

/** DeviceLogTimeRange 是日志接口和页面控件共同使用的时间范围结构。 */
export interface DeviceLogTimeRange {
  /** 结束时间的 datetime-local 输入值。 */
  endInput: string;
  /** 当前时间范围的人类可读标签。 */
  label: string;
  /** 开始时间的 datetime-local 输入值。 */
  startInput: string;
  /** 接口需要的开始毫秒时间戳。 */
  timeEnd: string;
  /** 接口需要的结束毫秒时间戳。 */
  timeStart: string;
}

const PRESET_LABELS: Record<DeviceLogTimePreset, string> = {
  last30m: $t('orgIotClient.deviceLogs.presetLast30m'),
  last1h: $t('orgIotClient.deviceLogs.presetLast1h'),
  last7d: $t('orgIotClient.deviceLogs.presetLast7d'),
  today: $t('orgIotClient.deviceLogs.presetToday'),
  yesterday: $t('orgIotClient.deviceLogs.presetYesterday'),
};

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

/** formatDatetimeInput 将 Date 转成 datetime-local 控件需要的本地时间字符串。 */
export function formatDatetimeInput(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}T${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

/** parseDatetimeInput 将 datetime-local 输入值转成 Date，非法输入返回 null。 */
export function parseDatetimeInput(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** createTimeRangeFromCustom 根据自定义起止时间生成接口时间范围。 */
export function createTimeRangeFromCustom(startInput: string, endInput: string, label = $t('orgIotClient.deviceLogs.presetCustom')): DeviceLogTimeRange | null {
  const start = parseDatetimeInput(startInput);
  const end = parseDatetimeInput(endInput);
  if (!start || !end || start.getTime() > end.getTime()) {
    return null;
  }
  return {
    endInput: formatDatetimeInput(end),
    label,
    startInput: formatDatetimeInput(start),
    timeEnd: String(end.getTime()),
    timeStart: String(start.getTime()),
  };
}

/** createTimeRangeFromPreset 根据快捷范围生成接口时间范围。 */
export function createTimeRangeFromPreset(preset: DeviceLogTimePreset, now = new Date()): DeviceLogTimeRange {
  const end = new Date(now);
  const start = new Date(now);

  switch (preset) {
    case 'last1h': {
      start.setMinutes(start.getMinutes() - 60);
      break;
    }
    case 'last7d': {
      start.setDate(start.getDate() - 7);
      break;
    }
    case 'today': {
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'yesterday': {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'last30m':
    default: {
      start.setMinutes(start.getMinutes() - 30);
      break;
    }
  }

  return {
    endInput: formatDatetimeInput(end),
    label: PRESET_LABELS[preset],
    startInput: formatDatetimeInput(start),
    timeEnd: String(end.getTime()),
    timeStart: String(start.getTime()),
  };
}

/** DEVICE_LOG_TIME_PRESETS 是页面快捷时间范围的展示顺序。 */
export const DEVICE_LOG_TIME_PRESETS: Array<{ label: string; value: DeviceLogTimePreset }> = [
  { label: PRESET_LABELS.last30m, value: 'last30m' },
  { label: PRESET_LABELS.last1h, value: 'last1h' },
  { label: PRESET_LABELS.today, value: 'today' },
  { label: PRESET_LABELS.yesterday, value: 'yesterday' },
  { label: PRESET_LABELS.last7d, value: 'last7d' },
];


