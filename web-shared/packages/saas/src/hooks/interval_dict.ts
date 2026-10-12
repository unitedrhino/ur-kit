/**
 * 间隔单位枚举
 * a (毫秒,默认), d (天), h (小时), m (分钟), n (月), s (秒), u (微秒), w (周), y (年)
 */
export enum IntervalUnit {
  MILLISECOND = 'a', // 毫秒 (默认)
  DAY = 'd', // 天
  HOUR = 'h', // 小时
  MINUTE = 'm', // 分钟
  MONTH = 'n', // 月
  SECOND = 's', // 秒
  MICROSECOND = 'u', // 微秒
  WEEK = 'w', // 周
  YEAR = 'y', // 年
}

/**
 * 间隔配置接口
 */
export interface IntervalConfig {
  value: number;
  unit: IntervalUnit;
  label: string;
  description?: string;
}

/**
 * 间隔单位显示名称映射
 */
export const INTERVAL_UNIT_LABELS: Record<IntervalUnit, string> = {
  [IntervalUnit.MICROSECOND]: '微秒',
  [IntervalUnit.MILLISECOND]: '毫秒',
  [IntervalUnit.SECOND]: '秒',
  [IntervalUnit.MINUTE]: '分钟',
  [IntervalUnit.HOUR]: '小时',
  [IntervalUnit.DAY]: '天',
  [IntervalUnit.WEEK]: '周',
  [IntervalUnit.MONTH]: '月',
  [IntervalUnit.YEAR]: '年',
};

/**
 * 微秒间隔选项
 */
export const MICROSECOND_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.MICROSECOND, label: '1微秒' },
  { value: 10, unit: IntervalUnit.MICROSECOND, label: '10微秒' },
  { value: 100, unit: IntervalUnit.MICROSECOND, label: '100微秒' },
  { value: 500, unit: IntervalUnit.MICROSECOND, label: '500微秒' },
  { value: 1000, unit: IntervalUnit.MICROSECOND, label: '1000微秒' },
];

/**
 * 毫秒间隔选项
 */
export const MILLISECOND_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.MILLISECOND, label: '1毫秒' },
  { value: 10, unit: IntervalUnit.MILLISECOND, label: '10毫秒' },
  { value: 50, unit: IntervalUnit.MILLISECOND, label: '50毫秒' },
  { value: 100, unit: IntervalUnit.MILLISECOND, label: '100毫秒' },
  { value: 500, unit: IntervalUnit.MILLISECOND, label: '500毫秒' },
  { value: 1000, unit: IntervalUnit.MILLISECOND, label: '1秒', description: '1000毫秒' },
  { value: 5000, unit: IntervalUnit.MILLISECOND, label: '5秒', description: '5000毫秒' },
  { value: 10000, unit: IntervalUnit.MILLISECOND, label: '10秒', description: '10000毫秒' },
  { value: 30000, unit: IntervalUnit.MILLISECOND, label: '30秒', description: '30000毫秒' },
  { value: 60000, unit: IntervalUnit.MILLISECOND, label: '1分钟', description: '60000毫秒' },
];

/**
 * 秒间隔选项
 */
export const SECOND_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.SECOND, label: '1秒' },
  { value: 5, unit: IntervalUnit.SECOND, label: '5秒' },
  { value: 10, unit: IntervalUnit.SECOND, label: '10秒' },
  { value: 15, unit: IntervalUnit.SECOND, label: '15秒' },
  { value: 30, unit: IntervalUnit.SECOND, label: '30秒' },
  { value: 60, unit: IntervalUnit.SECOND, label: '1分钟', description: '60秒' },
];

/**
 * 分钟间隔选项
 */
export const MINUTE_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.MINUTE, label: '1分钟' },
  { value: 2, unit: IntervalUnit.MINUTE, label: '2分钟' },
  { value: 5, unit: IntervalUnit.MINUTE, label: '5分钟' },
  { value: 10, unit: IntervalUnit.MINUTE, label: '10分钟' },
  { value: 15, unit: IntervalUnit.MINUTE, label: '15分钟' },
  { value: 20, unit: IntervalUnit.MINUTE, label: '20分钟' },
  { value: 30, unit: IntervalUnit.MINUTE, label: '30分钟' },
  { value: 45, unit: IntervalUnit.MINUTE, label: '45分钟' },
  { value: 60, unit: IntervalUnit.MINUTE, label: '1小时', description: '60分钟' },
];

/**
 * 小时间隔选项
 */
export const HOUR_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.HOUR, label: '1小时' },
  { value: 2, unit: IntervalUnit.HOUR, label: '2小时' },
  { value: 3, unit: IntervalUnit.HOUR, label: '3小时' },
  { value: 4, unit: IntervalUnit.HOUR, label: '4小时' },
  { value: 6, unit: IntervalUnit.HOUR, label: '6小时' },
  { value: 8, unit: IntervalUnit.HOUR, label: '8小时' },
  { value: 12, unit: IntervalUnit.HOUR, label: '12小时' },
  { value: 18, unit: IntervalUnit.HOUR, label: '18小时' },
  { value: 24, unit: IntervalUnit.HOUR, label: '1天', description: '24小时' },
];

/**
 * 天间隔选项
 */
export const DAY_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.DAY, label: '1天' },
  { value: 2, unit: IntervalUnit.DAY, label: '2天' },
  { value: 3, unit: IntervalUnit.DAY, label: '3天' },
  { value: 5, unit: IntervalUnit.DAY, label: '5天' },
  { value: 7, unit: IntervalUnit.DAY, label: '1周', description: '7天' },
  { value: 10, unit: IntervalUnit.DAY, label: '10天' },
  { value: 15, unit: IntervalUnit.DAY, label: '15天' },
  { value: 30, unit: IntervalUnit.DAY, label: '1月', description: '30天' },
];

/**
 * 周间隔选项
 */
export const WEEK_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.WEEK, label: '1周' },
  { value: 2, unit: IntervalUnit.WEEK, label: '2周' },
  { value: 3, unit: IntervalUnit.WEEK, label: '3周' },
  { value: 4, unit: IntervalUnit.WEEK, label: '1月', description: '4周' },
  { value: 6, unit: IntervalUnit.WEEK, label: '6周' },
  { value: 8, unit: IntervalUnit.WEEK, label: '8周' },
  { value: 12, unit: IntervalUnit.WEEK, label: '3月', description: '12周' },
  { value: 26, unit: IntervalUnit.WEEK, label: '半年', description: '26周' },
  { value: 52, unit: IntervalUnit.WEEK, label: '1年', description: '52周' },
];

/**
 * 月间隔选项
 */
export const MONTH_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.MONTH, label: '1月' },
  { value: 2, unit: IntervalUnit.MONTH, label: '2月' },
  { value: 3, unit: IntervalUnit.MONTH, label: '1季度', description: '3月' },
  { value: 6, unit: IntervalUnit.MONTH, label: '半年', description: '6月' },
  { value: 9, unit: IntervalUnit.MONTH, label: '9月' },
  { value: 12, unit: IntervalUnit.MONTH, label: '1年', description: '12月' },
  { value: 18, unit: IntervalUnit.MONTH, label: '18月' },
  { value: 24, unit: IntervalUnit.MONTH, label: '2年', description: '24月' },
];

/**
 * 年间隔选项
 */
export const YEAR_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.YEAR, label: '1年' },
  { value: 2, unit: IntervalUnit.YEAR, label: '2年' },
  { value: 3, unit: IntervalUnit.YEAR, label: '3年' },
  { value: 5, unit: IntervalUnit.YEAR, label: '5年' },
  { value: 10, unit: IntervalUnit.YEAR, label: '10年' },
  { value: 20, unit: IntervalUnit.YEAR, label: '20年' },
  { value: 50, unit: IntervalUnit.YEAR, label: '50年' },
  { value: 100, unit: IntervalUnit.YEAR, label: '100年' },
];

/**
 * 所有间隔选项的映射
 */
export const INTERVAL_OPTIONS_MAP: Record<IntervalUnit, IntervalConfig[]> = {
  [IntervalUnit.MICROSECOND]: MICROSECOND_INTERVALS,
  [IntervalUnit.MILLISECOND]: MILLISECOND_INTERVALS,
  [IntervalUnit.SECOND]: SECOND_INTERVALS,
  [IntervalUnit.MINUTE]: MINUTE_INTERVALS,
  [IntervalUnit.HOUR]: HOUR_INTERVALS,
  [IntervalUnit.DAY]: DAY_INTERVALS,
  [IntervalUnit.WEEK]: WEEK_INTERVALS,
  [IntervalUnit.MONTH]: MONTH_INTERVALS,
  [IntervalUnit.YEAR]: YEAR_INTERVALS,
};

/**
 * 所有间隔选项的扁平化数组（按时间长度排序）
 */
export const ALL_INTERVAL_OPTIONS: IntervalConfig[] = [
  ...MICROSECOND_INTERVALS,
  ...MILLISECOND_INTERVALS,
  ...SECOND_INTERVALS,
  ...MINUTE_INTERVALS,
  ...HOUR_INTERVALS,
  ...DAY_INTERVALS,
  ...WEEK_INTERVALS,
  ...MONTH_INTERVALS,
  ...YEAR_INTERVALS,
];

/**
 * 常用间隔选项（用于快速选择）
 */
export const COMMON_INTERVALS: IntervalConfig[] = [
  { value: 1, unit: IntervalUnit.SECOND, label: '1秒' },
  { value: 5, unit: IntervalUnit.SECOND, label: '5秒' },
  { value: 30, unit: IntervalUnit.SECOND, label: '30秒' },
  { value: 1, unit: IntervalUnit.MINUTE, label: '1分钟' },
  { value: 5, unit: IntervalUnit.MINUTE, label: '5分钟' },
  { value: 15, unit: IntervalUnit.MINUTE, label: '15分钟' },
  { value: 30, unit: IntervalUnit.MINUTE, label: '30分钟' },
  { value: 1, unit: IntervalUnit.HOUR, label: '1小时' },
  { value: 6, unit: IntervalUnit.HOUR, label: '6小时' },
  { value: 12, unit: IntervalUnit.HOUR, label: '12小时' },
  { value: 1, unit: IntervalUnit.DAY, label: '1天' },
  { value: 7, unit: IntervalUnit.DAY, label: '1周' },
  { value: 1, unit: IntervalUnit.MONTH, label: '1月' },
  { value: 3, unit: IntervalUnit.MONTH, label: '1季度' },
  { value: 1, unit: IntervalUnit.YEAR, label: '1年' },
];

/**
 * 根据单位获取间隔选项
 * @param unit 间隔单位
 * @returns 间隔选项数组
 */
export function getIntervalsByUnit(unit: IntervalUnit): IntervalConfig[] {
  return INTERVAL_OPTIONS_MAP[unit] || [];
}

/**
 * 根据单位和数值查找间隔配置
 * @param unit 间隔单位
 * @param value 间隔数值
 * @returns 间隔配置对象或undefined
 */
export function findIntervalConfig(unit: IntervalUnit, value: number): IntervalConfig | undefined {
  const intervals = getIntervalsByUnit(unit);
  return intervals.find((interval) => interval.value === value);
}

/**
 * 格式化间隔显示文本
 * @param unit 间隔单位
 * @param value 间隔数值
 * @returns 格式化后的显示文本
 */
export function formatInterval(unit: IntervalUnit, value: number): string {
  const config = findIntervalConfig(unit, value);
  if (config) {
    return config.label;
  }

  const unitLabel = INTERVAL_UNIT_LABELS[unit];
  return `${value}${unitLabel}`;
}

/**
 * 检查间隔配置是否有效
 * @param unit 间隔单位
 * @param value 间隔数值
 * @returns 是否有效
 */
export function isValidInterval(unit: IntervalUnit, value: number): boolean {
  return value > 0 && Object.values(IntervalUnit).includes(unit);
}

/**
 * 获取单位的显示名称
 * @param unit 间隔单位
 * @returns 显示名称
 */
export function getUnitLabel(unit: IntervalUnit): string {
  return INTERVAL_UNIT_LABELS[unit] || unit;
}

/**
 * 将间隔转换为毫秒数（近似值，用于比较）
 * @param unit 间隔单位
 * @param value 间隔数值
 * @returns 毫秒数
 */
export function intervalToMilliseconds(unit: IntervalUnit, value: number): number {
  const multipliers: Record<IntervalUnit, number> = {
    [IntervalUnit.MICROSECOND]: 0.001,
    [IntervalUnit.MILLISECOND]: 1,
    [IntervalUnit.SECOND]: 1000,
    [IntervalUnit.MINUTE]: 60 * 1000,
    [IntervalUnit.HOUR]: 60 * 60 * 1000,
    [IntervalUnit.DAY]: 24 * 60 * 60 * 1000,
    [IntervalUnit.WEEK]: 7 * 24 * 60 * 60 * 1000,
    [IntervalUnit.MONTH]: 30 * 24 * 60 * 60 * 1000, // 假设30天
    [IntervalUnit.YEAR]: 365 * 24 * 60 * 60 * 1000, // 假设365天
  };

  return value * (multipliers[unit] || 1);
}

/**
 * 比较两个间隔的大小
 * @param interval1 间隔1
 * @param interval2 间隔2
 * @returns 比较结果：-1(小于), 0(等于), 1(大于)
 */
export function compareIntervals(interval1: { unit: IntervalUnit; value: number }, interval2: { unit: IntervalUnit; value: number }): number {
  const ms1 = intervalToMilliseconds(interval1.unit, interval1.value);
  const ms2 = intervalToMilliseconds(interval2.unit, interval2.value);

  if (ms1 < ms2) return -1;
  if (ms1 > ms2) return 1;
  return 0;
}
