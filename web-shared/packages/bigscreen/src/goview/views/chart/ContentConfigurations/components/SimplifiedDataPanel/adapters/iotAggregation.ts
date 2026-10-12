/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
export type IoTLogAggregationMode = 'intraday' | 'day' | 'week' | 'month';
export type IoTLogTimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';
export type IoTTimeAxisLabelFormat = 'date' | 'datetime' | 'month' | 'time' | 'year';
export type IoTAggregationDataSourceStrategy = 'client-preferred' | 'server-preferred' | 'server-required';

export type IoTResolvedAggregationConfig = {
  interval: number;
  intervalUnit: 'M' | 'd' | 'h' | 'm' | 'w';
  mode: IoTLogAggregationMode;
};

export type IoTAggregationModeOption = {
  disabled: boolean;
  label: string;
  reason?: string;
  value: IoTLogAggregationMode;
};

export type IoTAggregationIntervalOption = {
  bucketCount: number;
  disabled: boolean;
  label: string;
  value: string;
};

export type IoTAggregationRuleState = {
  aggregation: IoTResolvedAggregationConfig;
  bucketCount: number;
  correctionHint?: string;
  dataSourceHint: string;
  dataSourceStrategy: IoTAggregationDataSourceStrategy;
  durationMs: number;
  effectiveInterval: string;
  effectiveMode: IoTLogAggregationMode;
  endTime: number;
  intervalOptions: IoTAggregationIntervalOption[];
  isIntervalAllowed: boolean;
  isModeAllowed: boolean;
  isOverLimit: boolean;
  modeOptions: IoTAggregationModeOption[];
  preferServerAggregation: boolean;
  serverFallbackAllowed: boolean;
  startTime: number;
  timeAxisLabelFormat: IoTTimeAxisLabelFormat;
  timeRange: IoTLogTimeRange;
};

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
export const MAX_IOT_TIME_BUCKETS = 300;
const WEEK_MS = 7 * DAY_MS;
const MONTH_APPROX_MS = 28 * DAY_MS;
const CUSTOM_INTRADAY_MAX_MS = 7 * DAY_MS;
const ALL_MODES: IoTLogAggregationMode[] = ['intraday', 'day', 'week', 'month'];
const MODE_LABELS: Record<IoTLogAggregationMode, string> = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get intraday() { return editorT('bigscreenEditor.ui.timeBuckets'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get day() { return editorT('orgManage.flow.unitDay'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get week() { return editorT('iotApp.deviceDetail.weekSuffix'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get month() { return editorT('iotApp.deviceDetail.monthSuffix'); },
};
const INTERVAL_LABELS: Record<string, string> = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '10m'() { return editorT('bigscreenEditor.ui.10Minutes'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '12h'() { return editorT('bigscreenEditor.ui.12Hours'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '1d'() { return editorT('bigscreenEditor.ui.1Day'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '1h'() { return editorT('bigscreenEditor.ui.1Hour'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '30m'() { return editorT('bigscreenEditor.ui.30Minutes'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '3d'() { return editorT('orgIotClient.dashboard.range3d'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '5d'() { return editorT('bigscreenEditor.ui.5Days'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '6h'() { return editorT('bigscreenEditor.ui.6Hours'); },
};
const MODE_INTERVAL_VALUES: Record<'day' | 'intraday', string[]> = {
  day: ['1d', '3d', '5d'],
  intraday: ['10m', '30m', '1h', '6h', '12h'],
};
const RANGE_MODE_SUPPORT: Record<Exclude<IoTLogTimeRange, 'custom'>, IoTLogAggregationMode[]> = {
  '1h': ['intraday'],
  '6h': ['intraday'],
  '24h': ['intraday'],
  '7d': ['intraday', 'day'],
  '30d': ['day', 'week', 'month'],
};
const RANGE_DURATION_MS: Record<Exclude<IoTLogTimeRange, 'custom'>, number> = {
  '1h': HOUR_MS,
  '6h': 6 * HOUR_MS,
  '24h': DAY_MS,
  '7d': 7 * DAY_MS,
  '30d': 30 * DAY_MS,
};
const TIME_RANGE_LABELS: Record<IoTLogTimeRange, string> = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '1h'() { return editorT('bigscreenEditor.ui.1Hour'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '6h'() { return editorT('bigscreenEditor.ui.6Hours'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '24h'() { return editorT('orgIotClient.dashboard.range24h'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '7d'() { return editorT('iotApp.dashboard.last7d'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get '30d'() { return editorT('iotApp.dashboard.last30d'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get custom() { return editorT('orgIotClient.deviceLogs.customTime'); },
};

const pad = (value: number) => String(value).padStart(2, '0');

const normalizeTimeRange = (rawValue?: string): IoTLogTimeRange => {
  if (rawValue === '1h' || rawValue === '6h' || rawValue === '24h' || rawValue === '7d' || rawValue === '30d' || rawValue === 'custom') {
    return rawValue;
  }
  return '1h';
};

const startOfLocalDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const startOfLocalWeek = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return date.getTime();
};

const startOfLocalMonth = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const resolveIoTTimeRange = (config: {
  customTimeRange?: ArrayLike<number> | null | undefined;
  logTimeRange?: IoTLogTimeRange | string;
}) => {
  const timeRange = normalizeTimeRange(config.logTimeRange);
  if (timeRange === 'custom' && config.customTimeRange?.length === 2) {
    const startTime = Number(config.customTimeRange[0]);
    const endTime = Number(config.customTimeRange[1]);
    if (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime) {
      return {
        durationMs: endTime - startTime,
        endTime,
        startTime,
        timeRange,
      };
    }
  }

  const endTime = Date.now();
  const durationMs = RANGE_DURATION_MS[timeRange === 'custom' ? '1h' : timeRange];
  return {
    durationMs,
    endTime,
    startTime: endTime - durationMs,
    timeRange,
  };
};

const resolveModeReason = (mode: IoTLogAggregationMode, timeRange: IoTLogTimeRange, durationMs: number) => {
  if (timeRange !== 'custom') {
    return RANGE_MODE_SUPPORT[timeRange].includes(mode) ? undefined : editorT('bigscreenEditor.dynamic.message44', { range: String(timeRange), mode: String(MODE_LABELS[mode]) });
  }

  switch (mode) {
    case 'intraday':
      return durationMs <= CUSTOM_INTRADAY_MAX_MS ? undefined : editorT('bigscreenEditor.ui.timeBucketAggregationNotRecommendedRangesLongerThan');
    case 'day':
      return durationMs >= DAY_MS ? undefined : editorT('bigscreenEditor.ui.dailyAggregationNotRecommendedRangesShorterThanOne');
    case 'week':
      return durationMs >= WEEK_MS ? undefined : editorT('bigscreenEditor.ui.weeklyAggregationNotRecommendedRangesShorterThanSeven');
    case 'month':
      return durationMs >= MONTH_APPROX_MS ? undefined : editorT('bigscreenEditor.ui.monthlyAggregationNotRecommendedShortTimeRanges');
    default:
      return undefined;
  }
};

const resolveDataSourceStrategy = (
  mode: IoTLogAggregationMode,
  durationMs: number,
): {
  hint: string;
  preferServerAggregation: boolean;
  serverFallbackAllowed: boolean;
  strategy: IoTAggregationDataSourceStrategy;
} => {
  if (mode === 'intraday') {
    return {
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get hint() { return editorT('bigscreenEditor.ui.timeBucketAggregationUsesFrontendBucketsFirstAlign'); },
      preferServerAggregation: false,
      serverFallbackAllowed: true,
      strategy: 'client-preferred',
    };
  }

  if (mode === 'day' || mode === 'week' || mode === 'month') {
    return {
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get hint() { return editorT('bigscreenEditor.ui.thisAggregationUsesBackendAPIRawLogBucketing'); },
      preferServerAggregation: true,
      serverFallbackAllowed: false,
      strategy: 'server-required',
    };
  }

  if (durationMs > DAY_MS) {
    return {
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get hint() { return editorT('bigscreenEditor.ui.largeTimeRangesBackendAggregationPreferredFrontendAggregation'); },
      preferServerAggregation: true,
      serverFallbackAllowed: true,
      strategy: 'server-preferred',
    };
  }

  return {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get hint() { return editorT('bigscreenEditor.ui.thisCombinationUsesFrontendAggregationFirstAndSuitable'); },
    preferServerAggregation: false,
    serverFallbackAllowed: true,
    strategy: 'client-preferred',
  };
};

const parseIntervalByMode = (mode: IoTLogAggregationMode, rawValue?: string): IoTResolvedAggregationConfig => {
  if (mode === 'week') {
    return { interval: 1, intervalUnit: 'w', mode };
  }
  if (mode === 'month') {
    return { interval: 1, intervalUnit: 'M', mode };
  }

  const fallback = mode === 'day' ? '1d' : '10m';
  const match = /^(\d+)([a-zA-Z]+)$/.exec(rawValue ?? fallback);
  // 正则含 (\d+) 捕获组，匹配成功时组 1 必存在，此兜底仅为满足严格索引类型收窄
  const parsedInterval = match ? Math.max(Number.parseInt(match?.[1] ?? '1', 10), 1) : Number.parseInt(fallback, 10);
  const parsedUnit = match?.[2] ?? fallback.replace(/^\d+/, '');

  if (mode === 'day') {
    return { interval: parsedInterval, intervalUnit: 'd', mode };
  }

  return {
    interval: parsedInterval,
    intervalUnit: parsedUnit.toLowerCase() === 'h' ? 'h' : 'm',
    mode,
  };
};

export const resolveIoTLogAggregationConfig = (config: {
  logAggregationMode?: IoTLogAggregationMode;
  logInterval?: string;
}) => parseIntervalByMode(config.logAggregationMode ?? 'intraday', config.logInterval);

export const resolveIoTAggregationRuleState = (config: {
  customTimeRange?: ArrayLike<number> | null | undefined;
  logAggregationMode?: IoTLogAggregationMode;
  logInterval?: string;
  logTimeRange?: IoTLogTimeRange | string;
  maxBuckets?: number;
}): IoTAggregationRuleState => {
  const maxBuckets = config.maxBuckets ?? MAX_IOT_TIME_BUCKETS;
  const { startTime, endTime, durationMs, timeRange } = resolveIoTTimeRange(config);

  const modeOptions = ALL_MODES.map((mode) => {
    const reason = resolveModeReason(mode, timeRange, durationMs);
    return {
      disabled: !!reason,
      label: MODE_LABELS[mode],
      reason,
      value: mode,
    };
  });

  const enabledModes = modeOptions.filter((item) => !item.disabled).map((item) => item.value);
  const requestedMode = config.logAggregationMode ?? 'intraday';
  const effectiveMode = enabledModes.includes(requestedMode) ? requestedMode : (enabledModes[0] ?? 'intraday');
  const isModeAllowed = effectiveMode === requestedMode;

  let intervalOptions: IoTAggregationIntervalOption[] = [];
  if (effectiveMode === 'day' || effectiveMode === 'intraday') {
    intervalOptions = MODE_INTERVAL_VALUES[effectiveMode].map((value) => {
      const aggregation = resolveIoTLogAggregationConfig({
        logAggregationMode: effectiveMode,
        logInterval: value,
      });
      const bucketCount = estimateIoTBucketCount(startTime, endTime, aggregation);
      return {
        bucketCount,
        disabled: bucketCount > maxBuckets,
        label: INTERVAL_LABELS[value] ?? value,
        value,
      };
    });
  }

  const fixedInterval = effectiveMode === 'week' ? '1w' : effectiveMode === 'month' ? '1M' : undefined;
  const availableIntervalValues = intervalOptions.filter((item) => !item.disabled).map((item) => item.value);
  const requestedInterval = config.logInterval ?? fixedInterval ?? (effectiveMode === 'day' ? '1d' : '10m');
  const fallbackInterval = fixedInterval
    ?? availableIntervalValues[0]
    ?? intervalOptions[0]?.value
    ?? (effectiveMode === 'day' ? '1d' : '10m');
  const effectiveInterval = fixedInterval ?? (availableIntervalValues.includes(requestedInterval) ? requestedInterval : fallbackInterval);
  const isIntervalAllowed = effectiveMode === 'week' || effectiveMode === 'month'
    ? requestedInterval === effectiveInterval
    : availableIntervalValues.includes(requestedInterval);

  const aggregation = resolveIoTLogAggregationConfig({
    logAggregationMode: effectiveMode,
    logInterval: effectiveInterval,
  });
  const bucketCount = estimateIoTBucketCount(startTime, endTime, aggregation);
  const isOverLimit = bucketCount > maxBuckets;
  const dataSourceStrategy = resolveDataSourceStrategy(effectiveMode, durationMs);
  const requestedModeReason = modeOptions.find((item) => item.value === requestedMode)?.reason;
  const requestedIntervalOption = intervalOptions.find((item) => item.value === requestedInterval);
  const effectiveIntervalOption = intervalOptions.find((item) => item.value === effectiveInterval);
  let correctionHint: string | undefined;

  if (!isModeAllowed) {
    correctionHint = requestedModeReason
      ? editorT('bigscreenEditor.dynamic.message45', { reason: String(requestedModeReason), mode: String(MODE_LABELS[effectiveMode]) })
      : editorT('bigscreenEditor.dynamic.message46', { range: String(TIME_RANGE_LABELS[timeRange]), mode: String(MODE_LABELS[effectiveMode]) });
  } else if (!isIntervalAllowed) {
    if (effectiveMode === 'week' || effectiveMode === 'month') {
      correctionHint = editorT('bigscreenEditor.dynamic.message47', { mode: String(MODE_LABELS[effectiveMode]) });
    } else if (requestedIntervalOption?.disabled) {
      correctionHint = editorT('bigscreenEditor.dynamic.message48', { requested: String(requestedIntervalOption.label), buckets: String(requestedIntervalOption.bucketCount), effective: String(effectiveIntervalOption?.label ?? effectiveInterval) });
    } else {
      correctionHint = editorT('bigscreenEditor.dynamic.message49', { effective: String(effectiveIntervalOption?.label ?? effectiveInterval) });
    }
  }

  return {
    aggregation,
    bucketCount,
    correctionHint,
    dataSourceHint: dataSourceStrategy.hint,
    dataSourceStrategy: dataSourceStrategy.strategy,
    durationMs,
    effectiveInterval,
    effectiveMode,
    endTime,
    intervalOptions,
    isIntervalAllowed,
    isModeAllowed,
    isOverLimit,
    modeOptions,
    preferServerAggregation: dataSourceStrategy.preferServerAggregation,
    serverFallbackAllowed: dataSourceStrategy.serverFallbackAllowed,
    startTime,
    timeAxisLabelFormat: resolveIoTTimeAxisLabelFormat(aggregation, startTime, endTime),
    timeRange,
  };
};

export const getIoTTimeBucketStart = (
  timestamp: number,
  startTime: number,
  aggregation: IoTResolvedAggregationConfig,
) => {
  switch (aggregation.intervalUnit) {
    case 'm': {
      const bucketMs = aggregation.interval * MINUTE_MS;
      return startTime + Math.floor((timestamp - startTime) / bucketMs) * bucketMs;
    }
    case 'h': {
      const bucketMs = aggregation.interval * HOUR_MS;
      return startTime + Math.floor((timestamp - startTime) / bucketMs) * bucketMs;
    }
    case 'd': {
      const anchor = startOfLocalDay(startTime);
      const bucketMs = aggregation.interval * DAY_MS;
      return anchor + Math.floor((timestamp - anchor) / bucketMs) * bucketMs;
    }
    case 'w': {
      return startOfLocalWeek(timestamp);
    }
    case 'M': {
      return startOfLocalMonth(timestamp);
    }
    default: {
      return timestamp;
    }
  }
};

export const formatIoTBucketTimeValue = (bucketStart: number) => new Date(bucketStart).toISOString().slice(0, 19);

export const resolveIoTTimeAxisLabelFormat = (
  aggregation: IoTResolvedAggregationConfig,
  startTime: number,
  endTime: number,
): IoTTimeAxisLabelFormat => {
  if (aggregation.mode === 'month') return 'month';
  if (aggregation.mode === 'day' || aggregation.mode === 'week') return 'date';
  return endTime - startTime > DAY_MS ? 'datetime' : 'time';
};

export const formatIoTTimeAxisLabel = (value: unknown, format: IoTTimeAxisLabelFormat) => {
  const date = new Date(typeof value === 'number' ? value : String(value));
  if (Number.isNaN(date.getTime())) return String(value ?? '');

  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  switch (format) {
    case 'datetime':
      return `${month}-${day} ${hours}:${minutes}`;
    case 'date':
      return `${month}-${day}`;
    case 'month':
      return editorT('bigscreenEditor.dynamic.message50', { month: String(date.getMonth() + 1) });
    case 'year':
      return `${date.getFullYear()}`;
    case 'time':
    default:
      return `${hours}:${minutes}`;
  }
};

export const estimateIoTBucketCount = (
  startTime: number,
  endTime: number,
  aggregation: IoTResolvedAggregationConfig,
) => {
  if (endTime <= startTime) return 0;

  switch (aggregation.intervalUnit) {
    case 'm':
      return Math.ceil((endTime - startTime) / (aggregation.interval * MINUTE_MS));
    case 'h':
      return Math.ceil((endTime - startTime) / (aggregation.interval * HOUR_MS));
    case 'd':
      return Math.ceil((endTime - startTime) / (aggregation.interval * DAY_MS));
    case 'w':
      return Math.ceil((endTime - startTime) / (7 * DAY_MS));
    case 'M': {
      const start = new Date(startTime);
      const end = new Date(endTime);
      return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    }
    default:
      return 0;
  }
};
