/** 单值图表取值与进度格式化；已指定字段为空时不寻找其他字段或旧样本冒充。 */
import { resolveCandidateFields } from '@/packages/components/shared/iotMappingResolver';

export type ProgressValueMode = 'fraction' | 'percent' | 'range';

export interface ProgressValueOptions {
  valueMode?: ProgressValueMode;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  displayDecimals?: number;
  clamp?: boolean;
}

export interface NormalizedProgressValue {
  rawValue: number;
  ratio: number;
  percentage: number;
  displayValue: number;
}

type SingleValueChartConfigLike = {
  option?: {
    _simplifiedData?: {
      mappings?: {
        value?: string;
        y?: string | string[];
      };
    };
  };
  request?: {
    requestIoTDeviceConfig?: {
      mapping?: {
        mappingMode?: string;
        valueField?: string;
        yFields?: string[];
      };
    };
  };
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const safeToNumber = (value: unknown) => {
  const nextValue = typeof value === 'number' ? value : Number.parseFloat(`${value ?? 0}`);
  return Number.isFinite(nextValue) ? nextValue : 0;
};

const SINGLE_VALUE_IGNORE_FIELDS = new Set([
  '_timestamp',
  'agg',
  'date',
  'datetime',
  'device',
  'key',
  'metric',
  'name',
  'status',
  'time',
  'timestamp',
  'timeWindow',
  '时间',
]);

const NUMERIC_STRING_RE = /^-?\d+(?:\.\d+)?$/;
const DATEISH_STRING_RE = /^\d{4}-\d{1,2}(?:-\d{1,2})?(?:[ T].*)?$/;

const tryReadNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed || DATEISH_STRING_RE.test(trimmed) || !NUMERIC_STRING_RE.test(trimmed)) {
    return undefined;
  }

  const nextValue = Number(trimmed);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

const getCandidateFields = (chartConfig?: SingleValueChartConfigLike): string[] => {
  const mappings = chartConfig?.option?._simplifiedData?.mappings;
  const requestMapping = chartConfig?.request?.requestIoTDeviceConfig?.mapping;

  return resolveCandidateFields(requestMapping, mappings);
};

const getDatasetRow = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object') return undefined;

  const source = (value as { source?: unknown }).source;
  if (!Array.isArray(source)) return undefined;

  const rows = source.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
  );

  return rows.at(-1) ?? rows[0];
};

const getDatasetFields = (payload: Record<string, unknown>, row: Record<string, unknown>) => {
  const dimensions = payload.dimensions;
  return Array.isArray(dimensions) ? dimensions.map(String) : Object.keys(row);
};

const extractSingleMetricValueInternal = (value: unknown, chartConfig?: SingleValueChartConfigLike): number | undefined => {
  const directValue = tryReadNumber(value);
  if (directValue !== undefined) return directValue;

  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      const nextValue = extractSingleMetricValueInternal(value[index], chartConfig);
      if (nextValue !== undefined) return nextValue;
    }
    return undefined;
  }

  if (!value || typeof value !== 'object') return undefined;

  const record = value as Record<string, unknown>;
  if ('dataset' in record) {
    return extractSingleMetricValueInternal(record.dataset, chartConfig);
  }

  const row = getDatasetRow(record);
  if (row) {
    const candidates = getCandidateFields(chartConfig);
    for (const field of candidates) {
      const mappedValue = tryReadNumber(row[field]);
      if (mappedValue !== undefined) return mappedValue;
    }

    // 映射字段存在但无值时保留空缺，禁止借用其他字段。
    if (candidates.some((field) => field in row)) return undefined;
    for (const field of getDatasetFields(record, row)) {
      if (SINGLE_VALUE_IGNORE_FIELDS.has(field)) continue;
      const nextValue = tryReadNumber(row[field]);
      if (nextValue !== undefined) return nextValue;
    }
    return undefined;
  }

  for (const field of ['value', 'count', 'total', 'num', 'amount']) {
    const nextValue = extractSingleMetricValueInternal(record[field], chartConfig);
    if (nextValue !== undefined) return nextValue;
  }

  for (const [field, fieldValue] of Object.entries(record)) {
    if (SINGLE_VALUE_IGNORE_FIELDS.has(field)) continue;
    const nextValue = tryReadNumber(fieldValue);
    if (nextValue !== undefined) return nextValue;
  }

  for (const [field, fieldValue] of Object.entries(record)) {
    if (SINGLE_VALUE_IGNORE_FIELDS.has(field)) continue;
    const nextValue = extractSingleMetricValueInternal(fieldValue, chartConfig);
    if (nextValue !== undefined) return nextValue;
  }

  return undefined;
};

const formatNumber = (value: number, digits = 2) => {
  const safeDigits = Math.max(0, digits);
  return `${Number(value.toFixed(safeDigits))}`;
};

/** extractNullableSingleMetricValue 保留无有效数据的空值，供数值卡显示空缺。 */
export function extractNullableSingleMetricValue(value: unknown, chartConfig?: SingleValueChartConfigLike): number | null {
  return extractSingleMetricValueInternal(value, chartConfig) ?? null;
}

export function extractSingleMetricValue(value: unknown, chartConfig?: SingleValueChartConfigLike) {
  return extractSingleMetricValueInternal(value, chartConfig) ?? 0;
}

export function normalizeProgressValue(value: unknown, options: ProgressValueOptions = {}): NormalizedProgressValue {
  const rawValue = safeToNumber(value);
  const valueMode = options.valueMode ?? 'percent';
  const shouldClamp = options.clamp ?? true;

  let ratio = 0;
  let displayValue = rawValue;

  if (valueMode === 'fraction') {
    ratio = rawValue;
    displayValue = rawValue * 100;
  } else if (valueMode === 'percent') {
    ratio = rawValue / 100;
    displayValue = rawValue;
  } else {
    const minValue = safeToNumber(options.minValue ?? 0);
    const maxValue = safeToNumber(options.maxValue ?? 100);
    const span = maxValue - minValue;
    ratio = span === 0 ? 0 : (rawValue - minValue) / span;
    displayValue = rawValue;
  }

  const normalizedRatio = shouldClamp ? clamp(ratio) : ratio;

  return {
    rawValue,
    ratio: normalizedRatio,
    percentage: normalizedRatio * 100,
    displayValue,
  };
}

export function formatProgressDisplay(value: unknown, options: ProgressValueOptions = {}) {
  const normalized = normalizeProgressValue(value, options);
  const unit = options.unit ?? '';
  const displayDecimals = options.displayDecimals ?? 2;
  return `${formatNumber(normalized.displayValue, displayDecimals)}${unit}`;
}

export function getAutoScaleMax(value: number) {
  const absValue = Math.abs(value);
  if (absValue <= 100) return 100;

  const magnitude = 10 ** Math.floor(Math.log10(absValue));
  const normalized = absValue / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}
