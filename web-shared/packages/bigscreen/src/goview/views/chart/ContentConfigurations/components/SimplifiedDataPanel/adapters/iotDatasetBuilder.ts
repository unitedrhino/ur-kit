/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
/** IoT 数据集构建：原始数值保留缺口，所有前端聚合仅计算质量良好的样本。 */
/* eslint-disable @typescript-eslint/no-non-null-assertion, unicorn/no-useless-switch-case */

import type { RequestIoTDeviceConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';

import type { IoTMetadata } from './types';

import { goodPropertyNumber, nullablePropertyNumber, propertyQualityLabel } from '@vben/saas/utils';

import { useProjectStore } from '@vben/stores';

import {
  getDeviceInfoOne,
  getDeviceList,
  getPropertyLatest,
  getPropertyLogAgg,
  getPropertyLogBatch,
  getPropertyLogList,
  getUserAreaTree,
} from '@/api/thingsDevice';
import { getIoTDeviceInfoFieldDisplayLabel, getIoTDeviceInfoFieldSemanticValue } from '@/utils/iotDeviceInfoFieldMeta';

import { getChartExpectation } from './chartConfigMatrix';
import { formatIoTBucketTimeValue, getIoTTimeBucketStart, MAX_IOT_TIME_BUCKETS, resolveIoTAggregationRuleState, resolveIoTLogAggregationConfig, type IoTResolvedAggregationConfig } from './iotAggregation';
import { buildColumnName } from './iotSeriesParser';
import { combineAreaValuesForSingleStat, resolveSingleStatBucketConfig } from './iotTemplateAggregation';

export interface IoTDatasetResult {
  _iotMeta: IoTMetadata;
  dimensions: string[];
  source: Record<string, any>[];
}

type LogStats = {
  count: number;
  lastTs: number;
  lastValue: number;
  max: number;
  min: number;
  sum: number;
};

type AreaTreeIndex = {
  childMap: Map<string, string[]>;
  nameMap: Map<string, string>;
};

type QueryType = 'deviceInfo' | 'deviceStatus' | 'property';
type PropertyView = 'device' | 'prop';

const EMPTY_TIME_DATASET = { dimensions: ['time'], source: [] as Record<string, any>[] };
type DeviceStatusFieldKey = 'inactiveCount' | 'inactiveRate' | 'offlineCount' | 'offlineRate' | 'onlineCount' | 'onlineRate' | 'totalCount';
const SYSTEM_UPTIME_FIELD_ORDER = ['systemUptimeDays', 'systemUptimeHours', 'systemUptimeSeconds', 'systemStartTime'] as const;
type SystemUptimeFieldKey = (typeof SYSTEM_UPTIME_FIELD_ORDER)[number];
const DEVICE_STATUS_METRIC_LABELS: Record<DeviceStatusFieldKey | SystemUptimeFieldKey, string> = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get inactiveCount() { return editorT('bigscreenEditor.ui.inactiveDevices'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get inactiveRate() { return editorT('bigscreenEditor.ui.inactiveRate'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get offlineCount() { return editorT('bigscreenEditor.ui.offlineDevices'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get offlineRate() { return editorT('bigscreenEditor.ui.offlineRate'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get onlineCount() { return editorT('iotApp.project.onlineDevices'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get onlineRate() { return editorT('orgEnergy.ui.onlineRate'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get systemStartTime() { return editorT('bigscreenEditor.ui.systemStartTime'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get systemUptimeDays() { return editorT('bigscreenEditor.ui.systemUptimeDays'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get systemUptimeHours() { return editorT('bigscreenEditor.ui.systemUptimeHours'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get systemUptimeSeconds() { return editorT('bigscreenEditor.ui.systemUptimeSeconds'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get totalCount() { return editorT('orgPark.ui.totalDevices'); },
};

export function normalizeDeviceNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && !!item);
  }
  if (typeof value === 'string' && value) {
    return [value];
  }
  return [];
}

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

export function hasMeaningfulValue(value: unknown) {
  return value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null';
}

export function normalizeTimestampLike(value: unknown): null | number {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function resolveIoTProductFilter(cfg: RequestIoTDeviceConfigType) {
  if (cfg.productCategoryCode) {
    return {
      productCategoryCode: cfg.productCategoryCode,
      ...(hasMeaningfulValue(cfg.productCategoryID) ? { productCategoryID: Number(cfg.productCategoryID) } : {}),
    };
  }
  if (cfg.productID) {
    return { productID: cfg.productID };
  }
  return {};
}

export function normalizeRankingGroupBy(groupBy?: string) {
  switch (groupBy) {
    case 'area':
    case 'device': {
      return groupBy;
    }
    default: {
      return 'device';
    }
  }
}

export function normalizeAreaTreeNodeLabel(node: Record<string, any>) {
  return String(node.areaName || node.name || node.label || node.areaID || '').trim();
}

const areaTreeIndexPromiseMap = new Map<string, Promise<AreaTreeIndex>>();

async function loadAreaTreeIndex(projectID?: string) {
  const cacheKey = String(projectID ?? '__default__');
  const cached = areaTreeIndexPromiseMap.get(cacheKey);
  if (cached) return cached;

  const nextPromise = (async () => {
    try {
      const res: any = await getUserAreaTree(projectID ? { projectID } : undefined);
      const list = Array.isArray(res?.data?.list) ? res.data.list : [];
      const nameMap = new Map<string, string>();
      const childMap = new Map<string, string[]>();

      const walk = (nodes: any[], parentID = '') => {
        nodes.forEach((node) => {
          if (!node || typeof node !== 'object') return;
          const areaID = String(node.areaID ?? node.id ?? '').trim();
          if (!areaID) return;

          const label = normalizeAreaTreeNodeLabel(node);
          if (label) {
            nameMap.set(areaID, label);
          }

          if (parentID) {
            const children = childMap.get(parentID) ?? [];
            children.push(areaID);
            childMap.set(parentID, children);
          }

          const nestedChildren = Array.isArray(node.children) ? node.children : [];
          if (nestedChildren.length > 0) {
            walk(nestedChildren, areaID);
          }
        });
      };

      walk(list);
      return { childMap, nameMap };
    } catch {
      areaTreeIndexPromiseMap.delete(cacheKey);
      return { childMap: new Map<string, string[]>(), nameMap: new Map<string, string>() };
    }
  })();

  areaTreeIndexPromiseMap.set(cacheKey, nextPromise);
  return nextPromise;
}

async function buildAreaNameMap(projectID?: string) {
  try {
    const { nameMap } = await loadAreaTreeIndex(projectID);
    return nameMap;
  } catch {
    return new Map<string, string>();
  }
}

async function expandAreaScope(areaIDs: string[], projectID?: string) {
  const normalizedIDs = areaIDs.map(String).filter(Boolean);
  if (normalizedIDs.length === 0) return [];

  try {
    const { childMap } = await loadAreaTreeIndex(projectID);
    const expanded = new Set<string>();
    const stack = [...normalizedIDs];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || expanded.has(current)) continue;
      expanded.add(current);
      const children = childMap.get(current) ?? [];
      children.forEach((childID) => {
        if (!expanded.has(childID)) stack.push(childID);
      });
    }

    return [...expanded];
  } catch {
    return normalizedIDs;
  }
}

function resolveDevicesProjectID(devices: any[]) {
  const projectIDs = devices
    .map((item) => String(item?.projectID ?? '').trim())
    .filter(Boolean);
  return projectIDs[0] || undefined;
}

function resolveRankingGroupLabel(deviceEntry: any, groupBy: string, areaNameMap?: Map<string, string>) {
  if (groupBy === 'area') {
    const areaID = String(deviceEntry?.areaID ?? '').trim();
    if (areaID) {
      return areaNameMap?.get(areaID) || areaID;
    }
    return editorT('bigscreenEditor.ui.unassignedArea');
  }

  const deviceAlias = String(deviceEntry?.deviceAlias ?? '').trim();
  if (deviceAlias) {
    return deviceAlias;
  }

  const deviceName = String(deviceEntry?.deviceName ?? '').trim();
  if (deviceName) {
    return deviceName;
  }
  return 'unknown';
}

function resolvePropertyView(cfg: RequestIoTDeviceConfigType): PropertyView {
  return (cfg.deviceNames?.length ?? 0) > 1 ? 'device' : 'prop';
}

export function timeRangeToMs(range?: string): number {
  const map: Record<string, number> = {
    '1h': 3_600_000,
    '6h': 21_600_000,
    '24h': 86_400_000,
    '7d': 604_800_000,
    '30d': 2_592_000_000,
  };
  return map[range ?? ''] ?? 3_600_000;
}

function getActualTimeRange(cfg: RequestIoTDeviceConfigType) {
  if (cfg.logTimeRange === 'custom' && cfg.customTimeRange?.length === 2) {
    return {
      endTime: cfg.customTimeRange[1],
      startTime: cfg.customTimeRange[0],
    };
  }

  const now = Date.now();
  const duration = timeRangeToMs(cfg.logTimeRange);
  return {
    endTime: now,
    startTime: now - duration,
  };
}

export function parseLogTimestamp(raw: any): null | number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (/^\d+$/.test(String(raw ?? ''))) return Number(raw);

  const parsed = Date.parse(String(raw ?? ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatLogTime(raw: unknown): string {
  const timestamp = parseLogTimestamp(raw);
  if (timestamp !== null) {
    return new Date(timestamp).toISOString().slice(0, 19);
  }
  return String(raw ?? '').slice(0, 19);
}

function toServerIntervalUnit(intervalUnit: IoTResolvedAggregationConfig['intervalUnit']) {
  return intervalUnit === 'M' ? 'n' : intervalUnit;
}

export function sortTimeRowsAsc(rows: Record<string, any>[]) {
  return rows.sort((a, b) => {
    const timeA = parseLogTimestamp(a.time) ?? 0;
    const timeB = parseLogTimestamp(b.time) ?? 0;
    return timeA - timeB;
  });
}

/** 聚合仅使用已累计的有效样本；无样本只有 count 返回零。 */
export function aggregateBucketValue(aggFunc: string, stats: LogStats): number | null {
  if (aggFunc === 'count') return stats.count;
  if (stats.count === 0) return null;
  switch (aggFunc) {
    case 'sum': return stats.sum;
    case 'avg': return stats.sum / stats.count;
    case 'max': return stats.max;
    case 'min': return stats.min;
    default: return stats.lastValue;
  }
}

function getFullRangeAggInterval(startTime: number, endTime: number) {
  return Math.max(1, endTime - startTime);
}

export function createEmptyLogStats(): LogStats {
  return {
    count: 0,
    lastTs: Number.NEGATIVE_INFINITY,
    lastValue: 0,
    max: Number.NEGATIVE_INFINITY,
    min: Number.POSITIVE_INFINITY,
    sum: 0,
  };
}

/** 空值不计入分母或极值，调用方先按质量筛选原始样本。 */
export function mergeLogPoint(stats: LogStats, rawValue: unknown, rawTimestamp: unknown) {
  const value = nullablePropertyNumber(rawValue);
  if (value === null) return;
  const timestamp = parseLogTimestamp(rawTimestamp) ?? Number.NEGATIVE_INFINITY;
  stats.count += 1;
  stats.sum += value;
  stats.max = Math.max(stats.max, value);
  stats.min = Math.min(stats.min, value);
  if (timestamp >= stats.lastTs) {
    stats.lastTs = timestamp;
    stats.lastValue = value;
  }
}

async function fetchBatchLogsByDevice(cfg: RequestIoTDeviceConfigType, deviceNames: string[], dataIDs: string[], startTime: number, endTime: number) {
  const perDevice: Record<string, any[]> = {};
  const productFilter = resolveIoTProductFilter(cfg);

  await Promise.all(
    deviceNames.map(async (deviceName) => {
      try {
        const res = await getPropertyLogBatch({
          dataIDs,
          deviceName,
          endTime,
          ...productFilter,
          startTime,
        });
        perDevice[deviceName] = (res?.data?.lists?.flat() ?? res?.data?.list ?? []).filter((item: any) => item && typeof item === 'object');
      } catch {
        perDevice[deviceName] = [];
      }
    }),
  );

  return perDevice;
}

function buildAggregatedLogDatasetFromBatchMap(
  perDevice: Record<string, any[]>,
  deviceNames: string[],
  dataIDNames: Record<string, string> | undefined,
  deviceCount: number,
  propCount: number,
  aggFunc: string,
  startTime: number,
  aggregation: ReturnType<typeof resolveIoTLogAggregationConfig>,
) {
  const colNamesSet = new Set<string>();
  const rowMap = new Map<number, Record<string, any>>();
  const statMap = new Map<string, LogStats>();

  for (const deviceName of deviceNames) {
    for (const item of perDevice[deviceName] ?? []) {
      const timestamp = parseLogTimestamp(item.time ?? item.timestamp);
      if (timestamp === null) continue;

      const bucketStart = getIoTTimeBucketStart(timestamp, startTime, aggregation);
      if (!rowMap.has(bucketStart)) {
        rowMap.set(bucketStart, { time: formatIoTBucketTimeValue(bucketStart) });
      }

      const dataID = item.dataID ?? '';
      const propName = item.dataName || dataIDNames?.[dataID] || dataID;
      const colName = buildColumnName(deviceName, propName, deviceCount, propCount);
      const statKey = `${bucketStart}__${colName}`;
      const value = goodPropertyNumber(item);
      const stats = statMap.get(statKey) ?? createEmptyLogStats();

      mergeLogPoint(stats, value, timestamp);

      statMap.set(statKey, stats);
      colNamesSet.add(colName);
    }
  }

  for (const [statKey, stats] of statMap.entries()) {
    const separatorIndex = statKey.indexOf('__');
    const bucketStart = Number(statKey.slice(0, separatorIndex));
    const colName = statKey.slice(separatorIndex + 2);
    const row = rowMap.get(bucketStart);
    if (!row) continue;
    row[colName] = aggregateBucketValue(aggFunc, stats);
  }

  const source = sortTimeRowsAsc([...rowMap.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row));

  return source.length > 0 ? { dimensions: ['time', ...colNamesSet], source } : EMPTY_TIME_DATASET;
}

function buildAggregatedLogDatasetFromAggResponse(
  list: any[],
  fallbackDeviceNames: string[],
  dataIDNames: Record<string, string> | undefined,
  deviceCount: number,
  propCount: number,
  aggFunc: string,
) {
  if (!Array.isArray(list) || list.length === 0) return EMPTY_TIME_DATASET;

  const timeMap = new Map<string, Record<string, any>>();
  const colNamesSet = new Set<string>();

  list.forEach((deviceEntry: any, index: number) => {
    const deviceName = deviceEntry?.deviceName || fallbackDeviceNames[index] || fallbackDeviceNames[0] || '';
    for (const timePoint of deviceEntry?.values ?? []) {
      const timeValue = formatLogTime(timePoint?.timeWindow);
      if (!timeMap.has(timeValue)) timeMap.set(timeValue, { time: timeValue });

      const row = timeMap.get(timeValue)!;
      const dataID = timePoint?.dataID ?? '';
      const propName = timePoint?.dataName || dataIDNames?.[dataID] || dataID;
      const colName = buildColumnName(deviceName, propName, deviceCount, propCount);
      row[colName] = nullablePropertyNumber(timePoint?.values?.[aggFunc]?.value);
      colNamesSet.add(colName);
    }
  });

  const source = sortTimeRowsAsc([...timeMap.values()]);
  return source.length > 0 ? { dimensions: ['time', ...colNamesSet], source } : EMPTY_TIME_DATASET;
}

async function fetchServerAggregatedLogDataset(params: {
  aggFunc: string;
  aggregation: IoTResolvedAggregationConfig;
  dataIDNames?: Record<string, string>;
  dataIDs: string[];
  deviceCount: number;
  deviceNames: string[];
  endTime: number;
  productCategoryCode?: string;
  productCategoryID?: number | string;
  productID?: string;
  startTime: number;
}) {
  const res = await getPropertyLogAgg({
    aggs: params.dataIDs.map((dataID) => ({ argFuncs: [params.aggFunc], dataID })),
    deviceNames: params.deviceNames,
    interval: params.aggregation.interval,
    intervalUnit: toServerIntervalUnit(params.aggregation.intervalUnit),
    ...(params.productID ? { productID: params.productID } : {}),
    ...(params.productCategoryCode ? { productCategoryCode: params.productCategoryCode } : {}),
    ...(params.productCategoryID !== undefined && params.productCategoryID !== null && params.productCategoryID !== ''
      ? { productCategoryID: Number(params.productCategoryID) }
      : {}),
    timeEnd: params.endTime,
    timeStart: params.startTime,
  });
  const list: any[] = res?.data?.list ?? [];
  if (list.length === 0) return EMPTY_TIME_DATASET;

  return buildAggregatedLogDatasetFromAggResponse(list, params.deviceNames, params.dataIDNames, params.deviceCount, params.dataIDs.length, params.aggFunc);
}

async function fetchWholeRangeLogAgg(params: {
  aggFunc: string;
  areaIDs?: number[];
  dataID: string;
  deviceNames?: string[];
  endTime: number;
  partitionBy?: string;
  productCategoryCode?: string;
  productCategoryID?: number | string;
  productID?: string;
  startTime: number;
}) {
  const res = await getPropertyLogAgg({
    aggs: [{ argFuncs: [params.aggFunc], dataID: params.dataID }],
    areaIDs: params.areaIDs?.length ? params.areaIDs : undefined,
    deviceNames: params.deviceNames?.length ? params.deviceNames : undefined,
    interval: getFullRangeAggInterval(params.startTime, params.endTime),
    intervalUnit: 'a',
    partitionBy: params.partitionBy,
    ...(params.productID ? { productID: params.productID } : {}),
    ...(params.productCategoryCode ? { productCategoryCode: params.productCategoryCode } : {}),
    ...(hasMeaningfulValue(params.productCategoryID) ? { productCategoryID: Number(params.productCategoryID) } : {}),
    timeEnd: params.endTime,
    timeStart: params.startTime,
  });

  return Array.isArray(res?.data?.list) ? res.data.list : [];
}

async function fetchPartitionedPropertyLogDataset(params: {
  aggFunc: string;
  areaIDs?: number[];
  dataID: string;
  endTime: number;
  partitionBy?: string;
  productCategoryCode?: string;
  productCategoryID?: number | string;
  productID?: string;
  startTime: number;
}) {
  const bucket = resolveSingleStatBucketConfig(params.startTime, params.endTime);
  const res = await getPropertyLogList({
    areaIDs: params.areaIDs,
    argFunc: params.aggFunc,
    dataID: params.dataID,
    fill: 'NULL', // 无有效样本时保留缺口，禁止插值生成测量值。
    interval: bucket.interval,
    intervalUnit: bucket.intervalUnit,
    pageSize: 1000,
    partitionBy: params.partitionBy,
    ...(params.productID ? { productID: params.productID } : {}),
    ...(params.productCategoryCode ? { productCategoryCode: params.productCategoryCode } : {}),
    ...(hasMeaningfulValue(params.productCategoryID) ? { productCategoryID: params.productCategoryID } : {}),
    timeEnd: params.endTime,
    timeStart: params.startTime,
  });
  return {
    bucket,
    list: Array.isArray(res?.data?.list) ? res.data.list : [],
  };
}

async function fetchDevicesByScope(cfg: RequestIoTDeviceConfigType) {
  const params: {
    areaID?: string;
    areaIDs?: string[];
    page: { page: number; size: number };
    productCategoryCode?: string;
    productCategoryID?: number;
    productID?: string;
  } = {
    page: { page: 1, size: 1000 },
    ...resolveIoTProductFilter(cfg),
  };

  const areaIDs = await expandAreaScope(normalizeStringArray(cfg.areaIDs));
  if (areaIDs.length === 1) {
    params.areaID = areaIDs[0];
  } else if (areaIDs.length > 1) {
    params.areaIDs = areaIDs;
  }

  const res = await getDeviceList(params);
  const devices = [...(res?.data?.list ?? [])];
  const selectedNames = normalizeDeviceNames(cfg.deviceNames);
  if (selectedNames.length === 0) return devices;

  const selectedSet = new Set(selectedNames);
  return devices.filter((item: any) => selectedSet.has(item.deviceName));
}

/** 状态计数使用固定内部键，展示标签单独翻译，避免语言切换影响统计值。 */
function normalizeDeviceStatusLabel(raw: any) {
  const value = String(raw ?? '').toLowerCase();
  if (value === '2' || value === 'online' || value === 'true') return '在线';
  if (value === '3' || value === 'offline' || value === 'false') return '离线';
  return '未激活';
}

function buildDeviceStatusSummaryRow(counters: Record<'在线' | '未激活' | '离线', number>) {
  const totalCount = counters['在线'] + counters['离线'] + counters['未激活'];
  const safeRate = (value: number) => (totalCount > 0 ? value / totalCount : 0);
  return {
    totalCount,
    onlineCount: counters['在线'],
    offlineCount: counters['离线'],
    inactiveCount: counters['未激活'],
    onlineRate: safeRate(counters['在线']),
    offlineRate: safeRate(counters['离线']),
    inactiveRate: safeRate(counters['未激活']),
  };
}

function getDeviceStatusMetricDisplayLabel(field: string) {
  return DEVICE_STATUS_METRIC_LABELS[field as DeviceStatusFieldKey | SystemUptimeFieldKey] || field;
}

function shouldIncludeSystemUptimeMetrics(selectedFields?: string[]) {
  return (selectedFields ?? []).some((field) => SYSTEM_UPTIME_FIELD_ORDER.includes(field as SystemUptimeFieldKey));
}

function normalizeUnixSeconds(value: unknown) {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0;
}

function normalizeUnixMilliseconds(value: unknown) {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 0;
}

function formatUnixSeconds(value: number) {
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (segment: number) => String(segment).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function buildSystemUptimeSummaryRow() {
  try {
    const projectStore = useProjectStore();
    const projectInfo = projectStore.currentProject;
    const createdTimeMs = normalizeUnixMilliseconds(projectInfo?.createdTime);
    if (createdTimeMs <= 0) {
      return {
        systemStartTime: null,
        systemUptimeDays: null,
        systemUptimeHours: null,
        systemUptimeSeconds: null,
      };
    }

    const nowMs = Date.now();
    const uptimeSeconds = Math.max(0, Math.floor((nowMs - createdTimeMs) / 1000));
    const days = Math.floor(uptimeSeconds / 86_400);
    const hours = Math.floor((uptimeSeconds % 86_400) / 3600);
    const startTime = Math.floor(createdTimeMs / 1000);

    return {
      systemStartTime: startTime > 0 ? formatUnixSeconds(startTime) : null,
      systemUptimeDays: days,
      systemUptimeHours: hours,
      systemUptimeSeconds: uptimeSeconds,
    };
  } catch (error) {
    console.warn('[buildSystemUptimeSummaryRow] 获取项目创建时间失败:', error);
    return {
      systemStartTime: null,
      systemUptimeDays: null,
      systemUptimeHours: null,
      systemUptimeSeconds: null,
    };
  }
}

function pickSelectedFieldRow<T extends Record<string, any>>(row: T, selectedFields?: string[]) {
  const availableKeys = Object.keys(row);
  const targetKeys = Array.isArray(selectedFields) && selectedFields.length > 0 ? selectedFields.filter((field) => availableKeys.includes(field)) : [];

  const pickedRow: Record<string, any> = {};
  const displayDimensions: string[] = [];
  targetKeys.forEach((field) => {
    pickedRow[field] = row[field];
    displayDimensions.push(field);
  });

  return {
    dimensions: displayDimensions,
    row: pickedRow,
  };
}

function buildNamedFieldDataset<T extends Record<string, any>>(
  row: T,
  selectedFields: string[] | undefined,
  label: string,
  formatFieldLabel?: (field: string) => string,
) {
  const { dimensions, row: pickedRow } = pickSelectedFieldRow(row, selectedFields);
  if (!formatFieldLabel) {
    return {
      dimensions: ['name', ...dimensions],
      source: [{ name: label, ...pickedRow }],
    };
  }

  const formattedRow: Record<string, any> = {};
  const formattedDimensions = dimensions.map((field) => {
    const displayField = formatFieldLabel(field);
    formattedRow[displayField] = pickedRow[field];
    return displayField;
  });

  return {
    dimensions: ['name', ...formattedDimensions],
    source: [{ name: label, ...formattedRow }],
  };
}

function buildLongFieldDataset<T extends Record<string, any>>(row: T, selectedFields: string[] | undefined, formatFieldLabel?: (field: string) => string) {
  const { dimensions, row: pickedRow } = pickSelectedFieldRow(row, selectedFields);
  return {
    dimensions: ['name', 'value'],
    source: dimensions.map((field) => ({
      name: formatFieldLabel ? formatFieldLabel(field) : field,
      value: pickedRow[field],
    })),
  };
}

function shouldUseNameValueOutput(chartKey: string) {
  return getChartExpectation(chartKey).mappingMode === 'nameValue';
}

function normalizeDeviceInfoFields(deviceInfo: Record<string, any>) {
  const row: Record<string, any> = {};

  Object.entries(deviceInfo).forEach(([field, value]) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      row[field] = getIoTDeviceInfoFieldSemanticValue(field, value);
      return;
    }

    if (typeof value === 'boolean') {
      row[field] = getIoTDeviceInfoFieldSemanticValue(field, value ? 1 : 0);
    }
  });

  return row;
}

async function buildDeviceStatusDataset(cfg: RequestIoTDeviceConfigType, chartKey: string): Promise<IoTDatasetResult> {
  const counters: Record<'在线' | '未激活' | '离线', number> = {
    在线: 0,
    离线: 0,
    未激活: 0,
  };

  const devices = await fetchDevicesByScope(cfg);
  devices.forEach((device: any) => {
    const statusLabel = normalizeDeviceStatusLabel(device?.deviceStatus ?? device?.status ?? device?.isOnline);
    counters[statusLabel as keyof typeof counters] += 1;
  });

  const outputView = 'fields';
  const statusSummary = buildDeviceStatusSummaryRow(counters);
  const summaryMetrics =
    outputView === 'fields' && shouldIncludeSystemUptimeMetrics(cfg.selectedFields)
      ? {
          ...statusSummary,
          ...(await buildSystemUptimeSummaryRow()),
        }
      : statusSummary;

  if (outputView === 'fields') {
    if (!cfg.selectedFields?.length) {
      throw new Error(editorT('bigscreenEditor.ui.selectAtLeastOneDeviceStatusMetric'));
    }

    const fieldDataset = shouldUseNameValueOutput(chartKey)
      ? buildLongFieldDataset(summaryMetrics, cfg.selectedFields, getDeviceStatusMetricDisplayLabel)
      : buildNamedFieldDataset(summaryMetrics, cfg.selectedFields, editorT('bigscreenEditor.ui.statusStatistics'), getDeviceStatusMetricDisplayLabel);

    return {
      _iotMeta: {
                dataView: 'deviceStatus',
        mode: 'latest',
        outputView,
      },
      ...fieldDataset,
    };
  }

  return {
    _iotMeta: {
            dataView: 'deviceStatus',
      mode: 'latest',
      outputView,
    },
    ...(shouldUseNameValueOutput(chartKey)
      ? buildLongFieldDataset(summaryMetrics, cfg.selectedFields, getDeviceStatusMetricDisplayLabel)
      : buildNamedFieldDataset(summaryMetrics, cfg.selectedFields, editorT('bigscreenEditor.ui.statusStatistics'), getDeviceStatusMetricDisplayLabel)),
  };
}

async function buildDeviceInfoDataset(cfg: RequestIoTDeviceConfigType, chartKey: string): Promise<IoTDatasetResult> {
  const deviceNames = normalizeDeviceNames(cfg.deviceNames);
  if (deviceNames.length === 0 || !cfg.productID) {
    throw new Error(editorT('bigscreenEditor.ui.selectProductAndAtLeastOneDeviceDeviceInfo'));
  }

  const rows = (
    await Promise.all(
      deviceNames.map(async (deviceName) => {
        const res: any = await getDeviceInfoOne({
          deviceName,
          productID: cfg.productID,
        });

        const deviceInfo = res?.data?.device ?? (res as any)?.device ?? res?.data ?? {};
        const normalizedFields = normalizeDeviceInfoFields(deviceInfo);
        const deviceLabel = String(deviceInfo.deviceAlias ?? deviceInfo.deviceName ?? deviceName);
        return {
          deviceInfo,
          deviceLabel,
          normalizedFields,
        };
      }),
    )
  ).filter((item) => Object.keys(item.normalizedFields).length > 0);

  const firstRow = rows[0];
  if (!firstRow) {
    throw new Error(editorT('bigscreenEditor.ui.deviceInformationReturnedNoUsableFields'));
  }
  const namedDataset = buildNamedFieldDataset(firstRow.normalizedFields, cfg.selectedFields, firstRow.deviceLabel, getIoTDeviceInfoFieldDisplayLabel);
  const finalDimensions = namedDataset.dimensions;

  if (finalDimensions.length <= 1) {
    throw new Error(editorT('bigscreenEditor.ui.selectAtLeastOneDeviceInformationField'));
  }

  if (shouldUseNameValueOutput(chartKey)) {
    const longDataset = buildLongFieldDataset(firstRow.normalizedFields, cfg.selectedFields, getIoTDeviceInfoFieldDisplayLabel);
    if (longDataset.source.length === 0) {
      throw new Error(editorT('bigscreenEditor.ui.selectAtLeastOneDeviceInformationField'));
    }
    return {
      _iotMeta: {
                dataView: 'deviceInfo',
        dimensionLabels: {
          deviceAlias: String(firstRow.deviceInfo.deviceAlias ?? ''),
          deviceName: String(firstRow.deviceInfo.deviceName ?? deviceNames[0] ?? ''),
        },
        mode: 'latest',
        outputView: 'fields',
      },
      dimensions: longDataset.dimensions,
      source: longDataset.source,
    };
  }

  // 过滤未生成数据行的设备（undefined 行对图表无效），保持 source 类型为有效行
  const finalSource = rows
    .map(({ deviceLabel, normalizedFields }) => {
      const { source } = buildNamedFieldDataset(normalizedFields, cfg.selectedFields, deviceLabel, getIoTDeviceInfoFieldDisplayLabel);
      return source[0];
    })
    .filter((row): row is NonNullable<typeof row> => row !== undefined);

  return {
    _iotMeta: {
            dataView: 'deviceInfo',
      dimensionLabels: {
        deviceAlias: '',
        deviceName: '',
      },
      mode: 'latest',
      outputView: 'fields',
    },
    dimensions: finalDimensions,
    source: finalSource,
  };
}

/** 最新值保留异常记录的位置，并附展示警示；非 GOOD 不进入图表数值。 */
function buildPropLatestDataset(deviceName: string, list: any[]) {
  const wideRow: Record<string, any> = { name: deviceName };
  const propNames: string[] = [];

  list.forEach((item: any) => {
    const propName = item.dataName || item.dataID;
    wideRow[propName] = goodPropertyNumber(item);
    propNames.push(propName);
  });

  return {
    dimensions: ['name', ...propNames],
    source: [wideRow],
    qualityWarnings: Object.fromEntries(list.filter((item: any) => propertyQualityLabel(item) !== '良好').map((item: any) => [`${deviceName}:${item.dataID}`, `${item.dataName || item.dataID}：${propertyQualityLabel(item)}`])),
  };
}

/** 原始点按时间对齐；非 GOOD 点保留 null 以阻断曲线。 */
function buildPropRawLogDataset(rawList: any[], dataIDs: string[], dataIDNames: Record<string, string> | undefined) {
  if (rawList.length === 0) return EMPTY_TIME_DATASET;
  const names = new Map<string, string>();
  const rows = new Map<string, Record<string, any>>();
  for (const item of rawList) {
    const id = item.dataID ?? item.identifier;
    if (!dataIDs.includes(id)) continue;
    names.set(id, item.dataName || dataIDNames?.[id] || id);
    const time = formatLogTime(item.time ?? item.timestamp);
    const row = rows.get(time) ?? { time };
    row[names.get(id)!] = goodPropertyNumber(item);
    rows.set(time, row);
  }
  const dimensions = dataIDs.map((id) => names.get(id) || dataIDNames?.[id] || id);
  for (const row of rows.values()) {
    for (const dimension of dimensions) row[dimension] ??= null;
  }
  return { dimensions: ['time', ...dimensions], source: sortTimeRowsAsc([...rows.values()]) };
}

function buildDeviceLatestDataset(cfg: RequestIoTDeviceConfigType, results: Array<Record<string, any>>) {
  const firstResult = results[0];
  const propNames = firstResult ? Object.keys(firstResult).filter((key) => key !== 'device') : cfg.dataIDs;

  return {
    dimensions: ['device', ...propNames],
    source: results,
  };
}

function buildDeviceRawLogDataset(
  perDevice: Record<string, any[]>,
  deviceNames: string[],
  dataIDNames: Record<string, string> | undefined,
  deviceCount: number,
  propCount: number,
) {
  const hasAnyLog = Object.values(perDevice).some((rows) => rows.length > 0);
  if (!hasAnyLog) return EMPTY_TIME_DATASET;

  const timeMap = new Map<string, Record<string, any>>();
  const colNamesSet = new Set<string>();

  for (const deviceName of deviceNames) {
    for (const item of perDevice[deviceName] ?? []) {
      const timeValue = formatLogTime(item.time ?? item.timestamp);
      if (!timeMap.has(timeValue)) timeMap.set(timeValue, { time: timeValue });

      const row = timeMap.get(timeValue)!;
      const dataID = item.dataID ?? '';
      const propName = item.dataName || dataIDNames?.[dataID] || dataID;
      const colName = buildColumnName(deviceName, propName, deviceCount, propCount);
      row[colName] = goodPropertyNumber(item);
      colNamesSet.add(colName);
    }
  }

  const source = sortTimeRowsAsc([...timeMap.values()]);
  return source.length > 0 ? { dimensions: ['time', ...colNamesSet], source } : EMPTY_TIME_DATASET;
}

/** 补齐两个已返回聚合桶之间的缺测桶，避免类目轴把跨日/跨小时的值直接连线。
 * 时间字段由本文件统一格式化为 UTC，无时区后缀仅用于展示，补桶时仍按 UTC 解析。
 */
function retainAggregationGaps(dataset: { dimensions: string[]; source: Record<string, any>[] }, aggregation: IoTResolvedAggregationConfig) {
  if (dataset.source.length < 2 || !dataset.dimensions.includes('time')) return dataset;
  const source: Record<string, any>[] = [];
  const metrics = dataset.dimensions.filter((dimension) => dimension !== 'time');
  for (const row of dataset.source) {
    const previous = source.at(-1);
    if (previous) {
      const cursor = new Date(`${previous.time}Z`);
      const end = Date.parse(`${row.time}Z`);
      // 已有限制最多 300 个时间桶；此处也设上限以防异常时间范围耗尽浏览器资源。
      for (let count = 0; count < MAX_IOT_TIME_BUCKETS; count++) {
        switch (aggregation.intervalUnit) {
          case 'M': cursor.setUTCMonth(cursor.getUTCMonth() + aggregation.interval); break;
          case 'w': cursor.setUTCDate(cursor.getUTCDate() + 7 * aggregation.interval); break;
          case 'd': cursor.setUTCDate(cursor.getUTCDate() + aggregation.interval); break;
          case 'h': cursor.setUTCHours(cursor.getUTCHours() + aggregation.interval); break;
          case 'm': cursor.setUTCMinutes(cursor.getUTCMinutes() + aggregation.interval); break;
        }
        if (!Number.isFinite(cursor.getTime()) || cursor.getTime() >= end) break;
        source.push({ time: formatIoTBucketTimeValue(cursor.getTime()), ...Object.fromEntries(metrics.map((metric) => [metric, null])) });
      }
    }
    source.push(row);
  }
  return { ...dataset, source };
}

async function buildPropertyDataset(cfg: RequestIoTDeviceConfigType, chartKey: string): Promise<IoTDatasetResult> {
  const view = resolvePropertyView(cfg);
  let dataset = view === 'prop' ? await buildPropDataset(cfg, chartKey) : await buildDeviceDataset(cfg, chartKey);
  const aggregationRuleState = cfg.mode === 'log' ? resolveIoTAggregationRuleState(cfg) : null;
  if (aggregationRuleState && cfg.logInterval && cfg.logInterval !== '0' && cfg.aggFunc) {
    dataset = retainAggregationGaps(dataset, aggregationRuleState.aggregation);
  }

  return {
    ...dataset,
    _iotMeta: {
      qualityWarnings: (dataset as any).qualityWarnings,
      dataUnits: cfg.dataUnits,
      dataView: view,
      mode: cfg.mode,
      timeAxisLabelFormat: aggregationRuleState?.timeAxisLabelFormat,
    },
  };
}

async function buildPropDataset(cfg: RequestIoTDeviceConfigType, _chartKey?: string) {
  const deviceName = cfg.deviceNames?.[0] ?? cfg.deviceName ?? '';

  if (cfg.mode === 'latest') {
    const res = await getPropertyLatest({
      dataIDs: cfg.dataIDs,
      deviceName,
      productID: cfg.productID,
    });
    const list: any[] = res?.data?.list ?? [];
    return buildPropLatestDataset(deviceName, list);
  }

  const { endTime, startTime } = getActualTimeRange(cfg);
  const aggFunc = cfg.aggFunc || 'avg';
  const hasAggregation = Boolean(cfg.logInterval && cfg.logInterval !== '0' && cfg.aggFunc);
  if (!hasAggregation) {
    const res = await getPropertyLogBatch({
      dataIDs: cfg.dataIDs,
      deviceName,
      endTime,
      ...resolveIoTProductFilter(cfg),
      startTime,
    });
    const rawList: any[] = (res?.data?.lists?.flat() ?? res?.data?.list ?? res?.data ?? []).filter((item: any) => item && typeof item === 'object');
    return buildPropRawLogDataset(rawList, cfg.dataIDs, cfg.dataIDNames);
  }

  const aggregationRuleState = resolveIoTAggregationRuleState({
    ...cfg,
    maxBuckets: MAX_IOT_TIME_BUCKETS,
  });
  if (aggregationRuleState.isOverLimit) {
    throw new Error(editorT('bigscreenEditor.dynamic.message51', { buckets: String(aggregationRuleState.bucketCount) }));
  }
  const aggregation = aggregationRuleState.aggregation;
  const propCount = cfg.dataIDs.length;
  if (aggregationRuleState.preferServerAggregation) {
    try {
      const serverDataset = await fetchServerAggregatedLogDataset({
        aggFunc,
        aggregation,
        dataIDNames: cfg.dataIDNames,
        dataIDs: cfg.dataIDs,
        deviceCount: 1,
        deviceNames: [deviceName],
        endTime,
        productID: cfg.productID,
        startTime,
      });
      // 全部非 GOOD 或没有样本是合法空结果，必须传给图表清除旧值。
      return serverDataset;
    } catch {
      if (!aggregationRuleState.serverFallbackAllowed) {
        throw new Error(editorT('bigscreenEditor.ui.thisAggregationRequiresBackendButBackendAggregationAPI'));
      }
    }
  }
  const buildFallbackDataset = async () => {
    const res = await getPropertyLogBatch({
      dataIDs: cfg.dataIDs,
      deviceName,
      endTime,
      productID: cfg.productID,
      startTime,
    });
    const rawList: any[] = (res?.data?.lists?.flat() ?? res?.data?.list ?? res?.data ?? []).filter((item: any) => item && typeof item === 'object');
    if (rawList.length === 0) return EMPTY_TIME_DATASET;

    return buildAggregatedLogDatasetFromBatchMap({ [deviceName]: rawList }, [deviceName], cfg.dataIDNames, 1, propCount, aggFunc, startTime, aggregation);
  };

  return await buildFallbackDataset();
}

async function buildDeviceDataset(cfg: RequestIoTDeviceConfigType, _chartKey?: string) {
  if (cfg.mode === 'latest') {
    // 独立元数据不作为数值列，避免图表将质量文字识别为指标。
    const qualityWarnings: Record<string, string> = {};
    const results = await Promise.all(
      cfg.deviceNames.map(async (deviceName: string) => {
        try {
          const res = await getPropertyLatest({
            dataIDs: cfg.dataIDs,
            deviceName,
            productID: cfg.productID,
          });
          const items: any[] = res?.data?.list ?? [];
          const row: Record<string, any> = { device: deviceName };
          cfg.dataIDs.forEach((id: string) => {
            const item = items.find((candidate: any) => candidate.dataID === id);
            const propName = item?.dataName || id;
            row[propName] = goodPropertyNumber(item);
            if (propertyQualityLabel(item) !== '良好') qualityWarnings[`${deviceName}:${id}`] = `${deviceName} ${propName}：${propertyQualityLabel(item)}`;
          });
          return row;
        } catch {
          const row: Record<string, any> = { device: deviceName };
          cfg.dataIDs.forEach((id: string) => {
            row[id] = null;
          });
          return row;
        }
      }),
    );

    return { ...buildDeviceLatestDataset(cfg, results), qualityWarnings };
  }

  const { endTime, startTime } = getActualTimeRange(cfg);
  const deviceCount = cfg.deviceNames.length;
  const propCount = cfg.dataIDs.length;
  const aggFunc = cfg.aggFunc || 'avg';
  const hasAggregation = Boolean(cfg.logInterval && cfg.logInterval !== '0' && cfg.aggFunc);
  if (!hasAggregation) {
    const perDevice = await fetchBatchLogsByDevice(cfg, cfg.deviceNames, cfg.dataIDs, startTime, endTime);
    return buildDeviceRawLogDataset(perDevice, cfg.deviceNames, cfg.dataIDNames, deviceCount, propCount);
  }
  const aggregationRuleState = resolveIoTAggregationRuleState({
    ...cfg,
    maxBuckets: MAX_IOT_TIME_BUCKETS,
  });
  if (aggregationRuleState.isOverLimit) {
    throw new Error(editorT('bigscreenEditor.dynamic.message51', { buckets: String(aggregationRuleState.bucketCount) }));
  }
  const aggregation = aggregationRuleState.aggregation;
  if (aggregationRuleState.preferServerAggregation) {
    try {
      const serverDataset = await fetchServerAggregatedLogDataset({
        aggFunc,
        aggregation,
        dataIDNames: cfg.dataIDNames,
        dataIDs: cfg.dataIDs,
        deviceCount,
        deviceNames: cfg.deviceNames,
        endTime,
        productID: cfg.productID,
        startTime,
      });
      // 全部非 GOOD 或没有样本是合法空结果，必须传给图表清除旧值。
      return serverDataset;
    } catch {
      if (!aggregationRuleState.serverFallbackAllowed) {
        throw new Error(editorT('bigscreenEditor.ui.thisAggregationRequiresBackendButBackendAggregationAPI'));
      }
    }
  }
  const buildFallbackDataset = async () => {
    const perDevice = await fetchBatchLogsByDevice(cfg, cfg.deviceNames, cfg.dataIDs, startTime, endTime);
    const hasAnyLog = Object.values(perDevice).some((rows) => rows.length > 0);
    if (!hasAnyLog) return EMPTY_TIME_DATASET;

    return buildAggregatedLogDatasetFromBatchMap(perDevice, cfg.deviceNames, cfg.dataIDNames, deviceCount, propCount, aggFunc, startTime, aggregation);
  };

  return await buildFallbackDataset();
}

// ── TASK-045 模板级聚合时间范围解析 ──
function resolveTemplateTimeRange(cfg: RequestIoTDeviceConfigType) {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

  switch (cfg.timeRange) {
    case 'custom': {
      if (cfg.customTimeRange?.length === 2) {
        const startTime = normalizeTimestampLike(cfg.customTimeRange[0]);
        const endTime = normalizeTimestampLike(cfg.customTimeRange[1]);
        if (startTime !== null && endTime !== null && endTime >= startTime) {
          return { endTime, startTime };
        }
      }
      return { endTime: endOfToday, startTime: startOfToday };
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      return { endTime: endOfToday, startTime: startOfMonth };
    }
    case 'today': {
      return { endTime: endOfToday, startTime: startOfToday };
    }
    case 'week': {
      const dayOfWeek = now.getDay() || 7;
      const startOfWeek = startOfToday - (dayOfWeek - 1) * 86_400_000;
      return { endTime: endOfToday, startTime: startOfWeek };
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
      return { endTime: endOfToday, startTime: startOfYear };
    }
    case 'yesterday': {
      const startOfYesterday = startOfToday - 86_400_000;
      return { endTime: startOfToday - 1, startTime: startOfYesterday };
    }
    default: {
      return { endTime: endOfToday, startTime: startOfToday };
    }
  }
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(Number).filter((n) => Number.isFinite(n) && n > 0);
}

// ── TASK-045 模板级聚合数据集构建器 ──

async function buildSingleStatDataset(cfg: RequestIoTDeviceConfigType): Promise<any> {
  const { endTime, startTime } = resolveTemplateTimeRange(cfg);
  const aggFunc = cfg.aggFunc || 'last';
  const primaryDataID = cfg.dataIDs[0];
  if (!primaryDataID) {
    return {
      _iotMeta: { dataUnits: cfg.dataUnits, dataView: 'prop', mode: 'log' },
      dimensions: ['name', 'value'],
      source: [{ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.statisticValue'); }, value: null }],
    };
  }
  const primaryDataName = cfg.dataIDNames?.[primaryDataID] || primaryDataID || editorT('bigscreenEditor.ui.statisticValue');

  const areaIDs = cfg.scope === 'device' ? [] : toNumberArray(cfg.areaIDs);
  const explicitDeviceNames = cfg.scope === 'device' ? normalizeDeviceNames(cfg.deviceNames) : undefined;

  if (cfg.scope !== 'device') {
    try {
      const { list } = await fetchPartitionedPropertyLogDataset({
        aggFunc,
        areaIDs,
        dataID: primaryDataID,
        endTime,
        partitionBy: 'areaID',
        ...resolveIoTProductFilter(cfg),
        startTime,
      });

      if (list.length > 0) {
        const tsMap = new Map<string, number[]>();
        list.forEach((item: any) => {
          const ts = String(item?.timestamp ?? item?.timeWindow ?? '');
          if (!ts) return;
          const current = tsMap.get(ts) ?? [];
          const value = nullablePropertyNumber(item?.value);
          if (value === null) return;
          current.push(value);
          tsMap.set(ts, current);
        });

        const totals = [...tsMap.entries()]
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([, values]) => combineAreaValuesForSingleStat(primaryDataID, values, cfg));

        if (totals.length > 0) {
          const sum = totals.reduce((acc, value) => acc + value, 0);
          let result = 0;
          switch (aggFunc) {
            case 'avg': {
              result = sum / totals.length;
              break;
            }
            case 'max': {
              result = Math.max(...totals);
              break;
            }
            case 'min': {
              result = Math.min(...totals);
              break;
            }
            case 'sum': {
              result = sum;
              break;
            }
            case 'last':
            default: {
              result = totals[totals.length - 1] ?? 0;
              break;
            }
          }

          return {
            _iotMeta: { _chartKey: '', dataUnits: cfg.dataUnits, dataView: 'prop', mode: 'log' },
            dimensions: ['name', 'value'],
            source: [{ name: primaryDataName, value: result }],
          };
        }
      }
    } catch {
      // Fall back to the aggregate/raw-log paths below when the partitioned query is not available.
    }
  }

  if (aggFunc !== 'last') {
    try {
      const list = await fetchWholeRangeLogAgg({
        aggFunc,
        areaIDs,
        dataID: primaryDataID,
        deviceNames: explicitDeviceNames,
        endTime,
        ...resolveIoTProductFilter(cfg),
        startTime,
      });
      if (list.length === 1) {
        const detail = list[0]?.values?.find((item: any) => item?.dataID === primaryDataID);
        const value = nullablePropertyNumber(detail?.values?.[aggFunc]?.value);
        if (value !== null && Number.isFinite(value)) {
          return {
            _iotMeta: { _chartKey: '', dataUnits: cfg.dataUnits, dataView: 'prop', mode: 'log' },
            dimensions: ['name', 'value'],
            source: [{ name: primaryDataName, value }],
          };
        }
      }
    } catch {
      // Fall back to the existing raw-log path when the aggregate query is not available.
    }
  }

  let deviceNames = explicitDeviceNames ?? [];
  if (cfg.scope !== 'device') {
    const devices = await fetchDevicesByScope(cfg);
    deviceNames = devices.map((item: any) => item?.deviceName).filter((name: any): name is string => typeof name === 'string' && !!name);
  }

  if (deviceNames.length === 0) {
    return {
      _iotMeta: { _chartKey: '', dataUnits: cfg.dataUnits, dataView: 'prop', mode: 'log' },
      dimensions: ['name', 'value'],
      source: [{ name: primaryDataName, value: null }],
    };
  }

  // last 同样从窗口内全部原始样本选择最后一个 GOOD，不能只读取实际最新 BAD。
  const perDevice = await fetchBatchLogsByDevice(cfg, deviceNames, [primaryDataID], startTime, endTime);

  let totalSum = 0;
  let totalCount = 0;
  let maxVal = Number.NEGATIVE_INFINITY;
  let minVal = Number.POSITIVE_INFINITY;
  let lastVal = 0;
  let lastTs = Number.NEGATIVE_INFINITY;

  Object.values(perDevice).forEach((items: any) => {
    (items ?? []).forEach((point: any) => {
      const val = goodPropertyNumber(point);
      if (val === null) return;
      const ts = parseLogTimestamp(point?.time ?? point?.timestamp) ?? Number.NEGATIVE_INFINITY;
      totalSum += val;
      totalCount += 1;
      maxVal = Math.max(maxVal, val);
      minVal = Math.min(minVal, val);
      if (ts >= lastTs) {
        lastTs = ts;
        lastVal = val;
      }
    });
  });

  let result = 0;
  switch (aggFunc) {
    case 'count': { result = totalCount; break; }
    case 'avg': {
      result = totalCount > 0 ? totalSum / totalCount : 0;
      break;
    }
    case 'max': {
      result = totalCount > 0 ? maxVal : 0;
      break;
    }
    case 'min': {
      result = totalCount > 0 ? minVal : 0;
      break;
    }
    case 'sum': {
      result = totalSum;
      break;
    }
    case 'last':
    default: {
      result = lastVal;
      break;
    }
  }

  return {
    _iotMeta: { _chartKey: '', dataUnits: cfg.dataUnits, dataView: 'prop', mode: 'log' },
    dimensions: ['name', 'value'],
    source: [{ name: primaryDataName, value: totalCount === 0 && aggFunc !== 'count' ? null : result }],
  };
}

async function buildTrendDataset(cfg: RequestIoTDeviceConfigType): Promise<IoTDatasetResult> {
  const { endTime, startTime } = resolveTemplateTimeRange(cfg);
  const areaIDs = toNumberArray(cfg.areaIDs);
  const deviceNames = cfg.scope === 'device' ? normalizeDeviceNames(cfg.deviceNames) : undefined;
  const aggFunc = cfg.aggFunc || 'avg';
  const intervalUnit = cfg.intervalUnit || 'h';
  let timeAxisLabelFormat: 'date' | 'month' | 'time' | 'year';
  switch (intervalUnit) {
    case 'd': {
      timeAxisLabelFormat = 'date';
      break;
    }
    case 'n': {
      timeAxisLabelFormat = 'month';
      break;
    }
    case 'y': {
      timeAxisLabelFormat = 'year';
      break;
    }
    default: {
      timeAxisLabelFormat = 'time';
      break;
    }
  }

  const intervalMap: Record<string, number> = { h: 1, d: 1, n: 1, y: 1 };
  const interval = intervalMap[intervalUnit] ?? 1;

  const res = await getPropertyLogAgg({
    aggs: cfg.dataIDs.map((id) => ({ argFuncs: [aggFunc], dataID: id })),
    areaIDs: areaIDs.length > 0 ? areaIDs : undefined,
    deviceNames,
    interval,
    intervalUnit,
    ...resolveIoTProductFilter(cfg),
    timeEnd: endTime,
    timeStart: startTime,
  });

  const timeMap = new Map<string, Record<string, any>>();
  const colNamesSet = new Set<string>();
  const statMap = new Map<string, LogStats>();
  const list: any[] = res?.data?.list ?? [];

  list.forEach((deviceEntry: any) => {
    (deviceEntry?.values ?? []).forEach((point: any) => {
      const timeWindow = point?.timeWindow ?? '';
      const timeStr =
        typeof timeWindow === 'number' || /^\d+$/.test(String(timeWindow))
          ? new Date(Number(timeWindow)).toISOString().slice(0, 19)
          : String(timeWindow).slice(0, 19);
      if (!timeMap.has(timeStr)) timeMap.set(timeStr, { time: timeStr });
      const dataID = point?.dataID;
      const propName = cfg.dataIDNames?.[dataID] || dataID || cfg.dataIDs[0];
      const colName = propName;
      const statKey = `${timeStr}__${colName}`;
      const value = nullablePropertyNumber(point?.values?.[aggFunc]?.value);
      const timestamp =
        typeof timeWindow === 'number' || /^\d+$/.test(String(timeWindow)) ? Number(timeWindow) : (parseLogTimestamp(timeWindow) ?? Number.NEGATIVE_INFINITY);
      const stats = statMap.get(statKey) ?? {
        count: 0,
        lastTs: Number.NEGATIVE_INFINITY,
        lastValue: 0,
        max: Number.NEGATIVE_INFINITY,
        min: Number.POSITIVE_INFINITY,
        sum: 0,
      };
      mergeLogPoint(stats, value, timestamp);
      statMap.set(statKey, stats);
      colNamesSet.add(colName);
    });
  });

  for (const [statKey, stats] of statMap.entries()) {
    const separatorIndex = statKey.indexOf('__');
    const timeStr = statKey.slice(0, separatorIndex);
    const colName = statKey.slice(separatorIndex + 2);
    const row = timeMap.get(timeStr);
    if (!row) continue;
    row[colName] = aggregateBucketValue(aggFunc, stats);
  }

  const source = sortTimeRowsAsc([...timeMap.values()]);
  return {
    _iotMeta: { dataUnits: cfg.dataUnits, dataView: 'prop', mode: 'log', timeAxisLabelFormat },
    dimensions: ['time', ...colNamesSet],
    source,
  };
}

async function buildRankingDataset(cfg: RequestIoTDeviceConfigType): Promise<IoTDatasetResult> {
  const { endTime, startTime } = resolveTemplateTimeRange(cfg);
  const aggFunc = cfg.aggFunc || 'sum';
  const groupBy = normalizeRankingGroupBy(cfg.groupBy);
  const devices = await fetchDevicesByScope(cfg);
  const deviceNames = devices.map((item: any) => String(item?.deviceName ?? '').trim()).filter(Boolean);
  if (deviceNames.length === 0 || !cfg.dataIDs?.length) {
    return {
      _iotMeta: { dataUnits: cfg.dataUnits, dataView: 'prop', mode: 'log' },
      dimensions: ['name', 'value'],
      source: [],
    };
  }

  if (cfg.dataIDs.length === 1) {
    try {
      const dataID = cfg.dataIDs[0]!; // 外层已守卫 dataIDs.length === 1
      const serverList = await fetchWholeRangeLogAgg({
        aggFunc,
        dataID,
        deviceNames,
        endTime,
        partitionBy: 'deviceName',
        ...resolveIoTProductFilter(cfg),
        startTime,
      });
      if (serverList.length > 0) {
        const deviceMetaMap = new Map(
          devices
            .map((item: any) => {
              const deviceName = String(item?.deviceName ?? '').trim();
              return deviceName ? [deviceName, item] : null;
            })
            .filter((item): item is [string, any] => Array.isArray(item)),
        );
        const areaNameMap = groupBy === 'area' ? await buildAreaNameMap(resolveDevicesProjectID(devices)) : undefined;
        const groupMap = new Map<string, number>();
        serverList.forEach((entry: any) => {
          const deviceName = String(entry?.deviceName ?? '').trim();
          const deviceEntry = deviceMetaMap.get(deviceName);
          if (!deviceEntry) return;
          const key = resolveRankingGroupLabel(deviceEntry, groupBy, areaNameMap);
          const detail = entry?.values?.find((item: any) => item?.dataID === dataID);
          const value = nullablePropertyNumber(detail?.values?.[aggFunc]?.value);
          if (value === null || !Number.isFinite(value)) return;
          groupMap.set(key, (groupMap.get(key) ?? 0) + value);
        });

        let source = [...groupMap.entries()].map(([name, value]) => ({ name, value }));
        const sortBy = cfg.sortBy || 'valueDesc';
        source.sort((a, b) => (sortBy === 'valueAsc' ? a.value - b.value : b.value - a.value));
        const limit = Math.max(1, Math.min(100, cfg.limit ?? 10));
        source = source.slice(0, limit);

        return {
          _iotMeta: { dataUnits: cfg.dataUnits, dataView: 'prop', mode: 'log' },
          dimensions: ['name', 'value'],
          source,
        };
      }
    } catch {
      // Fall back to the raw-log path when the aggregate query is not available.
    }
  }

  const perDevice = await fetchBatchLogsByDevice(cfg, deviceNames, cfg.dataIDs, startTime, endTime);
  const groupMap = new Map<string, number>();
  const areaNameMap = groupBy === 'area' ? await buildAreaNameMap(resolveDevicesProjectID(devices)) : undefined;
  const groupStatsMap = new Map<string, LogStats>();

  devices.forEach((deviceEntry: any) => {
    const deviceName = String(deviceEntry?.deviceName ?? '').trim();
    if (!deviceName) return;
    const key = resolveRankingGroupLabel(deviceEntry, groupBy, areaNameMap);
    const stats = groupStatsMap.get(key) ?? createEmptyLogStats();

    (perDevice[deviceName] ?? []).forEach((point: any) => {
      mergeLogPoint(stats, goodPropertyNumber(point), point?.time ?? point?.timestamp);
    });
    groupStatsMap.set(key, stats);
  });

  groupStatsMap.forEach((stats, key) => {
    const value = aggregateBucketValue(aggFunc, stats);
    if (value !== null) groupMap.set(key, value);
  });

  let source = [...groupMap.entries()].map(([name, value]) => ({ name, value }));
  const sortBy = cfg.sortBy || 'valueDesc';
  source.sort((a, b) => (sortBy === 'valueAsc' ? a.value - b.value : b.value - a.value));
  const limit = Math.max(1, Math.min(100, cfg.limit ?? 10));
  source = source.slice(0, limit);

  return {
    _iotMeta: { dataUnits: cfg.dataUnits, dataView: 'prop', mode: 'log' },
    dimensions: ['name', 'value'],
    source,
  };
}

export function buildIoTDatasetByChartMode(cfg: RequestIoTDeviceConfigType): Promise<any> {
  const chartMode = cfg.chartMode;
  switch (chartMode) {
    case 'aggregate': {
      return buildRankingDataset(cfg);
    }
    case 'singleStat': {
      return buildSingleStatDataset(cfg);
    }
    case 'trend': {
      return buildTrendDataset(cfg);
    }
    default: {
      throw new Error(editorT('bigscreenEditor.dynamic.message52', { mode: String(chartMode) }));
    }
  }
}

export async function buildIoTDataset(cfg: RequestIoTDeviceConfigType, chartKey: string): Promise<any> {
  const queryType = (cfg.queryType ?? 'property') as QueryType;

  // TASK-045: 模板级聚合模式优先路由
  if (queryType === 'property' && cfg.chartMode) {
    return buildIoTDatasetByChartMode(cfg);
  }

  switch (queryType) {
    case 'deviceInfo': {
      return buildDeviceInfoDataset(cfg, chartKey);
    }
    case 'deviceStatus': {
      return buildDeviceStatusDataset(cfg, chartKey);
    }
    case 'property':
    default: {
      return buildPropertyDataset(cfg, chartKey);
    }
  }
}

// ==================== WS 实时推送合并（latest 模式） ====================

/** 实时属性消息（与 projectRealtime 中枢的负载结构一致，此处独立声明避免循环依赖） */
export interface IoTRealtimePropMessage {
  device: { deviceName: string; productID: string };
  /** 单属性质量或批量属性质量映射。 */
  quality?: string | Record<string, string>;
  /** 平台接收时间。 */
  receivedTime?: number | string | null;
  identifier?: string;
  param?: unknown;
  params?: Record<string, unknown>;
}

/** 从消息中提取 { identifier: value } 键值对（兼容批量 params 与单属性 identifier/param 两种负载） */
function extractRealtimeParams(msg: IoTRealtimePropMessage): Array<[string, unknown]> {
  if (msg.params && typeof msg.params === 'object') return Object.entries(msg.params);
  return msg.identifier ? [[msg.identifier, msg.param]] : [];
}

/**
 * 在数据集的维度中定位属性标识符对应的列名。
 * 列名规则与首载一致（dataName || dataID），因此按 dataIDNames 反查或直接匹配标识符。
 */
function resolveRealtimeColumn(dimensions: string[], cfg: RequestIoTDeviceConfigType, identifier: string): string | undefined {
  const alias = cfg.dataIDNames?.[identifier];
  if (alias && dimensions.includes(alias)) return alias;
  if (dimensions.includes(identifier)) return identifier;
  // 首载列名来自服务端 dataName，dataIDNames 未覆盖时无法反查，放弃该列
  return undefined;
}

/**
 * 将 WS 实时属性消息合并进 latest 模式数据集。
 * 返回新的数据集对象（不可变更新，保留 _iotMeta/dimensions 供渲染通道继续使用）；
 * 未命中任何列或设备行时返回 null，调用方无需触发重绘。
 *
 * 适用：queryType=property 且 mode='latest' 的 prop（单设备宽表）/ device（多设备宽表）视图。
 * 不适用：log 历史模式、deviceStatus/deviceInfo/agg 视图（返回 null）。
 */
export function applyRealtimePropToDataset(
  prevDataset: any,
  cfg: RequestIoTDeviceConfigType,
  msgs: IoTRealtimePropMessage[],
): any | null {
  const dataView = prevDataset?._iotMeta?.dataView;
  if (!prevDataset || cfg.mode !== 'latest' || (dataView !== 'prop' && dataView !== 'device')) return null;
  const dimensions: string[] = prevDataset.dimensions ?? [];
  const prevSource: Array<Record<string, any>> = prevDataset.source ?? [];

  // 先复制 source 顶层数组，行级按需复制
  let nextSource = prevSource;
  let changed = false;
  const qualityWarnings = { ...prevDataset._iotMeta?.qualityWarnings };
  const ensureRowCopy = (index: number) => {
    if (!changed) {
      nextSource = [...prevSource];
      changed = true;
    }
    nextSource[index] = { ...nextSource[index] };
    return nextSource[index];
  };

  for (const msg of msgs) {
    for (const [identifier, value] of extractRealtimeParams(msg)) {
      const column = resolveRealtimeColumn(dimensions, cfg, identifier);
      if (!column) continue;
      const quality = typeof msg.quality === 'string' ? msg.quality : msg.quality?.[identifier];
      const qualityKey = `${msg.device.deviceName}:${identifier}`;
      if (propertyQualityLabel({ quality }) === '良好') delete qualityWarnings[qualityKey];
      else qualityWarnings[qualityKey] = `${column}：${propertyQualityLabel({ quality })}`;
      if (dataView === 'prop') {
        // 单设备宽表：仅一行
        if (prevSource.length === 0) continue;
        ensureRowCopy(0)[column] = goodPropertyNumber({ value, quality: typeof msg.quality === 'string' ? msg.quality : msg.quality?.[identifier] });
      } else {
        // 多设备宽表：按 device 列定位行
        const rowIndex = nextSource.findIndex((row) => row?.device === msg.device.deviceName);
        if (rowIndex < 0) continue;
        ensureRowCopy(rowIndex)[column] = goodPropertyNumber({ value, quality: typeof msg.quality === 'string' ? msg.quality : msg.quality?.[identifier] });
      }
    }
  }

  return changed ? { ...prevDataset, source: nextSource, _iotMeta: { ...prevDataset._iotMeta, qualityWarnings } } : null;
}
